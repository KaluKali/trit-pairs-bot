const table = require('text-table');

const TritData = require('../tools/trit_data');
const SqlDB = require('../tools/sql_data');
const pairTools = require('../tools/pair_tools').default;

const trit_data = new TritData();
const sql_db = new SqlDB();


const mailing = (reverse_markup,table_style) => {
    return async (weekday, bot)=>{
        const sql = `SELECT vk_id, user_group FROM ${process.env.DB_TABLE} WHERE notify AND notify_e_d`;
        sql_db.callback(sql, (err, users) => {
            if(err) return  console.error(`mailing Error: ${err}`);
            const uniq_exec_groups = [...new Set(users.map(user=>(user.user_group)))];
            trit_data.getData(async (data) => {
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
