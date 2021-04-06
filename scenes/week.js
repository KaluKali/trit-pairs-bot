const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const ServerTime = require('../tools/server_time');
const ctx_methods = require('../methods/index');


const settings = (reverse_markup, table_style, resources) => {

    let weekdays = ServerTime.Weekdays();
    weekdays.shift();
    weekdays.push('Таблица')

    const buttons = weekdays.map(day=>day !== 'Таблица' ? ({
        text:day,
        color:'primary',
        action: ctx => resources.db.userInfo(ctx.message.from_id,['user_group'])
            .then(([user_info])=>{
                ctx.scene.leave();
                return ctx_methods(reverse_markup, table_style, resources).pairs_day(ctx, {group: user_info.user_group, weekday: day});
            })
            .catch((err) => {
                console.error(`Scene settings error: ${err}`);
                ctx.scene.leave();
                return ctx.scene.enter('group');
            })
    }) : ({
        text:day,
        color:'primary',
        action: ctx => resources.db.userInfo(ctx.message.from_id,['user_group'])
            .then(([user_info])=>{
                ctx.scene.leave();
                return ctx_methods(reverse_markup, table_style, resources).pairs_table(ctx);
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
