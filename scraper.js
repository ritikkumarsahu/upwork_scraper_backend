const moment = require('moment');
const { getPageDetails, testURL, random_password_generate, random_email_generate } = require("./utils");
const { createAccount, loginAccount, closeAccount } = require("./upworkAc");
const fs = require("fs");
const Charlatan = require('charlatan');
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
        this.is_login = true;
        this.save_dir = './job_data/';
        this.data_dir = './data/';
        this.cookie_dir = './cookies/';
        if (!fs.existsSync(this.save_dir)){
            fs.mkdirSync(this.save_dir);
        }
        if (!fs.existsSync(this.data_dir)){
            fs.mkdirSync(this.data_dir);
        }
        if (!fs.existsSync(this.cookie_dir)){
            fs.mkdirSync(this.cookie_dir);
        }
    }

    async init() {
        if (this.is_login === false) return false;
        const personDetails = {
            firstname: Charlatan.Name.firstName().replace(/[^\x00-\x7F]/g, ""),
            lastname: Charlatan.Name.lastName().replace(/[^\x00-\x7F]/g, ""),
            email: random_email_generate(),
            'password': random_password_generate(16,8),
            date_created: moment().utc().format('YYYY-MM-DD HH:mm:ss')
        }
        let res = await createAccount(personDetails);
        if (res === null) {
            this.is_login = false;
            return null;
        } else {
            console.log(personDetails);
            personDetails.country = res?.userAccount?.country;
        }
        res = await loginAccount(personDetails);
        if (res === null) {
            this.is_login = false;
            return null;
        } else {
            this.cookies = res;
            fs.writeFileSync(this.cookie_dir+'cookies.json', JSON.stringify(res));
        }
        return true;
    }
    async save_data() {
        console.log("saving the data for "+ this.keyword);
        fs.writeFileSync(this.save_dir+this.keyword+'.json',JSON.stringify(this.data));
    }

    filter_page_jobs(jobs) {
        return jobs.filter(job => {
            try {
                if (job['amount']['amount'] !== null && job['amount']['amount'] !== 0 && job['amount']['amount'] < this.amount) return false;
                if (job['client']['totalSpent'] !== null && job['client']['totalSpent'] < this.client_spent) return false;
                if (job['client']['location']['country'] !== null && this.countries.includes(String(job['client']['location']['country']).toLowerCase())) return false;
                if (job['createdOn'] !== null && job['createdOn'] !== '') {
                    if (Math.round((moment().utc(0).startOf('day') - moment(job['createdOn']).utc(0)) / 86400000) <= this.last_posted) {
                        return job['ciphertext'] !== '';
                    }
                }
            } catch (err) {}
        }).map(job => {
            if (this.is_login) {
                const base_url = `https://www.upwork.com/job-details/jobdetails/api/job/${job.ciphertext}/`;
                return [base_url+'summary', base_url+'details'];
            }
            return `https://www.upwork.com/ab/jobs/search/jobdetails/visitor/${job.ciphertext}/details`;
        }).flat();
    }
    async filter_jobs(jobs_url) {
        if (jobs_url.length <= 0) return;
        const jobs_data = await testURL(jobs_url, this.is_login);
        if (jobs_data.length <= 0) {
            console.error("No data found for filtered jobs_urls!");
            return;
        }
        const data_dict = {};
        jobs_data.forEach((job_data) => {
            if (!(job_data.ciphertext in data_dict)){
                data_dict[job_data.ciphertext] = {};
            } 
            if (job_data['fullUrl'].includes(job_data["ciphertext"]+'/summary') || !this.is_login) {
                const i =  data_dict[job_data.ciphertext].index;
                let _data  = {};
                try {
                    const lastBuyerActivity = job_data["job"]["clientActivity"]["lastBuyerActivity"];
                    const totalHired = job_data["job"]["clientActivity"]["totalHired"];
                    const hired =  totalHired || 0 ;
                    if (
                        job_data['buyer']['stats']['totalCharges']['amount'] < this.client_spent ||
                        this.countries.includes(String(job_data['buyer']['location']['country']).toLowerCase()) ||
                        Math.round((moment().utc(0).startOf('day') - lastBuyerActivity) / 86400000) > 10 ||
                        hired > 0
                    ) {
                        data_dict[job_data.ciphertext].filtered = true;
                        if ( i !== undefined) {
                            this.data.splice(i, 1);
                        }
                        return;
                    }
                    
                } catch (err) {}

                _data = {
                    "keyword":this.keyword,
                    "title":job_data?.job?.title,
                    "link":'https://www.upwork.com/job/'+job_data?.job?.ciphertext,
                    "posted_on":job_data?.job?.postedOn,
                    "country":job_data?.buyer?.location?.country,
                    "total_jobs_posted":job_data?.buyer?.jobs?.postedCount,
                    "open_jobs":job_data?.buyer?.jobs?.openCount,
                    "total_reviews":job_data?.buyer?.stats?.feedbackCount,
                    "rating": +Number(job_data?.buyer?.stats?.score).toFixed(2),
                    "total_hires":job_data?.buyer?.stats?.totalJobsWithHires,
                    "client_since":job_data?.buyer?.company?.contractDate,      
                    "client_spent":job_data?.buyer?.stats?.totalCharges?.amount,  
                    "is_payment_verified":job_data?.buyer?.isPaymentMethodVerified,
                    "currency_code":job_data?.job?.budget?.currencyCode,
                    "job_level":job_data?.job?.contractorTier,
                    "project_length":job_data?.job?.durationIdV3,
                }
                if (job_data?.job?.budget?.amount){
                    _data['hourly_budget_min'] = null;
                    _data['hourly_budget_max'] = null;
                    _data['fixed_budget'] = job_data?.job?.budget?.amount;
                    _data['is_job_fixed'] = true;
                }
                else{
                    _data['hourly_budget_min'] = job_data?.job?.extendedBudgetInfo?.hourlyBudgetMin;
                    _data['hourly_budget_max'] = job_data?.job?.extendedBudgetInfo?.hourlyBudgetMax;
                    _data['fixed_budget'] = null;
                    _data['is_job_fixed'] = false;
    
                }

                if (i === undefined) {
                    const ind = this.data.push(_data);
                    data_dict[job_data.ciphertext].index = ind-1;
                } else {
                    this.data[i] = {...this.data[i], ..._data};
                }
            }
            if (job_data['fullUrl'].includes(job_data["ciphertext"]+'/details') || !this.is_login) {
                const i =  data_dict[job_data.ciphertext].index;
                if (i === undefined && data_dict[job_data.ciphertext].filtered === true) return;
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

                const skills_txt = skills.join(', ');
                if (i === undefined) {
                    if (data_dict[job_data.ciphertext].filtered !== true) {
                        const ind = this.data.push({skills: skills_txt});
                        data_dict[job_data.ciphertext].index = ind-1;
                    }
                } else {
                    this.data[i]['skills'] = skills_txt
                }

            }
            return;
        })
    }
    async scrape() {
        const per_page = 50;
        // initialize the metrics for the page
        let total = 99999999;
        let offset = 0;
        let page = 1;
        let total_pages = 1;
        let page_metrics = await getPageDetails(this.keyword,2,per_page, this.is_login);
        if (page_metrics.length > 0) {
            const metrics = page_metrics[0];
            total = metrics.searchResults.paging.total;
            total_pages = Math.ceil(total/metrics['searchResults']['paging']['count']);
        }

        while (offset+per_page <= total) {
            let page_data = await getPageDetails(this.keyword,page,per_page, this.is_login);
            if (page_data.length <= 0) {
                console.error('Page not found!');
                break;
            }
            page_data = page_data[0];
            fs.writeFileSync(this.data_dir+this.keyword+'_'+page+'.json',JSON.stringify(page_data));
            if ((page_data['searchResults']['jobs'].length <= 0) && (page_data['searchResults']['paging']['total'] > 0) && (page<=total_pages)) {
                console.error(`Found garbage response! Requesting the page #${page} again.`);
                continue;
            }
            total = page_data.searchResults.paging.total;
            offset = page_data.searchResults.paging.offset;
            total_pages = Math.ceil(total/page_data['searchResults']['paging']['count']);
            console.log(`Grabed page #${page}/${total_pages}...`);
            if ((page > total_pages) && ((total - offset)<=0)){
                console.log('All pages grabbed! Finished!');
                break;
            }
            const job_links = this.filter_page_jobs(Array.from(page_data['searchResults']['jobs']));
            console.log(`filtering the ${this.is_login? job_links.length/2: job_links.length}/${page_data['searchResults']['jobs'].length} links`);
            await this.filter_jobs(job_links);
            this.save_data();
            console.log(`File #%${page} saved!`);
            page++;
        }
        console.log(`Download Your file: 'job_data/${this.keyword}.json'`);
        await closeAccount(this.cookies);
        fs.unlinkSync(this.cookie_dir+'cookies.json');
        return this.data;
    }
}

async function main() {
    const k = new Scraper('MACHINE LEARNING', 10000, "2022-05-25",["india"]);
    await k.init();
    await k.scrape();
    // const data = require('./dummy');
    // console.log(data.length);
    // const f_jobs = k.filter_page_jobs(data);
    // console.log(f_jobs);
}
module.exports = Scraper;