const playwright = require('playwright');
const crypto = require("crypto");
const fs = require('fs');
const {getIpDetails, getProxies} = require('./proxy')

// TODO: check if cookies are expired
async function is_logged_in(username){
    try {
        const cookies_file = fs.readFileSync('./cookies/'+username+'_cookies.json', 'utf8');
        if (cookies_file !== null) {
            const cookies = JSON.parse(cookies_file);
            user_token = cookies.find(cookie => {
                return cookie.name === 'user_oauth2_slave_access_token';
            });
            if (user_token !== undefined) {
                const epoch = Math.floor(new Date().getTime() / 1000);
                if (user_token.expires >= epoch) return cookies;
            }
        }
    }
    catch (e) {return null;}

    return null;
}

async function preparePage(browser, user_id, proxies) {
    const res = await getIpDetails(proxies);
    const context = await browser.newContext({
        timezoneId: res.timezone,
        proxy: {
            server: `http://${proxies.proxy_address}:${proxies.ports.http}`,
            username: proxies.username,
            password: proxies.password
        },
    });

    const cookies = await is_logged_in(user_id);
    if (cookies === null) {
        const loginPage = await context.newPage();
        await login(loginPage);
    }
    else {
        await context.addCookies(cookies);
    }
    context.setExtraHTTPHeaders({'accept': 'application/json, text/plain, */*',
    'x-requested-with': 'XMLHttpRequest'});
    return context;
}

async function waitForTimeout (page, timeout) {
    await page.evaluate((timeout) => {
        // if this doesn't work, you can try to increase 0 to a higher number (i.e. 100)
        return new Promise((resolve) => setTimeout(resolve, timeout));
      },timeout);

    // await page.evaluate((timeout) => { 
    //     return Promise.resolve(setTimeout(resolve, timeout), x);
    // }, timeout)
}
async function login(page) {
    url = 'https://www.upwork.com/ab/account-security/login';
    await page.goto('https://proxy6.net/en/privacy');
    await waitForTimeout(page,5000);
    await page.goto(url);
    await page.evaluate(()=>{
        function checkPageIsOk() {return true;}
    })
    // await page.waitForSelector(`//input[@id='login_username']`);
    await page.fill(`//input[@id='login_username']`, process.env.UPWORK_USERID);
    // await page.waitForSelector(`//button[@id='login_password_continue']`);
    await page.click(`//button[@id='login_password_continue']`);
    // await waitForTimeout(page,crypto.randomInt(2000, 4000));
    await page.fill(`//input[@id='login_password']`, process.env.UPWORK_PASSWORD)
    // await page.evaluate(()=>{
    //     console.log('login_password_continue'+document.getElementById('login_password').value);
    //     document.getElementById('login_password').value = 'i33F9W72m4E9u7e';
    //     console.log('login_password_continue'+document.getElementById('login_password').value);
    // })
    // await page.waitForSelector(`//input[@id='login_rememberme']`);
    // await page.click(`//input[@id='login_rememberme']`);
    await page.evaluate(()=>document.getElementById('login_rememberme').checked = true);
    await page.locator(`//button[@id='login_control_continue']`).click();
    // check if security que was asked (ans field = //input[@id='login_answer'], continue_btn = //button[@id='login_control_continue'])
    const is_login_security = await page.waitForSelector(`//input[@id='login_answer']`, {timeout: 8000});
    if (is_login_security !== null) {
        // await waitForTimeout(page,crypto.randomInt(2000, 4000));
        await page.fill(`#login_answer`, process.env.UPWORK_LOGIN_ANS);
    }

    await Promise.all([
        // It is important to call waitForNavigation before click to set up waiting.
        page.waitForNavigation(),
        // Clicking the link will indirectly cause a navigation.
        page.locator(`//button[@id='login_control_continue']`).click(),
    ]);

    const cookies = await page.context().cookies();
    const cookieJson = JSON.stringify(cookies);
    const cookies_dir = './cookies/'
    if (!fs.existsSync(cookies_dir)){
        fs.mkdirSync(cookies_dir);
    }
    fs.writeFileSync(cookies_dir+process.env.UPWORK_USERID+'_cookies.json', cookieJson);
    
    await page.close();
}

async function sendRequest(urls) {
    if (typeof urls === 'string') {
        urls = [urls];
    }
    const proxies = await getProxies();

    const browser = await playwright.firefox.launch({
        headless: false, // Show the browser. 
        firefoxUserPrefs: {
            "media.peerconnection.enabled" : false
        },
        args: ['--start-maximized','--start-in-incognito']
    });

    const jobs = [];
    let max_try = 5;
    let context = await preparePage(browser,process.env.UPWORK_USERID, proxies[0]);
    let page = await context.newPage();
    while (urls.length > 0) {
        let response;
        try {
            response = await page.goto(urls[0]);
        } catch (e) {
            console.error(e);
            response = {status: () => 500, url: () => urls[0], }
        }

        console.log({
            url: response.url(),
            statusCode: response.status(),
            max_try: max_try,
            proxy: proxies[0].proxy_address+':'+proxies[0].ports.http,
        });

        if (response.status() !== 200) {
            // let splitted_url = response.url().split("/");
            // await page.goto(`https://www.upwork.com/jobs/${splitted_url[splitted_url.length-2]}`);
            await waitForTimeout(page,10000);
            // rotating the proxy
            proxies.push(proxies.shift());
            // creating new context session with new proxy
            context.close();
            context = await preparePage(browser, process.env.UPWORK_USERID, proxies[0]);
            page = await context.newPage();
            if (max_try > 1) {
                max_try--;
                continue;
            }
            else {
                urls.shift();
                max_try = 5;
            }
        }
        else {
            let jsonParsed = {}
            try {
                jsonParsed = JSON.parse(await response.text()) ;
                let ciphertext=null;
                if (String(urls[0]).includes("https://www.upwork.com/")){
                    ciphertext = urls[0].match(/~([^\/]*)/) === null ? null : urls[0].match(/~([^\/]*)/)[0];
                }
                jsonParsed["ciphertext"] = ciphertext;
                jsonParsed["fullUrl"] = urls[0];
                jobs.push(jsonParsed);
              } catch(err) {
                console.error(err);
              }
            // dummy page simulation for bot detection bypass
            // const dummyPage = await browser.newPage();
            // await simulate('https://www.upwork.com/nx/jobs/search/?sort=recency',dummyPage);
            urls.shift();
        }
    }
    await browser.close();
    return jobs;
}; 

module.exports = sendRequest;