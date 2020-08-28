const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');

const settings = (reverse_markup) => {
    const buttons = [
        {text: 'Уведомления', color:'primary', action: function (ctx) {
                ctx.scene.leave();
                return ctx.scene.enter('choice_notify');
            }},
        {text: 'Группа', color:'primary', action:function (ctx) {
                ctx.scene.leave();
                return ctx.scene.enter('group');
            }},
        {text: 'Персональные данные', action:function (ctx) {
                ctx.scene.leave();
                return ctx.scene.enter('erase_account_data');
            }},
        {text: 'Тема расписания',color:'positive', action:function (ctx) {
                ctx.scene.leave();
                return ctx.scene.enter('theme');
            }},
        {text: 'Выход', color:'negative', action: function (ctx) {
                ctx.reply('Выберите один из вариантов:',null,reverse_markup);
                return ctx.scene.leave();
            }},
    ];


    return new Scene('settings',
        (ctx) => {
            ctx.scene.next();

            ctx.reply('Что вы хотите настроить?', null, Markup
                .keyboard(buttons.map(button=>(Markup.button(button.text, button.color))),
                    {columns: 2}
                    ).oneTime()
            );
        },
        (ctx) => {
            if (typeof ctx.message.payload !== 'undefined') {
                const buttons_opt = JSON.parse(ctx.message.payload);
                buttons.filter(button=>(button.text===buttons_opt.button))[0].action(ctx);
            }
            else {
                ctx.reply('Выберите один из вариантов:',null,reverse_markup);
                return ctx.scene.leave();
            }
        });
};

module.exports = settings;
