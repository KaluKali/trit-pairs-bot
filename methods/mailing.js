const table = require('text-table');

const TritData = require('../tools/trit_data');
const SqlDB = require('../tools/sql_data');
const getUserInfo = require('../tools/user_info');
const pairTools = require('../tools/pair_tools').default;

const trit_data = new TritData();
const sql_db = new SqlDB();


const mailing = (reverse_markup,table_style) => {
    return async (weekday, bot)=>{
        const sql = `SELECT vk_id FROM ${process.env.DB_TABLE}`;
        sql_db.callback(sql, (err, results) => { // получаем список всех юзеров из вк
            if(err) return  console.error(`mailing Error: ${err}`);
            const users = [];
            for(let i of results) users.push(i.vk_id); // формируем список юзеров
            trit_data.getData(async (data) => {
                const exec_groups = [];
                const g_users = [];
                for (let i of users){
                    const user_info = await getUserInfo(i).catch(err=>console.log(`p_D_to_all user_info error:${err}`)); // todo !!! запрашиваем таблицу по каждому юзеру
                    exec_groups.push(user_info.user_group); // получаем его группу
                    g_users.push(user_info); // формируем список таблиц юзеров
                }
                let uniq_exec_groups = [...new Set(exec_groups)];
                // сортируем только по уникальным значениям, получая те группы которым нужно сформировать таблицу расписания
                uniq_exec_groups.forEach((group) => {
                    // формируем таблицу
                    const t = table(pairTools.jsonToPairs(data, group, weekday), table_style);
                    // формируем таблицу end
                    const send_users = g_users.filter(user => user.user_group === group && user.notify === 1 && user.notify_e_d === 1);
                    // сортируем по группе, параметрам уведомлений которые выставлены у юзеров
                    // получая список юзеров которым нужно отправить расписание
                    const send_users_id = [];
                    for (let i of send_users) send_users_id.push(i.vk_id);
                    if (send_users_id.length !== 0){
                        bot.sendMessage(send_users_id,`Список уроков для ${group} группы на ${weekday}.\n\n${t.toString()}`,null,reverse_markup);
                    }
                });
            })
        });
    }
};

module.exports = mailing;
