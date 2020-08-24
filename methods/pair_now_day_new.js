const ServerTime = require('../tools/server_time');
const TritData = require('../tools/trit_data');
const getUserInfo = require('../tools/user_info');
const pairTools = require('../tools/pair_tools').default;
// experiment tools
const table = require('text-table');
const gm = require('gm').subClass({imageMagick: true, appPath:'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\'});
const request = require('request');
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
                    .out('-size', '800x', `caption:Расписание группы ${group} на \n${weekday}\n\n${content}`, 'center')
                    .out('-gravity', 'center')
                    .out('-composite')
                    .out('-trim')
                    .toBuffer('JPEG', async (err,buffer)=>{
                        const upload_data = await bot.execute('photos.getMessagesUploadServer');
                        const formData = {
                            photo: {
                                value: buffer,
                                options: {
                                    filename: 'img_custom.jpg',
                                    contentType: 'multipart/form-data'
                                }
                            }
                        };
                        let boundary = '--------------------------';
                        for (let i = 0; i < 24; i++) {
                            boundary += Math.floor(Math.random() * 10).toString(16);
                        }
                        const options = {
                            headers: {
                                'content-type': `multipart/form-data; boundary=${boundary}`,
                            },
                            uri: upload_data.upload_url,
                            formData: formData,
                            method: 'POST'
                        };

                        request(options, async (err, response, body) => {
                            if (err) console.log('Request err: ', err);
                            const photo_data = await bot.execute('photos.saveMessagesPhoto', JSON.parse(body));
                            ctx.reply('',`photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
                        });
                    });
            } else {
                if (data){
                    ctx.reply(`!!! Сайт техникума имеет технические неполадки !!!
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
