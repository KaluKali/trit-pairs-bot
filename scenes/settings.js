const SqlDB = require('../tools/sql_data');
const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const TritData = require('../trit_data')
const global_params = require('../globals')

var sql_db = new SqlDB();


function getUserInfo(vk_id) {
    return sql_db.getData(`SELECT * FROM ${global_params.db_table} WHERE vk_id LIKE ${vk_id} LIMIT 1`,[]);
}
exports.ReverseMarkup = function (reverse_markup) {
    if (typeof reverse_markup === 'undefined'){
        reverse_markup = Markup.keyboard([
            Markup.button('Расписание', 'positive'),
            Markup.button('Расписание на завтра', 'positive'),
            Markup.button('Настроить уведомления', 'primary'),
            Markup.button('Указать группу', 'primary'),
        ], { columns:2 }).oneTime()
    }

    const scene = new Scene('settings',
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
            if (typeof ctx.message.payload !== 'undefined'){
                JSON.parse(ctx.message.payload).button === 'Да' ? ctx.session.notify_c = true : ctx.session.notify_c = false;
            } else {
                if (ctx.message.text.indexOf('да')>-1 || ctx.message.text.indexOf('Да')>-1){
                    ctx.session.notify_c = true
                } else {
                    ctx.session.notify_c = false
                }
            }

            ctx.scene.next()

            ctx.reply('Хотите получать расписание вашей группы каждый день?', null, Markup
                .keyboard([
                    Markup.button('Да', 'positive'),
                    Markup.button('Нет', 'negative'),
                ]).oneTime()
            );
        },
        (ctx) => {
            if (typeof ctx.message.payload !== 'undefined'){
                JSON.parse(ctx.message.payload).button === 'Да' ? ctx.session.notify_e_d = true : ctx.session.notify_e_d = false;
            } else {
                if (ctx.message.text.indexOf('да')>-1 || ctx.message.text.indexOf('Да')>-1){
                    ctx.session.notify_e_d = true
                } else {
                    ctx.session.notify_e_d = false
                }
            }

            ctx.scene.next();

            ctx.reply('Номер вашей группы?', null, Markup
                .keyboard(TritData.ValidGroups(), {columns: 3}).oneTime()
            );
        },
        async (ctx) => {
            ctx.session.stud_group = +ctx.message.text;
            if (!TritData.isGroup(+ctx.session.stud_group)){
                ctx.scene.leave();
                return ctx.reply('Указанная группа неверная, бот не настроен. Напиши мне "помощь" для справки по функциям!',
                    null,
                    Markup.keyboard(
                        [
                            Markup.button('Помощь', 'primary')
                        ]
                    ).oneTime()
                );
            }

            var str_reply = 'Вы успешно настроили бота, теперь он:'
            if (ctx.session.notify_c){ str_reply += '\nприсылает вам дневное расписание каждый день'}
            if (ctx.session.notify_e_d){ str_reply+= '\nсообщает об изменении в расписании'}
            if (!ctx.session.notify_c && !ctx.session.notify_e_d) { str_reply+= '\nничего не делает.'}

            const user_info = await getUserInfo(ctx.message.from_id);

            if(typeof user_info == 'undefined'){
                var sql = `INSERT INTO ${global_params.db_table}(vk_id,notify_c,notify_e_d,notify,user_group) VALUES(?,?,?,?,?)`;
                var values = [ctx.message.from_id,ctx.session.notify_c,ctx.session.notify_e_d,1,ctx.session.stud_group]
                sql_db.callback(sql, values, function(err, results) {
                    if(err) console.log(err);
                });
            } else {
                var sql = `UPDATE ${global_params.db_table} SET notify_c = ${ctx.session.notify_c},notify_e_d = ${ctx.session.notify_e_d},user_group = ${ctx.session.stud_group} WHERE vk_id = ${ctx.message.from_id}`;
                sql_db.callback(sql,[],function (err) {
                    if(err) console.log(err);
                })
            }

            ctx.reply(str_reply,null,reverse_markup);
            ctx.scene.leave();
        }
    );

    return scene;
}