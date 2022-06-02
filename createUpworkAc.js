const playwright = require('playwright');
const Charlatan = require('charlatan');
const moment = require('moment');
const fs = require('fs');
const {getIpDetails, getProxies} = require('./proxy')
const dotenv = require("dotenv")

dotenv.config()

async function prepareBrowser(proxies) {
    const res = await getIpDetails(proxies);
    const browser = await playwright.firefox.launch({
        headless: false, // Show the browser. 
        firefoxUserPrefs: {
            "media.peerconnection.enabled" : false
        },
        args: ['--start-maximized','--start-in-incognito']
    });
    const context = await browser.newContext({
        timezoneId: res.timezone,
        locale: 'en-'+res.country,
        proxy: {
            server: `http://${proxies.proxy_address}:${proxies.ports.http}`,
            username: proxies.username,
            password: proxies.password
        },
    });

    return context;
}
function random_password_generate(max,min, charset="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#@!%&()/")
{
    const passwordChars = charset;
    var randPwLen = Math.floor(Math.random() * (max - min + 1)) + min;
    var randPassword = Array(randPwLen).fill(passwordChars).map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    return randPassword;
}

function random_email_generate()
{
    const emailChars = "0123456789abcdefghijklmnopqrstuvwxyz";
    const randEmLen = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
    const randEmail = Array(randEmLen).fill(emailChars).map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    return randEmail+'.'+random_password_generate(4,2,'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')+'+'+random_password_generate(4,2,'0123456789')+'@gmail.com';
}

async function waitForTimeout (page, timeout) {
    await page.evaluate((timeout) => {
        // if this doesn't work, you can try to increase 0 to a higher number (i.e. 100)
        return new Promise((resolve) => setTimeout(resolve, timeout));
      },timeout);
}

async function submitForm(page) {
    try {
        await Promise.all([
            page.waitForNavigation({timeout: 3000}),
            page.click(`#button-submit-form`),
        ]);
    } catch (e) {
        if (e.name === 'TimeoutError') {
            await Promise.all([
                page.waitForNavigation(),
                page.click(`#button-submit-form`),
            ]);
        }
    }
}

async function createAccount(page, {firstname, lastname, email, password}) {
    const url = 'https://www.upwork.com/nx/signup/';
    await page.goto(url);
    const offset = new Date().getTimezoneOffset()/60 * -1;
    let timezone = '';
    if (offset>0) {
        timezone = "+"+String(Math.floor(offset)).padStart(2, '0')+":"+String((offset % 1)*60).padStart(2, '0')+",0";
    } else {
        timezone = "-"+String(Math.floor(Math.abs(offset))).padStart(2, '0')+":"+String((offset % 1)*60).padStart(2, '0')+",0";
    }
    const country_code = await page.evaluate(() => navigator.language.split('-')[navigator.language.split('-').length-1]);
    
    const country = new Intl.DisplayNames(['en'], {type: 'region'}).of(country_code);
    
    const payload = JSON.stringify({"flowName":"client_high_potential","queryParams":{"signupNuxt":true},"enterpriseConfirmEmail":false,"ioBB":"","ioBBLastError":null,"socialNetworkName":null,"companiesToJoin":[],"userAccount":{"firstName":firstname,"lastName":lastname,"email":email,"country":country,"promotionalEmailOptIn":true,"timezone":timezone,"password":password,"termsAccepted":true,"companyName":null,"username":null}});

    const resp = await page.evaluate(async (payload) => {
        const cookie_string = document.cookie;
        const XSRF_cookie = document.cookie.split('; ').reduce((prev, current) => {
            const [name, ...value] = current.split('=');
            prev[name] = value.join('=');
            return prev;
          }, {})['XSRF-TOKEN'];

        const headers = new Headers({
            'authority': 'www.upwork.com',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'content-type': 'application/json',
            'cookie': cookie_string,
            'origin': 'https://www.upwork.com',
            'referer': 'https://www.upwork.com/nx/signup/?dest=home',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': navigator.userAgent,            
            'x-odesk-csrf-token': XSRF_cookie,
            'x-odesk-user-agent': 'oDesk LM',
            'x-requested-with': 'XMLHttpRequest',
            'TE': 'trailers'
        });
        
        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: payload,
            redirect: 'follow',
            credentials: 'same-origin'
        };
        console.table({
            'authority': 'www.upwork.com',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'content-type': 'application/json',
            'cookie': cookie_string,
            'origin': 'https://www.upwork.com',
            'referer': 'https://www.upwork.com/nx/signup/?dest=home',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': navigator.userAgent,            
            'x-odesk-csrf-token': XSRF_cookie,
            'x-odesk-user-agent': 'oDesk LM',
            'x-requested-with': 'XMLHttpRequest',
            'TE': 'trailers'
        })
        console.table(requestOptions)
        try {
            const response = await fetch("https://www.upwork.com/signup/api/useraccounts/register.json", requestOptions);
            const json_res = await response.json();
            console.log(json_res);
            if (json_res?.user === undefined || json_res?.user === null) 
                throw new Error("unable to create new account");
            const headers = Array.from(response.headers.entries()).reduce((prev,cur) => {
                prev[cur[0]] = cur[1];
                return prev;
            }, {})
            console.table(headers);
            return headers;
        } catch (error) {
            console.log("couldn't register the new account", error);
            return null;
        }
    }, payload);
    if (resp !== null) console.log('account created');
    else console.log("unable to create new account");
    return resp;
}

