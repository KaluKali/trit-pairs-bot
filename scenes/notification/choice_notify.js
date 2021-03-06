const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');

const choice_notify = function (reverse_markup) {
    const buttons = {
        notify_c:{text: 'Ежедневные', color:'primary', action: function (ctx) {
                ctx.scene.leave();
                ctx.scene.enter('notify_e_d')
            }},
        notify_e_d:{text: 'Изменения в расписании', color:'primary', action: function (ctx) {
                ctx.scene.leave();
                ctx.scene.enter('notify_c')
            }},
        exit:{text: 'Выход', color:'negative', action: function (ctx) {
                ctx.reply('Выберите один из вариантов:',null,reverse_markup);
                return ctx.scene.leave();
            }},
    };


    return new Scene('choice_notify',
        (ctx) => {
            ctx.scene.next();

            const keyboard_list = [];
            for (let k of Object.keys(buttons)){
                keyboard_list.push(Markup.button(buttons[k].text, buttons[k].color))
            }

            ctx.reply('Какие уведомления вы хотите настроить?', null, Markup
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

module.exports = choice_notify;