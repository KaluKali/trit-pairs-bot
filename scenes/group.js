const SqlDB = require('../tools/sql_data');
const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const TritData = require('../trit_data');

const trit_data = new TritData();

const sql_db = new SqlDB();


function getUserInfo(vk_id) {
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

    return new Scene('group',
        (ctx) => {
            ctx.scene.next();
            trit_data.getValidGroups((groups)=>{
                ctx.reply('Номер вашей группы?', null, Markup
                    .keyboard(groups, {columns: 3}).oneTime()
                );
            });
        },
        async (ctx) => {
            ctx.session.stud_group = +ctx.message.text;

            let valid_groups = await new Promise(resolve => trit_data.getValidGroups(resolve));
            if (valid_groups.indexOf(+ctx.session.stud_group) === -1) {
                ctx.scene.leave();
                return ctx.reply('Указанная группа неверная, бот не настроен.',
                    null,
                    Markup.keyboard(
                        [
                            Markup.button('Помощь', 'primary')
                        ]
                    ).oneTime()
                );
            }

            const user_info = await getUserInfo(ctx.message.from_id);

            let sql;
            if (typeof user_info == 'undefined') {
                sql = `INSERT INTO ${process.env.DB_TABLE}(vk_id,notify_c,notify_e_d,notify,user_group) VALUES(?,?,?,?,?)`;
                const values = [ctx.message.from_id, 1, 1, 1, ctx.session.stud_group];
                sql_db.callback(sql, values, function (err) {
                    if (err) {
                        ctx.reply('Технические шоколадки, успешно устраняем.');
                        return console.log(err);
                    }
                    ctx.reply('Вы успешно настроили вашу группу.', null, Markup.keyboard([
                        Markup.button('Расписание', 'positive'),
                        Markup.button('Расписание на завтра', 'positive'),
                        Markup.button('Настроить уведомления', 'primary'),
                        Markup.button('Указать группу', 'primary'),
                    ], {columns: 2}).oneTime());
                });
            } else {
                sql = `UPDATE ${process.env.DB_TABLE} SET user_group = ${ctx.session.stud_group} WHERE vk_id = ${ctx.message.from_id}`;
                sql_db.callback(sql, [], function (err) {
                    if (err) {
                        ctx.reply('Технические шоколадки, успешно устраняем.');
                        return console.log(err);
                    }
                    ctx.reply('Вы успешно настроили вашу группу.', null, reverse_markup);
                });
            }

            ctx.scene.leave();
        }
    );
};