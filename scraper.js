const moment = require('moment');
const {getPageDetails, testURL } = require("./utils");
const fs = require("fs/promises");
const dotenv = require("dotenv")

dotenv.config()
class Scraper {
    constructor(keyword, client_spent, last_posted, countries) {
        this.keyword = keyword;
        this.client_spent = client_spent;
        this.amount = 5000;
        this.per_page = 50;
        this.countries = Array.from(countries);
        this.last_posted = Math.round((moment().startOf('day') - moment(last_posted))/86400000);
        this.data = [];
    }
    async save_data() {
        console.log("saving the data for "+ this.keyword);
        await fs.writeFile('job_data/'+this.keyword+'.json',JSON.stringify(this.data));
    }

    filter_page_jobs(jobs) {
        return jobs.filter(job => {
            try {
                if (job['amount']['amount'] !== null && job['amount']['amount'] < this.amount) return false;
                // TODO: totalSpent can be null, handle it
                if (job['client']['totalSpent'] !== null && job['client']['totalSpent'] < this.client_spent) return false;
                if (job['client']['location']['country'] !== null && this.countries.includes(String(job['client']['location']['country']).toLowerCase())) return false;
                if (job['createdOn'] !== null && job['createdOn'] !== '') {
                    if (Math.round((moment().utc(0).startOf('day') - moment(job['createdOn']).utc(0)) / 86400000) <= this.last_posted) {
                        return job['ciphertext'] !== '';
                    }
                }
            } catch (err) {}
        }).map(job => {
            const base_url = `https://www.upwork.com/job-details/jobdetails/api/job/${job.ciphertext}/`;
            return [base_url+'details', base_url+'summary'];
        }).flat();
    }
    async filter_jobs(jobs_url) {
        const jobs_data = await testURL(jobs_url);
        if (jobs_data.length <= 0) {
            console.error("No data found for filtered jobs_urls!");
            return;
        }
        jobs_data.forEach((job_data) => {
            let _data  = {}
            if (job_data['fullUrl'].contains(job_data["ciphertext"]+'/details')) {
                try {
                    if (job_data['buyer']['stats']['totalCharges']['amount'] < this.client_spent) return;
                    if (this.countries.includes(String(job_data['buyer']['location']['country']).toLowerCase())) return;
                    const lastBuyerActivity = job_data["job"]["clientActivity"]["lastBuyerActivity"];
                    last_seen_date =  lastBuyerActivity !== '' ? moment(lastBuyerActivity).utc(0) : moment().utc(0);
                    if (Math.round((moment().utc(0).startOf('day') - lastBuyerActivity) / 86400000) > 10) return;
                    const totalHired = job_data["job"]["clientActivity"]["totalHired"];
                    const hired =  totalHired !== 0 ? totalHired : 0 ;
                    if (hired > 0) return;
                } catch (err) {}

                _data = {
                    "keyword":this.keyword,
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
            }
            else if (job_data['fullUrl'].contains(job_data["ciphertext"]+'/summary')) {
                const skills = [];
                try {
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
                } catch (e) {}
                
                _data['skills'] = skills.join(', ');
            }
            
            this.data.push(_data);
            return;
        })
    }
    async scrape() {
        const per_page = 50;
        let total = 99999999;
        let offset = 0;
        let page = 1;
        let total_pages = 1;
        while (offset+per_page <= total) {
            let page_data = await getPageDetails(this.keyword,page,per_page);
            if (page_data.length <= 0) {
                console.error('Page not found!');
                break;
            }
            console.log(`Grab page #${page}...`)
            page_data = page_data[0];
            await fs.writeFile('data/'+this.keyword+'_'+page+'.json',JSON.stringify(page_data));
            if ((page_data['searchResults']['jobs'].length <= 0) && (page_data['searchResults']['paging']['total'] > 0) && (page<=total_pages)) {
                console.error(`Found garbage response! Requesting the page #${page} again.`);
                continue;
            }
            total = page_data.searchResults.paging.total;
            offset = page_data.searchResults.paging.offset;
            total_pages = Math.ceil(total/page_data['searchResults']['paging']['count']);
            if ((page > total_pages) && ((total - offset)<=0)){
                console.log('All pages grabbed! Finished!');
                break;
            }
            const job_links = this.filter_page_jobs(Array.from(page_data['searchResults']['jobs']));
            console.log(`filtering the ${job_links.length}/${page_data['searchResults']['jobs'].length} links`);
            await this.filter_jobs(job_links);
            this.save_data();
            console.log(`File #%${page} saved!`);
            page++;
        }
        console.log(`Download Your file: 'job_data/${this.keyword}.json'`);
    }
}

async function main() {
    const k = new Scraper('artificial intelligence', 10000, "2022-02-20",["india"]);
    await k.scrape();
    // const data = require('./dummy');
    // console.log(data.length);
    // const f_jobs = k.filter_page_jobs(data);
    // console.log(f_jobs);
}
main();
// d = 
// // d = moment().utc(0).startOf('day') - moment("2022-04-23T18:38:23+00:00").utc(0)
// console.log(d)