async function loginAccount(page, {email, password}, payload=null, error=false) {
    const url = 'https://www.upwork.com/ab/account-security/login?redir=%2Fsignup%2Fhome';
    await page.goto(url);
    if (payload === null) {
        payload = {"login":{"mode":"password","iovation":"","username":email,"rememberme":false,"elapsedTime":24405,"password":password}};
     }
    const result = await page.evaluate(async (payload) => {
        const cookie_string = document.cookie;
        const XSRF_cookie = document.cookie.split('; ').reduce((prev, current) => {
            const [name, ...value] = current.split('=');
            prev[name] = value.join('=');
            return prev;
          }, {})['XSRF-TOKEN'];

        const headers = new Headers({
            'authority': 'www.upwork.com',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'content-type': 'application/json',
            'cookie': cookie_string,
            'origin': 'https://www.upwork.com',
            'referer': 'https://www.upwork.com/nx/signup/?dest=home',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': navigator.userAgent,            
            'x-odesk-csrf-token': XSRF_cookie,
            'x-odesk-user-agent': 'oDesk LM',
            'x-requested-with': 'XMLHttpRequest',
            'TE': 'trailers'
        });
        console.table({
            'authority': 'www.upwork.com',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'content-type': 'application/json',
            'cookie': cookie_string,
            'origin': 'https://www.upwork.com',
            'referer': 'https://www.upwork.com/nx/signup/?dest=home',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': navigator.userAgent,            
            'x-odesk-csrf-token': XSRF_cookie,
            'x-odesk-user-agent': 'oDesk LM',
            'x-requested-with': 'XMLHttpRequest',
            'TE': 'trailers'
        });
        console.table(payload);
        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            redirect: 'follow',
            credentials: 'include'
        };
        try {
            const response = await fetch("https://www.upwork.com/ab/account-security/login?redir=%2Fsignup%2Fhome", requestOptions);
            const json_res = await response.json();
            console.log(json_res);
            
                // requestOptions.body = JSON.stringify(Object.assign(payload, {"securityCheckCertificate":json_res?.securityCheckCertificate, "authToken":json_res?.authToken}));
                // requestOptions.headers = headers;
                // try {
                //     const response = await fetch("https://www.upwork.com/ab/account-security/login?redir=%2Fsignup%2Fhome", requestOptions);
                //     const json_res = await response.json();
                //     if (json_res?.success === undefined || json_res?.success === null || json_res?.success !== 1) 
                //         throw new Error("unable to login");
                // } catch (err) {}
            
            if (json_res?.securityCheckCertificate !== undefined) 
                return {message: Object.assign(json_res, {error: "securityCheckCertificate error"}), cookies: null, status: 'error'};

            if (json_res?.success === undefined || json_res?.success === null || json_res?.success !== 1) 
                throw new Error("unable to login");
            
            const cookies = Array.from(response.headers.entries()).reduce((prev,cur) => {
                // if (cur[0] === 'Set-Cookie')
                    prev.push({name:cur[0], value: cur[1]});
                return prev;
            }, []);
            return {message: json_res, cookies: cookies, status: 'success'};
        } catch (error) {
            console.log("couldn't login account", error);
            return {message: {error: error.message}, cookies:null, status: 'error'};
        }
    }, payload);

    if (result?.message?.error === "securityCheckCertificate error" && error === false) {
        // headers.set('cookie', document.cookie);
        payload = Object.assign(payload, {"securityCheckCertificate":result?.message?.securityCheckCertificate, "authToken":result?.message?.authToken});
        return loginAccount(page,{email, password}, payload=payload, error=true);
    }
    if (result.status == 'error') {
        console.log('Unable to Login to the account! try again!'); 
        return null;
    }
    console.log('Logged in successfully!');
    // await page.context().addCookies(cookies);
    const browser_cookies = await  page.context().cookies();
    let cookie_string = ''
    browser_cookies.forEach((v) => {
        cookie_string += `${v.name}=${v.value}; `;
    })
    fs.writeFileSync(`cookies/cookies.json`, cookie_string);
    return result?.cookies;
}

