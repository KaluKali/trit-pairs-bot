const SqlDB = require('../tools/sql_data');
const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');

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

    const buttons = {
        erase:{text: 'Удаление из системы', color:'negative', action: function (ctx) {
                ctx.reply('Вы уверены?',null,Markup.keyboard(
                    [
                        Markup.button('Да', 'negative'),
                        Markup.button('Нет', 'positive'),
                    ]
                ))
            }},
        exit:{text: 'Выход', color:'negative', action: function (ctx) {
                ctx.reply('Выберете один из вариантов:',null,reverse_markup);
                return ctx.scene.leave();
            }},
    };


    return new Scene('erase_account_data',
        (ctx) => {
            ctx.scene.next();

            const keyboard_list = [];
            for (let k of Object.keys(buttons)){
                keyboard_list.push(Markup.button(buttons[k].text, buttons[k].color))
            }

            ctx.reply('Что вы хотите настроить?', null, Markup
                .keyboard(keyboard_list, {columns: 2}).oneTime()
            );
        },
        (ctx) => {
            let buttons_opt;
            if (typeof ctx.message.payload !== 'undefined') buttons_opt = JSON.parse(ctx.message.payload);
            else buttons.exit.action(ctx);

            for (let k of Object.keys(buttons)){
                if (buttons[k].text === buttons_opt.button)  buttons[k].action(ctx);
            }

            ctx.scene.next();
        },
        (ctx) => {
            let buttons_opt;
            if (typeof ctx.message.payload !== 'undefined') buttons_opt = JSON.parse(ctx.message.payload);
            else buttons.exit.action(ctx);

            if (buttons_opt.button==='Нет') buttons.exit.action(ctx);
            else {
                const sql = `DELETE FROM ${process.env.DB_TABLE} WHERE vk_id LIKE '%${ctx.message.from_id}%'`;
                sql_db.callback(sql, [], function (err) {
                    if (err) {
                        ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                        return console.log(err);
                    } else ctx.reply('Вы успешно удалили свои данные.', null, reverse_markup);
                });
            }

            ctx.scene.leave();
        });
};