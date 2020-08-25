const ServerTime = require('../tools/server_time');
const TritData = require('../tools/trit_data');
const getUserInfo = require('../tools/user_info');
const pairTools = require('../tools/pair_tools').default;
// experiment tools
const table = require('text-table');
const sendTextImage = require('./send_image');
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
                let content = `Расписание группы ${group} на \n${weekday}\n\n${table(pairTools.jsonToPairs(data, group, weekday), table_style).toString()}`;
                sendTextImage(reverse_markup)(content,ctx,bot)
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
