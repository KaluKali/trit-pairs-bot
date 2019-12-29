const SqlDB = require('../tools/sql_data');
const Scene = require('node-vk-bot-api/lib/scene');
const Markup = require('node-vk-bot-api/lib/markup');
const TritData = require('../trit_data')
const global_params = require('../globals')

var sql_db = new SqlDB();


function getUserInfo(vk_id) {
    return sql_db.getData(`SELECT * FROM ${global_params.db_table} WHERE vk_id LIKE ${vk_id} LIMIT 1`,[]);
}

const scene_group = new Scene('group',
    (ctx) => {
        ctx.scene.next();
        ctx.reply('Номер вашей группы?', null, Markup
            .keyboard(TritData.ValidGroups(), {columns: 3}).oneTime()
        );
    },
    async (ctx) => {
        ctx.session.stud_group = +ctx.message.text;
        if (!TritData.isGroup(+ctx.session.stud_group)){
            ctx.scene.leave();
            return ctx.reply('Указанная группа неверная, бот не настроен.',
                null,
                Markup.keyboard(
                    [
                        Markup.button('Помощь', 'primary')
                    ]
                ).oneTime()
            );
        }

        const user_info = await getUserInfo(ctx.message.from_id);

        if(typeof user_info == 'undefined'){
            var sql = `INSERT INTO ${global_params.db_table}(vk_id,user_group) VALUES(?,?)`;
            var values = [ctx.message.from_id,ctx.session.stud_group]
            sql_db.callback(sql, values, function(err, results) {
                if(err){ctx.reply('Технические шоколадки, успешно устраняем.'); return console.log(err);}
                ctx.reply('Вы успешно настроили вашу группу.', null, Markup.keyboard([
                    Markup.button('Расписание', 'positive'),
                    Markup.button('Расписание на завтра', 'positive'),
                    Markup.button('Настроить уведомления', 'primary'),
                    Markup.button('Указать группу', 'primary'),
                ], { columns:2 }).oneTime());
            });
        } else {
            var sql = `UPDATE ${global_params.db_table} SET user_group = ${ctx.session.stud_group} WHERE vk_id = ${ctx.message.from_id}`;
            sql_db.callback(sql,[],function (err) {
                if(err){ctx.reply('Технические шоколадки, успешно устраняем.'); return console.log(err);}
                ctx.reply('Вы успешно настроили вашу группу.',null,Markup.keyboard([
                    Markup.button('Расписание', 'positive'),
                    Markup.button('Расписание на завтра', 'positive'),
                    Markup.button('Настроить уведомления', 'primary'),
                    Markup.button('Указать группу', 'primary'),
                ], { columns:2 }).oneTime());
            });
        }

        ctx.scene.leave();
    }
);

module.exports = scene_group