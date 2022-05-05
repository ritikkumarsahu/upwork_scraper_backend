const dotenv = require("dotenv")
const sendRequest = require("./requests");
const {getPageDetails, testURL } = require("./utils");
const fs = require("fs/promises");

dotenv.config();

(async function main() {
    const jobs = await getPageDetails("artificial intelligence",1,50);
    page_data = jobs[0];
    await fs.writeFile('data/artificial intelligence_1.json',JSON.stringify(page_data));
})();