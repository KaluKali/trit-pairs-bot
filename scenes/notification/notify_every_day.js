const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');

const notify_every_day = function (reverse_markup, table_style, resources) {
    return new Scene('notify_e_d',
        // ctx.session - local storage which using for between middleware in scene
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
                            ctx.reply('Введите время получения ежедневных уведомлений в формате Часы:Минуты, пример:\n07:00');
                        }
                        break;
                    case 'Да':
                        ctx.reply('Вы отменили настройку уведомлений.', null, reverse_markup);
                        ctx.scene.leave();
                        break;
                    default:
                        if (ctx.session.marked_groups) {
                            if (Number.isInteger(payload)) {
                                const find_result = ctx.session.marked_groups.indexOf(payload);
                                if (find_result !== -1) {
                                    ctx.session.marked_groups.splice(find_result,1)
                                } else ctx.session.marked_groups = [...ctx.session.marked_groups, payload]
                            }
                            // в начале scene приходит предыдущее за ним сообщение
                        } else ctx.session.marked_groups = [];
                        resources.data.getGroups(groups=>{
                            return ctx.reply('Выберите группы для получения их ежедневного расписания:', null,
                                Markup.keyboard(
                                    [Markup.button('Закончить', 'primary'),
                                        ...groups.map(btn=>ctx.session.marked_groups ?
                                            ctx.session.marked_groups.includes(btn) ?
                                                Markup.button(btn, 'positive') : btn : btn)]
                                    , {columns: 3}).oneTime()
                            );
                        });
                        break;
                }
            } else {
                ctx.reply('Вы отменили настройку уведомления.', null, reverse_markup);
                ctx.scene.leave();
            }
        },
        ctx=>{
            if (ctx.message.payload) {
                const payload = JSON.parse(ctx.message.payload).button;
                if (payload === 'Да') {
                    ctx.reply('Вы отменили настройку уведомления.', null, reverse_markup);
                    ctx.scene.leave();
                } else {
                    ctx.reply('Введите время получения ежедневных уведомлений в формате Часы:Минуты, пример:\n07:00');
                }
            } else {
                // Он возвращет массив данных либо null если совпадения отсутствуют.
                const time_str_matched = ctx.message.text.match(/^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/g);
                if (time_str_matched) {
                    const sql =
                        `UPDATE ${process.env.DB_TABLE} SET notify_time = '${time_str_matched[0]}', notify_groups = '{${ctx.session.marked_groups.join(',')}}' WHERE vk_id = ${ctx.message.from_id}`;
                    resources.db.callback(sql, [], function (err) {
                        if (err) {
                            ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                            return console.error(err);
                        } else ctx.reply('Вы успешно настроили ежедневное уведомление.', null, reverse_markup);
                        ctx.session.marked_groups = [];
                        ctx.scene.leave();
                    });
                } else {
                    ctx.reply('Неверный формат времени, желаете закончить настройку?', null, Markup.keyboard([
                        Markup.button('Да', 'positive'),
                        Markup.button('Нет', 'negative'),
                    ], {columns: 2}).oneTime());
                }
            }
        });
};

module.exports = notify_every_day;
