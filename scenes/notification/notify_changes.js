const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');


const notify_changes = function (reverse_markup, table_style, resources) {
    const optional_buttons = [
        Markup.button('Закончить', 'primary'),
    ];
    return new Scene('notify_c',
        ctx=>{
            if (ctx.message.payload) {
                const payload = JSON.parse(ctx.message.payload).button;

                switch (payload) {
                    case 'Отключить':
                        const sql = `UPDATE ${process.env.DB_TABLE} SET notify_c = false WHERE vk_id = ${ctx.message.from_id}`;
                        resources.db.callback(sql, [], (err) => {
                            if (err) {
                                ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                                return console.error(err);
                            } else {
                                ctx.reply('Вы успешно настроили уведомления.', null, reverse_markup);
                                ctx.scene.leave();
                            }
                        });
                        break;
                    case 'Настроить':
                        resources.data.getGroups(groups=>{
                            return ctx.reply('Выберите группы для получения их ежедневного расписания:', null,
                                Markup.keyboard(
                                    [...optional_buttons,
                                        ...groups.map(btn=>ctx.session.marked_groups ?
                                            ctx.session.marked_groups.includes(btn) ?
                                                Markup.button(btn, 'positive') : btn : btn)]
                                    , {columns: 3})
                            );
                        });
                        ctx.scene.next();
                        break;
                    default:
                        ctx.reply('Что вы хотите сделать?', null, Markup.keyboard([
                            Markup.button('Отключить', 'negative'),
                            Markup.button('Настроить', 'positive'),
                        ]).oneTime());
                        break;
                }
            } else {
                ctx.reply('Что вы хотите сделать?', null, Markup.keyboard([
                    Markup.button('Отключить', 'negative'),
                    Markup.button('Настроить', 'positive'),
                ]).oneTime());
            }
        },
        ctx=>{
            if (ctx.message.payload) {
                const payload = JSON.parse(ctx.message.payload).button;

                switch (payload) {
                    case 'Закончить':
                        if (!ctx.session.marked_groups || !ctx.session.marked_groups.length) {
                            ctx.reply('Вы не выбрали ни одной группы, желаете закончить настройку?', null, Markup.keyboard([
                                Markup.button('Да', 'positive'),
                                Markup.button('Нет', 'negative'),
                            ], {columns: 2}).oneTime());
                        } else {
                            ctx.scene.next();
                            const sql =
                                `UPDATE ${process.env.DB_TABLE} SET notify_groups_c = '{${ctx.session.marked_groups.join(',')}}', notify_c=true WHERE vk_id = ${ctx.message.from_id}`;
                            resources.db.callback(sql, [], function (err) {
                                if (err) {
                                    ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                                    return console.error(err);
                                } else ctx.reply('Вы успешно настроили уведомление об измениях в расписании.', null, reverse_markup);
                                ctx.session.marked_groups = [];
                                ctx.scene.leave();
                            });
                        }
                        break;
                    case 'Да':
                        ctx.reply('Вы отменили настройку уведомлений.', null, reverse_markup);
                        ctx.scene.leave();
                        break;
                    default:
                        if (!ctx.session.marked_groups) ctx.session.marked_groups=[];
                        if (Number.isInteger(payload)) {
                            const find_result = ctx.session.marked_groups.indexOf(payload);
                            if (find_result !== -1) {
                                ctx.session.marked_groups.splice(find_result,1)
                            } else ctx.session.marked_groups = [...ctx.session.marked_groups, payload]
                        }
                        resources.data.getGroups(groups=>{
                            return ctx.reply('Выберите группы для получения их ежедневного расписания:', null,
                                Markup.keyboard(
                                    [...optional_buttons,
                                        ...groups.map(btn=>ctx.session.marked_groups ?
                                            ctx.session.marked_groups.includes(btn) ?
                                                Markup.button(btn, 'positive') : btn : btn)]
                                    , {columns: 3})
                            );
                        });
                        break;
                }
            } else {
                ctx.reply('Вы отменили настройку уведомления.', null, reverse_markup);
                ctx.scene.leave();
            }
        });
};

module.exports = notify_changes;
