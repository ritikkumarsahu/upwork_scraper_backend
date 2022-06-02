const sendRequest = require("./requests");

function makeUrl(amount,page,per_page,keyword){
    safe_url = `client_hires=1-9,10-&amount=${amount}-&page=${page}&per_page=${per_page}&q=${encodeURI(keyword)}&sort=recency&user_location_match=2`
    return `https://www.upwork.com/search/jobs/url?${safe_url}`
}

async function getJobDetails(job_id, is_login=false) {
    const url = `https://www.upwork.com/ab/jobs/search/jobdetails/visitor/${job_id}/details`
    const details = await sendRequest(url, is_login);
    return details;
}
async function getPageDetails(keyword,page, per_page=50, is_login= false) {
    const url = makeUrl(2000,page,per_page,keyword);
    const details = await sendRequest(url, is_login);
    return details;
}

async function testURL(url, is_login= false) {
    const details = await sendRequest(url,is_login);
    return details;
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
module.exports = {makeUrl, getJobDetails, getPageDetails, testURL, random_password_generate, random_email_generate} ;