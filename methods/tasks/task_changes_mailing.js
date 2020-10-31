const table = require('text-table');
const pairTools = require('../../tools/message_tools/pair_tools');
const textToImage = require('../../tools/image_tools/txt_table_to_image');
const saveImageIntoVK = require('../../tools/image_tools/save_image_into_vk');
const send_image_changes = require('../representation/send_image_changes');

const task_changes_mailing = (reverse_markup, table_style, resources) => {
    return async (data_changes,amount, bot)=>{
        const sql = `SELECT vk_id, user_group, notify_groups_c FROM ${process.env.DB_TABLE} WHERE notify AND notify_c AND notify_groups_c IS NOT NULL`;
        resources.db.callback(sql, null,(err, users) => {
            if(err) return console.error(`changes_mailing Error: ${err}`);
            // const uniq_exec_groups = [...new Set(users.map(user=>[user.user_group, user.notify_groups_c]).flat(4))];

            users.forEach(user=>{
                send_image_changes()(data_changes, [user.user_group, user.notify_groups_c].flat().filter(usr=>usr), (err, buffer)=>{
                    saveImageIntoVK(buffer,bot,photo_data=>{
                        bot.sendMessage(user.vk_id, '', `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup);
                    })
                })
            })

            // textToImage(`Расписание группы ${group} на\n${weekday}\n\n${t.toString()}`, 0,(err,buffer)=>{
            //     if (err){
            //         console.error(`Error in method mailing:`);
            //         return console.error(err);
            //     }
            //
            //     const sending_to_users = users.map(user=>{
            //
            //         const hours = parseInt(`${user.notify_time[0]}${user.notify_time[1]}`);
            //         const minutes = parseInt(`${user.notify_time[3]}${user.notify_time[4]}`);
            //
            //         if ((user.user_group === group || user.notify_groups.includes(group))
            //             && now_time.getHours() === hours
            //             && Math.round(now_time.getMinutes() ? now_time.getMinutes()/10 : 0)*10 === Math.round(minutes ? minutes/10 : 0)*10
            //         ) {
            //             return user.vk_id;
            //         }
            //     }).filter(usr=>usr);
            //
            //     if (sending_to_users.length) {
            //         saveImageVK(buffer, bot, (photo_data) => {
            //             bot.sendMessage(sending_to_users, message,
            //                 `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
            //         });
            //     }
            // });
        });
    }
};

module.exports = task_changes_mailing;
