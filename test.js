// const dotenv = require("dotenv")
// const sendRequest = require("./requests");
// const {getPageDetails, testURL } = require("./utils");
// const fs = require("fs/promises");

// dotenv.config();

// (async function main() {
//     const jobs = await testURL("https://www.upwork.com/nx/find-work/best-matches");
//     // page_data = jobs[0];
//     // await fs.writeFile('data/artificial intelligence_1.json',JSON.stringify(page_data));
// })();

// Node.js program to demonstrate the	
// os.type() method
	
// Allocating os module
const os = require('os');
const UserAgent = require('user-agents') ;

const platform =os.platform();
const os_map = {
    'darwin': "MacIntel", 
    'win32': "Win32", 
    'linux': "Linux x86_64"
}
const userAgent = new UserAgent({ deviceCategory: 'desktop', platform: os_map[platform] });
console.log(userAgent)

