const table = require('text-table');
const pairTools = require('../tools/pair_tools').default;


const mailing = (reverse_markup, table_style, res) => {
    return async (weekday, bot)=>{
        const sql = `SELECT vk_id, user_group FROM ${process.env.DB_TABLE} WHERE notify AND notify_e_d`;
        res.db.callback(sql, (err, users) => {
            if(err) return  console.error(`mailing Error: ${err}`);
            const uniq_exec_groups = [...new Set(users.map(user=>(user.user_group)))];
            res.data.getData(async (data) => {
                uniq_exec_groups.forEach((group) => {
                    const t = table(pairTools.jsonToPairs(data, group, weekday), table_style);
                    users.forEach(user=>{
                        if (user.user_group === group) bot.sendMessage(user.vk_id,`Список уроков для ${group} группы на ${weekday}.\n\n${t.toString()}`,null,reverse_markup);
                    })
                });
            });
        });
    }
};

module.exports = mailing;
