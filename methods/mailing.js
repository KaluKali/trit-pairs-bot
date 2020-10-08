const table = require('text-table');
const pairTools = require('../tools/pair_tools').default;
const textToImage = require('../tools/txt_table_to_image');
const saveImageVK = require('../tools/save_image_into_vk');

const mailing = (reverse_markup, table_style, res) => {
    return async (weekday, message, bot)=>{
        const sql = `SELECT vk_id, user_group, theme FROM ${process.env.DB_TABLE} WHERE notify AND notify_e_d`;
        res.db.callback(sql, (err, users) => {
            if(err) return  console.error(`mailing Error: ${err}`);
            const uniq_exec_groups = [...new Set(users.map(user=>(user.user_group)))];
            res.data.getData(async (data) => {
                uniq_exec_groups.forEach((group) => {
                    const t = table(pairTools.jsonToPairs(data, group, weekday), table_style);

                    textToImage(`Расписание группы ${group} на\n${weekday}\n\n${t.toString()}`, 0,(err,buffer)=>{
                        if (err){
                            console.error(`Error in method mailing:`);
                            console.error(err);
                        }
                        saveImageVK(buffer, bot, (photo_data) => {
                            bot.sendMessage(users.map(user=>user.user_group === group ? user.vk_id : null), message, `photo${photo_data[0].owner_id}_${photo_data[0].id}`)
                        })
                    });
                });
            });
        });
    }
};

module.exports = mailing;
