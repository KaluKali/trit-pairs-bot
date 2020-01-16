const SqlDB = require('../../tools/sql_data');
const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');

const sql_db = new SqlDB();

const notify_e_d = function (reverse_markup) {
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

            const sql = `UPDATE ${process.env.DB_TABLE} SET notify_e_d = ${ctx.session.notify_e_d} WHERE vk_id = ${ctx.message.from_id}`;

            sql_db.callback(sql, [], function (err) {
                if (err) {
                    ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                    return console.log(err);
                } else ctx.reply('Вы успешно настроили уведомления.', null, reverse_markup);
            });

            ctx.scene.leave();
        });
};

module.exports = notify_e_d;