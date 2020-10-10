const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const ServerTime = require('../tools/server_time');
const getUserInfo = require('../tools/user_info');
const ctx_methods = require('../methods/index');


const settings = (reverse_markup, table_style, res) => {

    let weekdays = ServerTime.Weekdays();
    weekdays.shift();

    const buttons = weekdays.map(day=>({
        text:day,
        color:'primary',
        action: ctx => getUserInfo(ctx.message.from_id,['user_group'])
            .then(([user_info])=>{
                ctx.scene.leave();
                return ctx_methods(reverse_markup, table_style, res).pairs_day(ctx, {group: user_info.user_group, weekday: day});
            })
            .catch((err) => {
                console.error(`Scene settings error: ${err}`);
                ctx.scene.leave();
                return ctx.scene.enter('group');
            })
    }));

    return new Scene('week',
        (ctx) => {
            ctx.scene.next();

            const keyboard = buttons.map(b=>(Markup.button(b.text, b.color)));

            ctx.reply('Выберите день недели:', null, Markup
                .keyboard(keyboard, {columns: 2}).oneTime()
            );
        },
        (ctx) => {
            if (ctx.message.payload) {
                const buttons_opt = JSON.parse(ctx.message.payload);

                buttons.forEach(button=>{if (button.text === buttons_opt.button) button.action(ctx)});
            }
            else {
                ctx.reply('Выберите один из вариантов:',null,reverse_markup);
                return ctx.scene.leave();
            }
        });
};

module.exports = settings;
