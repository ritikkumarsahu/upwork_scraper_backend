const dotenv = require("dotenv")
const axios = require('axios')
const UserAgent = require('user-agents') ;

dotenv.config();

var data = JSON.stringify({
  "login": {
    "mode": "password",
    "iovation": "",
    "username": "ritikrks@gmail.com",
    "rememberme": true,
    "elapsedTime": 24605,
    "password": "Ritik@Sahu001"
  }
});

var config = {
  method: 'post',
  url: 'https://www.upwork.com/ab/account-security/login',
  headers: { 
    'authority': 'www.upwork.com', 
    'accept': '*/*', 
    'accept-language': 'en-US,en;q=0.9', 
    'content-type': 'application/json', 
    // 'cookie': 'G_AUTHUSER_H=0; AccountSecurity_cat=ae620091.oauth2v2_d6f5046dc7c2945823b96e9e3f413385; device_view=full; visitor_id=49.36.22.148.1651761044796000; _fbp=fb.1.1651761045851.772597837; lang=en; _pxvid=f2c4d1c7-cc7f-11ec-8b5c-74625062784e; _gcl_au=1.1.978015609.1651761054; _rdt_uuid=1651761054134.b3e726a8-f9f7-4b66-97a7-f6d040e3c492; __pdst=f4e27e7e1c94433b94637d911eb137cb; G_ENABLED_IDPS=google; _vwo_uuid_v2=D12C7A428ACA466BCC413FA33C6ED32C1|b8998a39169e4821b77beffcaf8501cc; _vwo_uuid=D12C7A428ACA466BCC413FA33C6ED32C1; _vwo_ds=3%241651761326%3A22.98677629%3A%3A; _vis_opt_exp_24_combi=1; _pxhd=NvWZylj1ZPpvVcNzZmCUm-iqFQGg6rKvMFSQzpz6J9S1PC6jJ0qGaojknl9lQX8qsgsMFf26hb8ikEYNMFCqtw==:7GnnAFmJxdIPP3iKMhxQtJ9nOj6hsZMu2dIN99S6GhnZhIzhTz9/PZ/J2-pshYQTBqrhKNsXz0i90GUxrvjsmMbKIhAgrMSFysQ8HfFmHlw=; recognized=838485b4; company_last_accessed=d37489509; current_organization_uid=1348941974253486081; visitor_gql_token=oauth2v2_f0852f14d304efd28a93e89fae531301; cookie_prefix=; cookie_domain=.upwork.com; __cf_bm=1DGeEa9YaaguNIN.r2RMEViU.lnZKTmiTv23jlDLaKc-1653723663-0-AQV65qdkOzxAkhCyL30AncICsoIsrD2NH+BnnoikyHZAJWNQSOpmEDckm36Faiw44HzvdficCAKk7tFeKzUCPL8=; __cfruid=1e8b2321e63fcfa513660ec996f3cadbdb9c1776-1653723663; _vis_opt_s=3%7C; _vis_opt_test_cookie=1; pxcts=872af433-de59-11ec-a1cc-476674787847; _vwo_sn=1962337%3A3; _sp_ses.2a16=*; OptanonConsent=consentId=bbc4f032-c4c1-42a3-a411-50f140fe6e9d&datestamp=Sat+May+28+2022+13%3A11%3A05+GMT%2B0530+(India+Standard+Time)&version=6.28.0&interactionCount=1&isGpcEnabled=0&isIABGlobal=false&hosts=&landingPath=https%3A%2F%2Fwww.upwork.com%2F&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1; _gid=GA1.2.2112349990.1653723666; _hp2_ses_props.2858077939=%7B%22ts%22%3A1653723665498%2C%22d%22%3A%22www.upwork.com%22%2C%22h%22%3A%22%2F%22%7D; AWSALB=TM6vUuCoVz0ExVThStxf6vJfHSX3YV0SNerzHthWEsHy79HY+UQXceeQszhErtPro+uQFBK4CfK/6as/4FHuH+8C0K/SrEvw91ksa7u8GsDBX6/DbqohREhqgK3A; AWSALBCORS=TM6vUuCoVz0ExVThStxf6vJfHSX3YV0SNerzHthWEsHy79HY+UQXceeQszhErtPro+uQFBK4CfK/6as/4FHuH+8C0K/SrEvw91ksa7u8GsDBX6/DbqohREhqgK3A; spt=844d3d45-f9ab-488b-8a6d-6ac1e1cd0fdf; _dpm_ses.5831=*; prodperfect_session={%22session_uuid%22:%2237dca52f-2d95-48c6-9086-54c620f99895%22}; IR_gbd=upwork.com; _clck=iw2tbo|1|f1u|0; odesk_signup.referer.raw=https%3A%2F%2Fwww.upwork.com%2Fab%2Faccount-security%2Flogin; user_oauth2_slave_access_token=360d71f4.oauth2v2_582c523c89aac1c8a43cd300b36e933a:1348941974245097472.oauth2v2_cbb944287f75189811cec017b9876a0f; XSRF-TOKEN=2d40324485b27212a7a90e13faa8791d; _pxff_fp=1; _hp2_props.2858077939=%7B%22container_id%22%3A%22GTM-WNVF2RB%22%2C%22user_context%22%3A%22unknown%22%2C%22user_logged_in%22%3Afalse%7D; _hp2_id.2858077939=%7B%22userId%22%3A%225018797116969950%22%2C%22pageviewId%22%3A%225326815478345081%22%2C%22sessionId%22%3A%225535464727598873%22%2C%22identity%22%3A%221348941974245097472%22%2C%22trackerVersion%22%3A%224.0%22%2C%22identityField%22%3Anull%2C%22isIdentified%22%3A1%7D; _px3=72051c9cb0ea9bbf6a52069c69852f3497fe25ba63a33354e6c0cbdf9145152a:aROkxj9KTrIYINHyB2ami8/N49UiZJ2Htr6AKS78rdG2hq5Tsx+wxq17jF/vEdo3WN9dbVmp6USixEwxlhAT+w==:1000:d0g0zRPtlIhYmjZUUCgtzuEHpUuDCyswS1vi3pygpn9rha5Ofwtb0fHjg5V7WubYOXBpCRESUIKiLwr1luumGDIHK+N52X4A1OO9gwwkdKFC1Q6OeRy4sQt1fC+RMbwc2Bh6A7ZpJvdy9s4b2kUYg5Yi7oiVCf7hW6tY47+kiKr3FABwrXdklCPUvdmNihjsc1eCv9jPzUVr2OMCRYkvYQ==; _dpm_id.5831=94b37130-b93b-4885-8fd7-8359114405ec.1651761054.4.1653724011.1653459920.8bc03f7f-dd9f-4d97-9f17-59230f89f767; IR_13634=1653724010657%7C0%7C1653724010657%7C%7C; _uetsid=89a1cfc0de5911ec94a5bf8091c0d440; _uetvid=b94f0290cc7f11ecbc1cf93e15b3d22c; _clsk=yn6jc3|1653724011404|5|0|d.clarity.ms/collect; enabled_ff=!CI10270Air2Dot5QTAllocations,!SSINav,OTBnrOn,CI11132Air2Dot75,!CI10857Air3Dot0,!air2Dot76,!air2Dot76Qt,!CI12577UniversalSearch,!OTBnr,CI9570Air2Dot5; _ga=GA1.2.369265907.1651761054; _gat_UA-62227314-1=1; _ga_KSM221PNDX=GS1.1.1653723665.7.1.1653724013.0; _sp_id.2a16=1a629691-f367-4836-b893-8cada1b29ffd.1651761043.6.1653724034.1653459920.71a6a0c8-fd0e-4dcf-b663-a06b38a00168; master_refresh_token=360d71f4.oauth2v2_9c436680db689db7871dc4ab0b45de69.1; SZ=64ec8f9077262e1efa6675f0e39f2eba422f248a2a2c6eaef79fc7b0b233f214; __cfruid=40332d9502274636c5954f7c75920ede76813a64-1653730703; company_last_accessed=d1014702010; console_user=838485b4; master_access_token=360d71f4.oauth2v2_44cff909feba709c88a2fa97f1a268bf; oauth2_global_js_token=oauth2v2_472a399b0cdb5a9d0ca1636e6e1c060c; recognized=838485b4; user_uid=1348941974245097472; visitor_id=49.36.22.148.1651761044796000; _pxhd=NvWZylj1ZPpvVcNzZmCUm-iqFQGg6rKvMFSQzpz6J9S1PC6jJ0qGaojknl9lQX8qsgsMFf26hb8ikEYNMFCqtw==:7GnnAFmJxdIPP3iKMhxQtJ9nOj6hsZMu2dIN99S6GhnZhIzhTz9/PZ/J2-pshYQTBqrhKNsXz0i90GUxrvjsmMbKIhAgrMSFysQ8HfFmHlw=; enabled_ff=CI11132Air2Dot75,!CI10270Air2Dot5QTAllocations,!SSINav,!CI12577UniversalSearch,!air2Dot76Qt,!OTBnr,!CI10857Air3Dot0,!air2Dot76,CI9570Air2Dot5,OTBnrOn', 
    'origin': 'https://www.upwork.com', 
    'referer': 'https://www.upwork.com/ab/account-security/login', 
    'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"', 
    'sec-ch-ua-mobile': '?0', 
    'sec-ch-ua-platform': '"Windows"', 
    'sec-fetch-dest': 'empty', 
    'sec-fetch-mode': 'cors', 
    'sec-fetch-site': 'same-origin', 
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36', 
    // 'x-odesk-csrf-token': '2d40324485b27212a7a90e13faa8791d', 
    'x-requested-with': 'XMLHttpRequest'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});
