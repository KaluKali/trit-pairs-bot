const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
// const hello_carousel = require('../carousels/carousel');

const settings = function (reverse_markup) {
    const buttons = {
        yes:{text: 'Да', color:'positive', action: (ctx) => {
                ctx.reply('Выберите один из вариантов:',null,reverse_markup);
                return ctx.scene.leave();
                // if (typeof ctx.client_info.carousel === 'undefined'){
                //     ctx.reply('Выберите один из вариантов:',null,reverse_markup);
                //     return ctx.scene.leave();
                // } else {
                //     ctx.bot.execute('messages.send', {
                //         user_id: ctx.message.from_id,
                //         message: 'Возможности бота:',
                //         random_id: Math.floor(Math.random() * 1000),
                //         template: JSON.stringify(hello_carousel)
                //     }).catch((err) => {
                //         console.log('In scene "unknown_command error: ', err);
                //     });
                //     return ctx.scene.leave();
                // }
            }},
        no:{text: 'Нет', color:'negative', action: function (ctx) {
                ctx.reply('Выберите один из вариантов:',null,reverse_markup);
                return ctx.scene.leave();
            }},
    };

    return new Scene('unknown_command',
        (ctx) => {
            ctx.scene.next();
            const keyboard_list = [];
            for (let k of Object.keys(buttons)){
                keyboard_list.push(Markup.button(buttons[k].text, buttons[k].color))
            }

            ctx.reply('Я не знаю такой команды, хотите перейти в главное меню?', null, Markup
                .keyboard(keyboard_list, {columns: 2}).oneTime()
            );
        },
        (ctx) => {
            let buttons_opt;
            if (typeof ctx.message.payload !== 'undefined') buttons_opt = JSON.parse(ctx.message.payload);
            else {
                ctx.reply('Выберите один из вариантов:',null,reverse_markup);
                return ctx.scene.leave();
            }

            for (let k of Object.keys(buttons)){
                if (buttons[k].text === buttons_opt.button)  buttons[k].action(ctx)
            }
        });
};

module.exports = settings;
