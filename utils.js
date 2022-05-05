const sendRequest = require("./requests");

function makeUrl(amount,page,per_page,keyword){
    safe_url = `client_hires=1-9,10-&amount=${amount}-&payment_verified=1&duration_v3=ongoing&page=${page}&per_page=${per_page}&q=${encodeURI(keyword)}&sort=recency&user_location_match=2&t=0,1`
    return `https://www.upwork.com/search/jobs/url?${safe_url}`
}

async function getJobDetails(job_id) {
    const url = `https://www.upwork.com/ab/jobs/search/jobdetails/visitor/${job_id}/details`
    const details = await sendRequest(url);
    return details;
}
async function getPageDetails(keyword,page, per_page=50) {
    const url = makeUrl(5000,page,per_page,keyword);
    const details = await sendRequest(url);
    return details;
}

async function testURL(url) {
    const details = await sendRequest(url);
    return details;
}

module.exports = {makeUrl, getJobDetails, getPageDetails, testURL} ;