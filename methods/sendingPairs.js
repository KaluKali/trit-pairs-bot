const Markup = require('node-vk-bot-api/lib/markup');
const table = require('text-table');

const TritData = require('../trit_data');
const SqlDB = require('../tools/sql_data');

const trit_data = new TritData();
const sql_db = new SqlDB();

async function getUserInfo(vk_id) {
    return sql_db.getData(`SELECT * FROM ${process.env.DB_TABLE} WHERE vk_id LIKE ${vk_id} LIMIT 1`,[]);
}

exports.ReverseMarkup = function (reverse_markup) {
    if (typeof reverse_markup === 'undefined') {
        reverse_markup = Markup.keyboard([
            Markup.button('Расписание', 'positive'),
            Markup.button('Расписание на завтра', 'positive'),
            Markup.button('Настроить уведомления', 'primary'),
            Markup.button('Указать группу', 'primary'),
        ], {columns: 2}).oneTime()
    }

    return async (weekday, bot)=>{
        const sql = `SELECT vk_id FROM ${process.env.DB_TABLE}`;
        sql_db.callback(sql, (err, results) => { // получаем список всех юзеров из вк
            if(err) console.log(`p_D_to_all Error: ${err}`);
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
                    const data_day_s = [];
                    // формируем таблицу
                    data[group]['weekdays'][weekday]['pairs'].forEach((pair,i) => {
                        if (i < 4) {
                            let p = [pair.name !== false ? pair.name : '-', pair.room !== false ? pair.room : '-'];
                            data_day_s.push(p, p.slice());
                        }
                    });
                    data_day_s.forEach((elem,i) => {
                        elem.push(TritData.PairsTime()[i]);
                        elem.unshift(i+1);
                    });

                    const t = table(data_day_s, { align: [ 'l', 'c', 'l' ], hsep: ' || ' });
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