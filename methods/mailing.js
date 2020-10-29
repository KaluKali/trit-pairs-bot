const table = require('text-table');
const pairTools = require('../tools/message_tools/pair_tools');
const textToImage = require('../tools/image_tools/txt_table_to_image');
const saveImageVK = require('../tools/image_tools/save_image_into_vk');

const mailing = (reverse_markup, table_style, res) => {
    return async (weekday, message, bot)=>{
        const sql = `SELECT vk_id, user_group, theme FROM ${process.env.DB_TABLE} WHERE notify AND notify_e_d`;
        res.db.callback(sql, null,(err, users) => {
            if(err) return  console.error(`mailing Error: ${err}`);
            const uniq_exec_groups = [...new Set(users.map(user=>(user.user_group)))];
            res.data.getData((data) => {
                uniq_exec_groups.forEach(async (group) => {
                    const arr_pairs = await new Promise(resolve => new pairTools(res.data).jsonToPairs(data, group, weekday, resolve));

                    const t = table(arr_pairs, table_style);

                    textToImage(`Расписание группы ${group} на\n${weekday}\n\n${t.toString()}`, 0,(err,buffer)=>{
                        if (err){
                            console.error(`Error in method mailing:`);
                            return console.error(err);
                        }
                        saveImageVK(buffer, bot, (photo_data) => {
                            bot.sendMessage(users.map(user=>user.user_group === group ? user.vk_id : null), message,
                                `photo${photo_data[0].owner_id}_${photo_data[0].id}`, reverse_markup)
                        })
                    });
                });
            });
        });
    }
};

module.exports = mailing;
