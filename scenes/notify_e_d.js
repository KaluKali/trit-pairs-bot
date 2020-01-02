const SqlDB = require('../tools/sql_data');
const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const global_params = require('../globals');

const sql_db = new SqlDB();

exports.ReverseMarkup = function (reverse_markup) {
    if (typeof reverse_markup === 'undefined') {
        reverse_markup = Markup.keyboard([
            Markup.button('Расписание', 'positive'),
            Markup.button('Расписание на завтра', 'positive'),
            Markup.button('Настроить уведомления', 'primary'),
            Markup.button('Указать группу', 'primary'),
        ], {columns: 2}).oneTime()
    }

    return new Scene('notify_e_d',
        (ctx) => {
            ctx.scene.next();
            ctx.reply('Хотите получать расписание вашей группы каждый день в 07:00 утра?', null, Markup
                .keyboard([
                    Markup.button('Да', 'positive'),
                    Markup.button('Нет', 'negative'),
                ]).oneTime()
            );
        },
        (ctx) => {
            if (typeof ctx.message.payload !== 'undefined') {
                JSON.parse(ctx.message.payload).button === 'Да' ? ctx.session.notify_e_d = true : ctx.session.notify_e_d = false;
            } else {
                ctx.session.notify_e_d = ctx.message.text.indexOf('да') !== -1 || ctx.message.text.indexOf('Да') !== -1;
            }

            const sql = `UPDATE ${global_params.db_table} SET notify_e_d = ${ctx.session.notify_e_d} WHERE vk_id = ${ctx.message.from_id}`;
            sql_db.callback(sql, [], function (err) {
                if (err) {
                    ctx.reply('Технические шоколадки, успешно устраняем.');
                    return console.log(err);
                } else ctx.reply('Вы успешно настроили уведомления.', null, reverse_markup);
            });

            ctx.scene.leave();
        });
};