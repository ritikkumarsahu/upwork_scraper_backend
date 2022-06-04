const axios = require('axios')
const UserAgent = require('user-agents') ;
const os = require('os');
const fs = require("fs");

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function getIpDetails(proxy) {
  let response = {timezone: ''};
  var config = {
    method: 'get',
    url: `https://ipinfo.io/?token=${process.env.IP_INFO_TOKEN}`,
    proxy: {
      protocol: 'http',
      host: proxy.proxy_address,
      port: proxy.ports.http,
      auth: {
        username: proxy.username,
        password: proxy.password
      }
    }
  };
  
  res = await axios(config);
  if(res.status == 200){
    response = res.data;
  }
  return response;
}

async function getProxies(country=null) {
    const proxies =  JSON.parse(fs.readFileSync('./proxies.json', 'utf8'));

    // let url = 'https://proxy.webshare.io/api/proxy/list/';
    // if(country !== null){
    //   url = url + '?countries=' + country
    // }
    // let config = {
    //     method: 'get',
    //     url: url,
    //     headers: { 
    //       'Authorization': `Token ${process.env.WEBSHARE_API_KEY}`
    //     }
    //   };
    //   let res = {};
    //   while (config.url !== "" && config.url !== undefined && config.url !== null) {
    //     res = await axios(config);
    //     if(res.status == 200){
    //       res = res.data;
    //       config.url = res.next;
    //       proxies.push(...res.results);
    //     }
    //   }
      return shuffle(proxies);
}

function getUserAgent() {
  const os_map = {
      'darwin': "MacIntel", 
      'win32': "Win32", 
      'linux': "Linux x86_64"
  }
  const platform = os_map[os.platform()];
  const userAgent = new UserAgent({ deviceCategory: 'desktop', platform: platform });
  let userAgents = Array(100).fill().map(() => userAgent().toString());
  userAgents = new Set(userAgents);
  return Array.from(userAgents);
}

module.exports = {getIpDetails, getProxies, getUserAgent};