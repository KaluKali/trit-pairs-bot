const table = require('text-table');

const ServerTime = require('../tools/server_time');
const TritData = require('../tools/trit_data');
const getUserInfo = require('../tools/user_info');
const pairTools = require('../tools/pair_tools').default;

const server_time = new ServerTime();
const trit_data = new TritData();

const pairs_now_day = (reverse_markup, table_style) => {
    return async (ctx, obj) => { //send pairs to people
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
                ctx.reply(`Список уроков для ${group} группы на ${weekday}.\n
                \n${table(pairTools.jsonToPairs(data, group, weekday), table_style).toString()}`,null,reverse_markup);
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

module.exports = pairs_now_day;
