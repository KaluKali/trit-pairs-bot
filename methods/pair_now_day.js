const ServerTime = require('../tools/server_time');
const _pairTools = require('../tools/message_tools/pair_tools');
// experiment tools
const table = require('text-table');
const sendTextImage = require('./representation/send_image');

//
const serverTime = new ServerTime();

const pairs_now_day = (reverse_markup, table_style, resources) => {
    const pairTools = new _pairTools(resources.data);

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
        const weekday = message.weekday !== "" ? message.weekday : serverTime.getWeekday();
        const group = message.group;

        if (Array.isArray(resources.data.data_cache[group]['weekdays'][weekday]) &&
            typeof resources.data.data_cache[group]['weekdays'][weekday][user_info.theme] === 'string') {
            ctx.reply('',resources.data.data_cache[group]['weekdays'][weekday][user_info.theme], reverse_markup)
        } else {
            console.log(`Cache miss ${group} ${weekday}`)
            const arr_pairs = await new Promise(resolve => pairTools.arrayPairs(group, weekday, resolve));

            let content = `Расписание группы ${group} на \n${weekday}\n\n${table(arr_pairs, table_style).toString()}`;
            sendTextImage(reverse_markup)(content, ctx, user_info);
        }
    }
};

module.exports = pairs_now_day;
