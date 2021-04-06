const axios = require('axios');
const https = require('https');

module.exports = async function (url) {
    const instance = axios.create({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false // при ssl err-> false
        })
    });
    
    const { data } = await instance.post(url);
    
    return data;
};
