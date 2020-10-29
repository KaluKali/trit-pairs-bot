const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');

const theme = (reverse_markup, table_style, resources) => {
    const buttons = [
        {text: 'Темная', color:'primary', action: (ctx) => {
                ctx.scene.leave();

                resources.db.callback(`UPDATE ${process.env.DB_TABLE} SET theme = 1 WHERE vk_id = ${ctx.message.from_id}`,
                    [], (err) => {
                        if (err) {
                            ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                            return console.error(err);
                        } else ctx.reply('Вы успешно настроили тему расписания.', null, reverse_markup);
                    });
            }},
        {text: 'Светлая', color:'secondary', action: (ctx) => {
                ctx.scene.leave();

                resources.db.callback(`UPDATE ${process.env.DB_TABLE} SET theme = 0 WHERE vk_id = ${ctx.message.from_id}`,
                    [], (err) => {
                    if (err) {
                        ctx.reply('Технические шоколадки, успешно устраняем.', null, reverse_markup);
                        return console.error(err);
                    } else ctx.reply('Вы успешно настроили тему расписания.', null, reverse_markup);
                });
            }},
    ];


    return new Scene('theme',
        async (ctx) => {
            ctx.scene.next();

            const user_info = await resources.db.userInfo(ctx.message.from_id);
            if (!user_info){
                return ctx.scene.enter('group');
            } else {
                ctx.reply('Выберите тему', null,
                    Markup.keyboard(buttons.map(button=>(
                        Markup.button(button.text, button.color))),{columns: 2}
                    ).oneTime()
                );
            }
        },
        (ctx) => {
            if (ctx.message.payload) {
                const buttons_opt = JSON.parse(ctx.message.payload);
                buttons.filter(button=>(button.text===buttons_opt.button))[0].action(ctx);
            }
            else {
                ctx.reply('Кнопка не нажата - тема не настроена.',null,reverse_markup);
                return ctx.scene.leave();
            }
        });
};

module.exports = theme;
