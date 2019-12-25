const axios = require('axios');

module.exports = async function (json) {
    const { data } = await axios.post(`https://trit.biz/rr/${json}`);

    return data;
};