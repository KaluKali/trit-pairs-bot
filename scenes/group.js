const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');


const group = function (reverse_markup, table_style, resources) {
    return new Scene('group',
        (ctx) => {
            ctx.scene.next();
            resources.data.getGroups((groups)=>{
                ctx.reply('Номер вашей группы?', null,
                    Markup.keyboard(groups, {columns: 3}).oneTime()
                );
            });
        },
        async (ctx) => {
            ctx.session.stud_group = +ctx.message.text;

            let valid_groups = await new Promise(resolve => resources.data.getGroups(resolve));
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

            const [user_info] = await resources.db.userInfo(ctx.message.from_id);

            let sql;
            if (!user_info) {
                sql = `INSERT INTO ${process.env.DB_TABLE}(vk_id,notify_c,notify_e_d,notify,user_group,notify_groups_c) VALUES($1,$2,$3,$4,$5,$6)`;
                const values = [ctx.message.from_id, 1, 1, 1, ctx.session.stud_group, [ctx.session.stud_group]];
                resources.db.callback(sql, values, function (err) {
                    if (err) {
                        ctx.reply('Технические шоколадки, успешно устраняем.');
                        return console.error(err);
                    }
                    ctx.reply('Вы успешно настроили вашу группу.', null, reverse_markup);
                });
            } else {
                sql = `UPDATE ${process.env.DB_TABLE} SET user_group = ${ctx.session.stud_group} WHERE vk_id = ${ctx.message.from_id}`;
                resources.db.callback(sql, [], (err) => {
                    if (err) {
                        ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                        return console.error(err);
                    } else ctx.reply('Вы успешно настроили группу.', null, reverse_markup);
                });
            }

            ctx.scene.leave();
        }
    );
};
module.exports = group;
