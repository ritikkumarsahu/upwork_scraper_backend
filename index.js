const http = require('http');
const Scraper = require("./scraper");
const url = require('url');
const dotenv = require("dotenv")

dotenv.config()

http.createServer(async (req, res) => {
    const query = url.parse(req.url,true).query;
    const scraper = new Scraper(query.keyword, parseInt(query.client_spent), query.last_posted, String(query.countries).split(','));
    const response = await scraper.scrape();
    res.writeHead(
        200, 
        {'content-type':'application/json; charset=utf-8'}
    );
    res.write(JSON.stringify(response, (k,v) => v === "NaN" || v === undefined  ? null : v ));
    res.end();
}).listen(3000, ()=> {console.log("Listening on port 3000")});