const table = require('text-table');
const textToImage = require('../../tools/image_tools/txt_table_to_image');
const saveImageVK = require('../../tools/image_tools/save_image_into_vk');
const textTableWeekday = require("../../tools/message_tools/pair_tools");

const taskEverydayMailing = (reverse_markup, table_style, resources) => {
    const now_time = new Date();
    return async (weekday, message, bot)=>{
        const sql = `SELECT vk_id, user_group, notify_groups, notify_time FROM ${process.env.DB_TABLE} WHERE notify AND notify_e_d AND notify_groups IS NOT NULL `;
        resources.db.callback(sql, null, (err, users) => {
            if(err) return console.error(`mailing Error: ${err}`);

            const uniq_exec_groups = [...new Set(users.map(user=>[user.user_group, user.notify_groups]).flat(4))];

            uniq_exec_groups.forEach(async (group) => {
                const timetable = await new Promise(resolve => resources.data.getTimeTable(data=>resolve(data)))
                const data = await new Promise(resolve => resources.data.getData(data=>resolve(data)))

                const arr_pairs = textTableWeekday(data[group]['weekdays'][weekday]['pairs'],timetable)

                const t = table(arr_pairs, table_style);

                textToImage(`Расписание группы ${group} на\n${weekday}\n\n${t.toString()}`, 0,(err,buffer)=>{
                    if (err){
                        console.error(`Error in method mailing:`);
                        return console.error(err);
                    }

                    const sending_to_users = users.map(user=>{

                        const hours = parseInt(`${user.notify_time[0]}${user.notify_time[1]}`);
                        const minutes = parseInt(`${user.notify_time[3]}${user.notify_time[4]}`);

                        if ((user.user_group === group || user.notify_groups.includes(group))
                            && now_time.getHours() === hours
                            && Math.round(now_time.getMinutes() ? now_time.getMinutes()/10 : 0)*10 === Math.round(minutes ? minutes/10 : 0)*10
                        ) {
                            return user.vk_id;
                        }
                    }).filter(usr=>usr);

                    if (sending_to_users.length) {
                        saveImageVK(buffer, bot, (photo_data) => {
                            bot.sendMessage(sending_to_users, message,
                                `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
                        });
                    }
                });
            });
        });
    }
};

module.exports = taskEverydayMailing;
