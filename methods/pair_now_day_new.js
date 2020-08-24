const ServerTime = require('../tools/server_time');
const TritData = require('../tools/trit_data');
const getUserInfo = require('../tools/user_info');
const pairTools = require('../tools/pair_tools').default;
// experiment tools
const multer = require('multer');
const upload = multer();
const table = require('text-table');
const gm = require('gm').subClass({imageMagick: true, appPath:'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\'});
const request = require('request');
const fs = require('fs');
const Readable = require('stream').Readable;
// const restler = require('restler');
const axios = require("axios");
const FormData = require("form-data");
//
const server_time = new ServerTime();
const trit_data = new TritData();

const pairs_now_day_new = (reverse_markup, table_style) => {
    return async (ctx, obj, bot) => { //send pairs to people
        if (typeof ctx === 'undefined' || typeof obj === 'undefined'){
            return new Error('pairs_Day: Argument error');
        }

        const user_info = await getUserInfo(ctx.message.from_id);
        if (obj.group === -1){
            if (typeof user_info === 'undefined'){
                return ctx.scene.enter('group');
            } else {
                obj.group = user_info.user_group;
            }
        }
        const weekday = obj.weekday !== "" ? obj.weekday : server_time.getWeekday();
        const group = obj.group;

        trit_data.getData( (data, err) => {
            if (!err){
                let content = table(pairTools.jsonToPairs(data, group, weekday), table_style).toString();
                gm(800, 600, '#FFFFFF')
                    .fill('#000000')
                    .fontSize('46')
                    .out('-background', '#FFFFFF')
                    .out('-size', '800x', `caption:\ Расписание группы ${group} на \n${weekday}.\n\n${content}`, 'center')
                    .out('-gravity', 'center')
                    .out('-composite')
                    .out('-trim')
                    .write('./tmp.jpg', async ()=>{
                // gm(1000, 1000, '#ffffff').fontSize(24).font('Bahnschrift Correct').fill('#000000').out('-box','#ffffff').drawText(10, 200,
                //     `Расписание группы ${group} на ${weekday}.\n\n`+content.replace(' ','\ '), 'center').trim()
                // // .stream((err,stdout,stderr)=>{
                // // .toBuffer('jpeg', async (err,buff)=>{
                //     .write('./tmp.jpg', async (err) =>{
                        // const newStream = new Readable({
                        //     read() {
                        //         this.push(buff.toString());
                        //     },
                        // });
                        const upload_data = await bot.execute('photos.getMessagesUploadServer');
                        const formData = new FormData();
                        formData.append("photo", fs.createReadStream('./tmp.jpg'));
                        const { data } = await axios({
                            url: upload_data.upload_url,
                            method: "POST",
                            data: formData,
                            headers: {
                                'content-type': `multipart/form-data; boundary=${formData._boundary}`,
                            },
                        });
                        const photo_data = await bot.execute('photos.saveMessagesPhoto', data);

                        ctx.reply('',`photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
                    });
            } else {
                if (data){
                    ctx.reply(`!!! Сайт имеет технические неполадки !!!
                    Список уроков для ${group} группы на ${weekday}.\n
                    ${table(pairTools.jsonToPairs(data, group, weekday), table_style).toString()}`,null,reverse_markup);
                } else {
                    ctx.reply('Технические неполадки.', null, reverse_markup);
                }
            }
        });
    }
};

module.exports = pairs_now_day_new;
