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
                    if (buffer) {
                        saveImageIntoVK(buffer,bot,photo_data=>{
                            bot.sendMessage(user.vk_id, '', `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup);
                        })
                    }
                })
            })
        });
    }
};

module.exports = task_changes_mailing;
