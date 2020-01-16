const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const TritData = require('../trit_data');
const SqlDB = require('../tools/sql_data');

const getUserInfo = require('../tools/user_info');
const trit_data = new TritData();
const sql_db = new SqlDB();



const group = function (reverse_markup) {
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
                    ctx.reply('Вы успешно настроили вашу группу.', null, reverse_markup);
                });
            } else {
                sql = `UPDATE ${process.env.DB_TABLE} SET user_group = ${ctx.session.stud_group} WHERE vk_id = ${ctx.message.from_id}`;
                sql_db.callback(sql, [], function (err) {
                    if (err) {
                        ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                        return console.log(err);
                    } else ctx.reply('Вы успешно настроили группу.', null, reverse_markup);
                });
            }

            ctx.scene.leave();
        }
    );
};
module.exports = group;