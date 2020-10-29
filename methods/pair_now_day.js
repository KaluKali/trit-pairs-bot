const ServerTime = require('../tools/server_time');
const pairTools = require('../tools/message_tools/pair_tools');
// experiment tools
const table = require('text-table');
const sendTextImage = require('./representation/send_image');
//
const server_time = new ServerTime();

const pairs_now_day = (reverse_markup, table_style, resources) => {
    return async (ctx, message) => { //send pairs to people
        if (!ctx || !message) return new Error('pairs_Day: Argument error');

        const [user_info] = await resources.db.userInfo(ctx.message.from_id);

        if (message.group === -1){
            if (!user_info){
                return ctx.scene.enter('group');
            } else {
                message.group = user_info.user_group;
            }
        }
        const weekday = message.weekday !== "" ? message.weekday : server_time.getWeekday();
        const group = message.group;

        resources.data.getData(async (data, err) => {
            const arr_pairs = await new Promise(resolve => new pairTools(resources.data).jsonToPairs(data, group, weekday, resolve));
            if (!err){
                let content = `Расписание группы ${group} на \n${weekday}\n\n${table(arr_pairs, table_style).toString()}`;
                sendTextImage(reverse_markup)(content, ctx, user_info)
            } else {
                if (data){
                    let content = `!!! Сайт техникума имеет технические неполадки !!!\nРасписание группы ${group} на \n${weekday}\n\n${table(arr_pairs, table_style).toString()}`;
                    sendTextImage(reverse_markup)(content, ctx, user_info)
                } else {
                    ctx.reply('Технические неполадки, скоро все исправим.', null, reverse_markup);
                }
            }
        });
    }
};

module.exports = pairs_now_day;
