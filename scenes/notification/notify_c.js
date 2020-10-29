const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');


const notify_c = function (reverse_markup, table_style, resources) {
    return new Scene('notify_c',
        (ctx) => {
            ctx.scene.next();
            ctx.reply('Хотите получать уведомление об измении в расписании?', null, Markup
                .keyboard([
                    Markup.button('Да', 'positive'),
                    Markup.button('Нет', 'negative'),
                ]).oneTime()
            );
        },
        (ctx) => {
            if (typeof ctx.message.payload !== 'undefined') {
                JSON.parse(ctx.message.payload).button === 'Да' ? ctx.session.notify_c = true : ctx.session.notify_c = false;
            } else {
                ctx.session.notify_c = ctx.message.text.indexOf('да') !== -1 || ctx.message.text.indexOf('Да') !== -1;
            }

            const sql = `UPDATE ${process.env.DB_TABLE} SET notify_c = ${ctx.session.notify_c} WHERE vk_id = ${ctx.message.from_id}`;
            resources.db.callback(sql, [], function (err) {
                if (err) {
                    ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                    return console.error(err);
                } else ctx.reply('Вы успешно настроили уведомления.', null, reverse_markup);
            });
            ctx.scene.leave();
        });
};

module.exports = notify_c;
