const api = require('./api');

// bot.use(async (ctx, next) => {
//     const args = ctx.message.text
//         .replace(/ {1,}/g,' ')
//         .split(' ');
//     var ya_txt = await ya_speller.getText(args.shift());
//     for (var i=0;i<white_list.length;i++){
//         if (ya_txt === white_list[i]){
//             args.unshift(ya_txt);
//             ctx.message.text = args.join(' ');
//             return next();
//         }
//     }
//     next();
// }) // YandexSpeller
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
