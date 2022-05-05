const moment = require('moment');
const fs = require("fs");
countries = ['India'];
client_spent = 10000;
keyword = '';

const main = (job_data) => {
    try {
        if (job_data['buyer']['stats']['totalCharges']['amount'] < client_spent) return;
        if (countries.includes(String(job_data['buyer']['location']['country']).toLowerCase())) return;
        const lastBuyerActivity = job_data["job"]["clientActivity"]["lastBuyerActivity"];
        last_seen_date =  lastBuyerActivity !== '' ? moment(lastBuyerActivity).utc(0) : moment().utc(0);
        if (Math.round((moment().utc(0).startOf('day') - lastBuyerActivity) / 86400000) > 10) return;
        const totalHired = job_data["job"]["clientActivity"]["totalHired"];
        const hired =  totalHired !== 0 ? totalHired : 0 ;
        if (hired > 0) return;
    } catch (err) {}

    const _data = {
        "keyword":keyword,
        "title":job_data["job"]["title"],
        "link":'https://www.upwork.com/job/'+job_data["job"]["ciphertext"],
        "posted_on":job_data["job"]["postedOn"],
        "country":job_data["buyer"]["location"]["country"],
        "total_jobs_posted":job_data["buyer"]["jobs"]["postedCount"],
        "open_jobs":job_data["buyer"]["jobs"]["openCount"],
        "total_reviews":job_data["buyer"]["stats"]["feedbackCount"],
        "rating": +Number(job_data["buyer"]["stats"]["score"]).toFixed(2),
        "total_hires":job_data["buyer"]["stats"]["totalJobsWithHires"],
        "client_since":job_data["buyer"]["company"]["contractDate"],      
        "client_spent":job_data["buyer"]["stats"]["totalCharges"]["amount"],  
        "is_payment_verified":job_data["buyer"]["isPaymentMethodVerified"],
        "currency_code":job_data["job"]["budget"]["currencyCode"],
        "job_level":job_data["job"]["contractorTier"],
        "project_length":job_data["job"]["durationIdV3"],
    }
    if (job_data["job"]["budget"]["amount"]){
        _data['hourly_budget_min'] = null;
        _data['hourly_budget_max'] = null;
        _data['fixed_budget'] = job_data["job"]["budget"]["amount"];
        _data['is_job_fixed'] = true;
    }
    else{
        _data['hourly_budget_min'] = job_data["job"]["extendedBudgetInfo"]["hourlyBudgetMin"];
        _data['hourly_budget_max'] = job_data["job"]["extendedBudgetInfo"]["hourlyBudgetMax"];
        _data['fixed_budget'] = null;
        _data['is_job_fixed'] = false;

    }
    const skills = [];
    const ontologySkills = job_data["sands"]["ontologySkills"];
    for (let i in ontologySkills) {
        skills.push(ontologySkills[i]['name']);
        const children = ontologySkills[i]["children"];
        for (let j in children)
            skills.push(children[j]['name']);
    }
    const additionalSkills = job_data["sands"]["additionalSkills"];
    for (let i in additionalSkills){
        skills.push(additionalSkills[i]['name']);
        const children = additionalSkills[i]["children"];
        for (let j in children)
            skills.push(children[j]['name']);
    }
    _data['skills'] = skills.join(', ');
    return _data;
}
let job_data = fs.readFileSync('test.json', 'utf8');
job_data  = JSON.parse(job_data);
const res = main(job_data);
console.log(res)