const saveImageIntoVK = require('../../tools/image_tools/save_image_into_vk');
const render_image_changes = require('../representation/render_image_changes');

const task_changes_mailing = (reverse_markup, table_style, resources) => {
    return async (data_changes,amount, bot)=>{
        const sql = `SELECT vk_id, user_group, notify_groups_c FROM ${process.env.DB_TABLE} WHERE notify AND notify_c AND notify_groups_c IS NOT NULL`;
        return;
        resources.db.callback(sql, null,(err, users) => {
            if(err) return console.error(`task_changes_mailing db Error: ${err}`);

            users.forEach(user=>{
                const group_filter=[...new Set([user.user_group, user.notify_groups_c].flat().filter(usr=>usr))]

                let changes_render_counter = 0;

                for (let one_day in data_changes) {
                    if (Object.keys(data_changes[one_day].changes).length) {
                        const group_changes_filtred =
                            Object.keys(data_changes[one_day].changes).filter(group=>group_filter.length ? group_filter.includes(parseInt(group)) : true);
                        group_changes_filtred
                            .forEach(group=>changes_render_counter += Object.keys(data_changes[one_day].changes[group]).length);
                    }
                }
                if (changes_render_counter) {
                    if (changes_render_counter >= 30) {
                        bot.sendMessage(user.vk_id, 'Выложено новое расписание!\nhttps://trit.biz/rr/', null, reverse_markup);
                    } else {
                        render_image_changes()(data_changes, group_filter, (err, buffer)=>{
                            if (!err) {
                                saveImageIntoVK(buffer,bot,photo_data=>{
                                    bot.sendMessage(user.vk_id, 'Изменения в расписании:', `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup);
                                })
                            } else {
                                bot.sendMessage(user.vk_id, 'Выложено новое расписание!\nhttps://trit.biz/rr/', null, reverse_markup);
                            }
                        })
                    }
                }
            })
        });
    }
};

module.exports = task_changes_mailing;
