const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const ServerTime = require('../tools/server_time');
const getUserInfo = require('../tools/user_info');
const ctx_methods = require('../methods/index');


const settings = function (reverse_markup) {
    const buttons = {};

    const weekdays = ServerTime.Weekdays();
    weekdays.shift();

    for (let w of weekdays){
        buttons[w] = {text:w, color:'primary', action: async function (ctx) {
                const user_info = await getUserInfo(ctx.message.from_id);
                if (typeof user_info === 'undefined'){
                    ctx.scene.leave();
                    return ctx.scene.enter('group');
                }
                const params = {group: user_info.user_group, weekday: w};

                ctx.scene.leave();
                return ctx_methods(reverse_markup).pairs_day(ctx,params);
            }}
    }

    return new Scene('week',
        (ctx) => {
            ctx.scene.next();

            const keyboard_list = [];
            for (let k of Object.keys(buttons)){
                keyboard_list.push(Markup.button(buttons[k].text, buttons[k].color))
            }

            ctx.reply('Выберите день недели:', null, Markup
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