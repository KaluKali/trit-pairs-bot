const api = require('./api');


const YaSpeller = function () {
    this.promise = function (txt) {
        return new Promise((resolve => {
            api(encodeURI(`https://speller.yandex.net/services/spellservice.json/checkText?text=${txt}?lang=ru`))
                .then(response => resolve(response))
        }));
    };
};

YaSpeller.prototype.getList = async function(txt){
    const data = await this.promise(txt);

    const result = [];

    if (data.length){
        data.forEach((obj)=>{
            result.push(obj.s[0])
        })
    }

    return result
};
YaSpeller.prototype.getText = async function(txt){
    const data = await this.promise(txt);

    const result = [];

    if (data.length){
        data.forEach((obj)=>{
            result.push(obj.s[0])
        })
    }

    return result.join(' ');
};

module.exports = YaSpeller;
