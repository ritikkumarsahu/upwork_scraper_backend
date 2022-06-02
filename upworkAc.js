const playwright = require('playwright');
const Charlatan = require('charlatan');
const moment = require('moment');
const fs = require('fs');
const {getIpDetails, getProxies} = require('./proxy')
const {random_password_generate, random_email_generate} = require('./utils')
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

async function createAccount({firstname, lastname, email, password}) {
    const proxies = await getProxies();
    const browser = await prepareBrowser(proxies[0]);
    const page = await browser.newPage();
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
            return payload;
        } catch (error) {
            console.log("couldn't register the new account", error);
            return null;
        }
    }, payload);
    if (resp !== null) console.log('account created');
    else console.log("unable to create new account");
    await browser.browser().close();
    return resp;
}

async function loginAccount({email, password}, browser=null, proxies=null, page=null, payload=null, error=false) {

    if (error === false) {
        proxies = await getProxies();
        browser = await prepareBrowser(proxies[0]);
        page = await browser.newPage();
        const url = 'https://www.upwork.com/ab/account-security/login?redir=%2Fsignup%2Fhome';
        await page.goto(url);
    }
    if (page === null) {
        proxies = await getProxies();
        browser = await prepareBrowser(proxies[0]);
        page = await browser.newPage();
    }
    if (payload === null) {
        payload = {"login":{"mode":"password","iovation":"","username":email,"rememberme":false,"elapsedTime":24405,"password":password}};
    }
    // [
    //     'AccountSecurity_cat',   
    //     'DA_a1d306b9',
    //     'DA_441bef9f',
    //     'device_view',
    //     'user_oauth2_slave_access_token',
    //     'odesk_signup.referer.raw',
    //     '__cfruid',
    //     '_sp_ses.2a16',
    //     'clob_signup_cookie',    
    //     '__cf_bm'
    // ]
    // extra_cookies = await browser.cookies('')
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
        return loginAccount({email, password}, browser, proxies, page, payload=payload, error=true);
    }
    if (result.status == 'error') {
        console.log('Unable to Login to the account! try again!'); 
        await browser.browser().close();
        return null;
    }
    console.log('Logged in successfully!');
    // await browser.addCookies(cookies);
    const browser_cookies = await  browser.cookies();
    await browser.browser().close();
    return browser_cookies;
}

async function closeAccount(cookies) {
    const proxies = await getProxies();
    const browser = await prepareBrowser(proxies[0]);
    browser.addCookies(cookies);
    const page = await browser.newPage();
    const url = "https://www.upwork.com/ab/account-security/password-and-security"
    await page.goto(url);
    const payload = {"reason":"182"}
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
        const requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            redirect: 'follow'
        };
        try {
            const response = await fetch("https://www.upwork.com/freelancers/settings/api/v1/deactivate-account", requestOptions);
            const json_res = await response.json();
            console.log(json_res);
            return true;
        } catch (err) {
            console.log("couldn't delete account", error);
            return false;
        }
    }, payload);
    await browser.browser().close();
    if (result === true) {
        console.log('account deleted successfully!');
        return true;
    } 
    return null;
    

}

// (async function main() {
//     const proxies = await getProxies(country='IT');
//     const personDetails = {
//         "firstname": "Hershel",
//         "lastname": "Macejkovic",
//         "email": "qvu2v23b8u7k.jj9+575@gmail.com",
//         "password": "oxFdVq9#",
//         "country": "Italy",
//         "country-code": "IT",
//         "date_created": "2022-06-02 13:41:51"
//     };
//     // const personDetails = {
//     //     firstname: Charlatan.Name.firstName().replace(/[^\x00-\x7F]/g, ""),
//     //     lastname: Charlatan.Name.lastName().replace(/[^\x00-\x7F]/g, ""),
//     //     email: random_email_generate(),
//     //     'password': random_password_generate(16,8),
//     //     country: new Intl.DisplayNames(['en'], {type: 'region'}).of(proxies[0].country_code),
//     //     'country-code': proxies[0].country_code,
//     //     date_created: moment().utc().format('YYYY-MM-DD HH:mm:ss')
//     // }
//     console.log(JSON.stringify(personDetails,null,4));

//     // const browser = await prepareBrowser(proxies[0]);
//     // let page = await browser.newPage();
//     // const c = await createAccount(page, personDetails);
//     // console.log(c);
//     // await browser.clearCookies();
//     // await browser.browser().close();
//     function sleep(ms) {
//         return new Promise((resolve) => setTimeout(resolve, ms));
//       }
    
//     // await sleep(10000);
//     const c = await loginAccount(proxies[1], personDetails);
//     // await sleep(60000);
//     await closeAccount(proxies[1], c);
    
// })();

module.exports = {createAccount, loginAccount, closeAccount};