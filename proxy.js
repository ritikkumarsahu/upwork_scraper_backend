const axios = require('axios')
const UserAgent = require('user-agents') ;


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

async function getProxies() {
    const proxies = []
    let config = {
        method: 'get',
        url: 'https://proxy.webshare.io/api/proxy/list/',
        headers: { 
          'Authorization': `Token ${process.env.WEBSHARE_API_KEY}`
        }
      };
      let res = {};
      while (config.url !== "" && config.url !== undefined && config.url !== null) {
        res = await axios(config);
        if(res.status == 200){
          res = res.data;
          config.url = res.next;
          proxies.push(...res.results);
        }
      }
      return shuffle(proxies);
}

function getUserAgent() {
  const userAgent = new UserAgent({ deviceCategory: 'desktop', platform: 'Win32' });
  let userAgents = Array(100).fill().map(() => userAgent().toString());
  userAgents = new Set(userAgents);
  return Array.from(userAgents);
}

module.exports = {getIpDetails, getProxies, getUserAgent};