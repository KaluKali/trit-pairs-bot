const ServerTime = require('../tools/server_time');
// experiment tools
const table = require('text-table');
const sendTextImage = require('./representation/send_image');
const textTableWeekday = require("../tools/message_tools/pair_tools");

//
const serverTime = new ServerTime();

const pairs_now_day = (reverse_markup, table_style, resources) => {
    return async (ctx, message) => { //send pairs to people
        if (!ctx || !message) return new Error('pairs_Day: Argument error');

        const [user_info] = await resources.db.userInfo(ctx.message.from_id);

        if (message.group === -1){
            if (!user_info || !user_info.user_group){
                return ctx.scene.enter('group');
            } else {
                message.group = user_info.user_group;
            }
        }
        const weekday = message.weekday !== "" ? message.weekday : serverTime.getWeekday();
        const group = message.group;

        let cache = resources.data.getCache(group,weekday,user_info.theme)
        if (cache) {
            ctx.reply('',cache, reverse_markup)
        } else {
            console.log(`Cache miss ${group} ${weekday}`)

            Promise.all([
                new Promise(((resolve, reject) => resources.data.getData((data,err)=>err ? reject(err) : resolve(data)))),
                new Promise(((resolve, reject) => resources.data.getTimeTable((data,err)=>err ? reject(err) : resolve(data))))
            ]).then(async res=>{
                let data = res[0];
                let timetable = res[1];

                let content =
                    `Расписание группы ${group} на \n${weekday}\n\n${table(textTableWeekday(data[group]['weekdays'][weekday]['pairs'],timetable), table_style).toString()}`;
                sendTextImage(reverse_markup)(content, ctx, user_info);
            }).catch(()=>ctx.reply('Проблемы на сайте, скоро исправим.'))
        }
    }
};

module.exports = pairs_now_day;