async function closeAccount(page) {
    const url = "https://www.upwork.com/ab/account-security/password-and-security"
    await page.goto(url);
    await page.click(`#button-security-question`, {noWaitAfter: true});
    await waitForTimeout(page, 1000);
    await page.locator(`//input[@id='securityQuestion_lockingNotice']`).check({ force: true });
    const sec_ans = await page.waitForSelector(`#securityQuestion_answer`);
    await sec_ans.type('jethalal', {delay: 100});
    
    await page.click(`#control_save`);
    await waitForTimeout(page, 1000);
    try {
        const pwd = await page.waitForSelector(`#sensitiveZone_password`, { timeout: 5000 });
        await pwd.type(personDetails.password, {delay: 100});
        await page.click(`//button[@id='control_save'][@target-form="sensitiveZone"]`);
        // ...`enter code here`
    } catch (error) {

    }
    
    // 
    // #control_save

    // closing the account
    // https://www.upwork.com/nx/client-info/
    // document.querySelector(`main[id='main']:not([tabindex])`).querySelector(`div[class="up-card mx-md-0 mb-xs-0"]`).querySelector('button:last-child')

    

}

(async function main() {
    const proxies = await getProxies(country='IT');
    const personDetails = {
        "firstname": "Alden",
        "lastname": "Stark",
        "email": "0rjz8h.Mr+597@gmail.com",
        "password": "BG@V0PHkfqU",
        "country": "Italy",
        "country-code": "IT",
        "date_created": "2022-06-01 14:32:27"
    }
    // const personDetails = {
    //     firstname: Charlatan.Name.firstName().replace(/[^\x00-\x7F]/g, ""),
    //     lastname: Charlatan.Name.lastName().replace(/[^\x00-\x7F]/g, ""),
    //     email: random_email_generate(),
    //     'password': random_password_generate(16,8),
    //     country: new Intl.DisplayNames(['en'], {type: 'region'}).of(proxies[0].country_code),
    //     'country-code': proxies[0].country_code,
    //     date_created: moment().utc().format('YYYY-MM-DD HH:mm:ss')
    // }
    console.log(JSON.stringify(personDetails,null,4));

    const browser = await prepareBrowser(proxies[0]);
    // let page = await browser.newPage();
    // const c = await createAccount(page, personDetails);
    // console.log(c);
    // await browser.clearCookies();
    // await page.close();
    // function sleep(ms) {
    //     return new Promise((resolve) => setTimeout(resolve, ms));
    //   }
    
    // await sleep(10000);
    page = await browser.newPage();
    const d = await loginAccount(page, personDetails);
    console.log(d);
    // await closeAccount(page);
    
})();