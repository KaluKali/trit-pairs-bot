const VkBot = require('node-vk-bot-api');
const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Scene = require('node-vk-bot-api/lib/scene');
const ServerTime = require('./server_time')

var server_time = new ServerTime();

var Client = require('node-rest-client').Client;

var table = require('text-table')

var schedule = require('node-schedule');

var client = new Client();

const bot = new VkBot("YOUR CODE");

const mysql = require("mysql2");

const stud_table = 'users';

const pairs_time = [
    '8:00 - 8:45',
    '8:50 - 9:35',
    '9:50 - 10:35',
    '10:40 - 11:25',
    '11:45 - 12:30',
    '12:45 - 13:30',
    '13:40 - 14:25',
    '14:30 - 15:15',
]
const valid_groups = [
    12,13,14,15,16,21,22,23,24,25,26,31,32,33,34,35,36,41,42,43,46,101,102,103
]

scheduleStart(server_time.getDay());

var pairs_E_D_s = [] // pairs Every Day serialized to send to users

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "botdb",
  password: "root"
});

connection.connect(function(err){
    if (err) {
      return console.error("Ошибка MySQL2: " + err.message);
    }
    else{
      console.log("MySQL connected.");
    }
});

// const scene = new Scene('s_group',
//     (ctx)=>{
//         ctx.scene.next()
//         ctx.reply('Номер вашей группы?(Напиши мне только число)')
//     },
//     (ctx)=>{
//         ctx.session.stud_group = +ctx.message.body
//
//         valid_groups.forEach(function (group,i) {
//             if (ctx.session.stud_group == group){return;}
//             if (i == valid_groups.length){ctx.session.stud_group = 0;}
//         });
//         if (isNaN(ctx.session.stud_group) || ctx.session.stud_group == 0){
//             ctx.session.stud_group = 0;
//             ctx.reply('!!! Указанная группа неверная, напиши мне "помощь" для справки по функциям!');
//         }
//         ctx.scene.leave();
//
//         let str_reply = 'Вы успешно настроили бота, теперь он:'
//         if (ctx.session.notify_c){ str_reply += '\nприсылает вам дневное расписание каждый день'}
//         if (ctx.session.notify_y_d){ str_reply+= '\nсообщает об изменении в расписании'}
//         if (!ctx.session.notify_c && !ctx.session.notify_y_d) { str_reply+= '\nничего не делает.'}
//         ctx.reply(str_reply);
//
//         const user_info = await getUserInfo(ctx.message.user_id);
//
//         if(typeof user_info == 'undefined'){
//             let sql = `INSERT INTO ${stud_table}(vk_id,user_group) VALUES(?,?)`;
//             let values = [ctx.message.from_id || ctx.message.user_id,ctx.session.stud_group]
//             connection.query(sql, values, function(err, results) {
//                 if(err) console.log(err);
//                 else console.log("Query OK.");
//             });
//         } else {
//             let sql = `UPDATE ${stud_table} SET user_group = ${ctx.session.stud_group} WHERE vk_id = ${ctx.message.user_id}`;
//             connection.query(sql, [], function(err, results) {
//                 if(err) console.log(err);
//                 else console.log("Query OK.");
//             });
//         }
//     }
// );

async function getUserInfo(vk_id) {
    const sql = `SELECT * FROM ${stud_table} WHERE vk_id LIKE ${vk_id} LIMIT 1`;

    const mysql_p = require('mysql2/promise');

    const connection_p = await mysql_p.createConnection({host:'localhost', user: 'root',password:'root', database: 'botdb'});

    const [rows] = await connection_p.execute(sql);

    return rows[0];
}
async function pairs_Day(ctx, weekday,group){ //send pairs to people
    client.get("https://trit.biz/rr/json2.php",function (data, response) {
        data_day = data[group]['weekdays'][weekday]['pairs'];
        let data_day_s = []
        data_day.forEach(function (pair,i) {
            if (i < 4){
                p = [data_day[i].name != false ? data_day[i].name : '-', data_day[i].room != false ? data_day[i].room : '-'];
                data_day_s.push(p.slice(),p.slice());
            }
        });
        data_day_s.forEach(function (elem,i) {
            elem.push(pairs_time[i]);
            elem.unshift(i+1);
        });
        const t = table(data_day_s, { align: [ 'l', 'c', 'l' ], hsep: ' || ' })
        ctx.reply(`Список пар для ${group} группы на ${weekday}.\n\n${t.toString()}`)
    });
}
const scene = new Scene('settings',
    (ctx) => {
        ctx.scene.next()

        ctx.reply('Хотите получать уведомление об измении в расписании?(Напиши мне Да/Нет)')
    },
    (ctx) => {
        if (ctx.message.body.indexOf('да')>-1 || ctx.message.body.indexOf('Да')>-1){
            ctx.session.notify_c = true
        } else {
            ctx.session.notify_c = false
        }

        ctx.scene.next()
        ctx.reply('Хотите получать расписание вашей группы каждый день?(Напиши мне Да/Нет)')
    },
    (ctx) => {
        if (ctx.message.body.indexOf('да')>-1 || ctx.message.body.indexOf('Да')>-1){
            ctx.session.notify_y_d = true
        } else {
            ctx.session.notify_y_d = false
        }

        ctx.scene.next()
        ctx.reply('Номер вашей группы?(Напиши мне только число)')
    },
    async (ctx) => {
        ctx.session.stud_group = +ctx.message.body
        if (!isValidGroup(ctx.session.stud_group)){
            ctx.session.stud_group = 0;
        }

        if (isNaN(ctx.session.stud_group) || ctx.session.stud_group == 0){
            ctx.session.stud_group = 0;
            ctx.reply('!!! Указанная группа неверная, напиши мне "помощь" для справки по функциям!');
        }
        ctx.scene.leave();

        let str_reply = 'Вы успешно настроили бота, теперь он:'
        if (ctx.session.notify_c){ str_reply += '\nприсылает вам дневное расписание каждый день'}
        if (ctx.session.notify_y_d){ str_reply+= '\nсообщает об изменении в расписании'}
        if (!ctx.session.notify_c && !ctx.session.notify_y_d) { str_reply+= '\nничего не делает.'}
        ctx.reply(str_reply);

        const user_info = await getUserInfo(ctx.message.user_id);

        if(typeof user_info == 'undefined'){
            let sql = `INSERT INTO ${stud_table}(vk_id,notify_c,notify_y_d,user_group) VALUES(?,?,?,?)`;
            let values = [ctx.message.from_id || ctx.message.user_id,ctx.session.notify_c,ctx.session.notify_y_d,ctx.session.stud_group]
            connection.query(sql, values, function(err, results) {
                if(err) console.log(err);
                else console.log("Query OK.");
            });
        } else {
            let sql = `UPDATE ${stud_table} SET notify_c = ${ctx.session.notify_c},notify_y_d = ${ctx.session.notify_y_d},user_group = ${ctx.session.stud_group} WHERE vk_id = ${ctx.message.user_id}`;
            connection.query(sql, [], function(err, results) {
                if(err) console.log(err);
                else console.log("Query OK.");
            });
        }
    }
);
const session = new Session();
const stage = new Stage(scene);

bot.use(session.middleware());
bot.use(stage.middleware());

async function p_D_to_all(weekday){
    const sql = `SELECT vk_id FROM ${stud_table}`;
    connection.query(sql, async function(err, results) {
        if(err) console.log(err);
        const users = [];
        for(let i=0; i < results.length; i++){
            users.push(results[i].vk_id);
        }
        client.get("https://trit.biz/rr/json2.php",async function (data, response) {
            const exec_groups = [];
            const g_users = []
            for (var i =0;i<users.length;i++){
                const user_info = await getUserInfo(users[i]);
                exec_groups.push(user_info.user_group);
                g_users.push(user_info);
            }
            u_e_groups = [...new Set(exec_groups)]
            u_e_groups.forEach(function (group) {
                console.log(group)
                data_day = data[group]['weekdays'][weekday]['pairs'];
                const data_day_s = []
                data_day.forEach(function (pair,i) {
                    if (i < 4){
                        p = [data_day[i].name != false ? data_day[i].name : '-', data_day[i].room != false ? data_day[i].room : '-'];
                        data_day_s.push(p.slice(),p.slice());
                    }
                });
                data_day_s.forEach(function (elem,i) {
                    elem.push(pairs_time[i]);
                    elem.unshift(i+1);
                });
                const t = table(data_day_s, { align: [ 'l', 'c', 'l' ], hsep: ' || ' });
                const send_users = g_users.filter(user => user.user_group == group && user.notify == 1 && user.notify_e_d == 1);
                const send_users_id = []
                send_users.forEach(function (user) {
                    send_users_id.push(user.vk_id)
                })
                bot.sendMessage(send_users_id,t.toString())
            });

        });
    });
}
function scheduleStart(weekday){
    schedule.scheduleJob('00 07 * * *', function(){
        p_D_to_all(weekday);
        scheduleStart(weekday);
    });
}

function isValidGroup(group){
    for (var i=0;i<valid_groups.length;i++){
        if (valid_groups[i] == group){return true;}
    }
    return false;
}

bot.command('настроить', (ctx) => {
    const args = ctx.message.body.split(' ')

    if (args.length > 1){
        if (args[1].indexOf('бот') > -1){
            return ctx.scene.enter('settings');
        }
        if (args[1].indexOf('групп') > -1){
            return ctx.scene.enter('settings');
        }

    } else {
        ctx.reply('Напиши мне, что именно хочешь настроить? Можешь написать мне "помощь" для получения справки по функуциям!');
    }
});
bot.command('расписание', async (ctx)=>{
    const user_info = await getUserInfo(ctx.message.user_id);
    const args = ctx.message.body.split(' ');

    if (args.length > 1){
        const group = parseInt(args[1])
        if (!isNaN(group)){
            if(ctx.message.body.indexOf('на завтра') > -1){
                return pairs_Day(ctx,server_time.getDayWeek(server_time.getDay() + 1),group);
            } else {
                if (isValidGroup(group)){
                    return pairs_Day(ctx,server_time.getNowDayWeek(),group)
                } else { return ctx.reply('Неправильный номер группы.'); }
            }
        }
        if (typeof user_info != 'undefined'){
            if (ctx.message.body.indexOf('на завтра') > -1) {
                pairs_Day(ctx,server_time.getDayWeek(server_time.getDay() + 1),user_info.user_group);
            } else {
                pairs_Day(ctx,server_time.getNowDayWeek(),user_info.user_group);
            }
        } else {
            return ctx.reply('Вы не настроили бота и не указали группу. Не надо так :^(')
        }
    } else {
        if (typeof user_info != 'undefined'){
            if (user_info.user_group != 0){
                pairs_Day(ctx,server_time.getNowDayWeek(),user_info.user_group);
            } else {
                return ctx.reply('Вы не настроили бота и не указали группу. Не надо так :^(')
            }
        } else {
            return ctx.reply('Вы не настроили бота и не указали группу. Не надо так :^(')
        }
    }

});
bot.command('помощь', (ctx)=>{
    ctx.reply('Для настройки напиши мне - "настроить".\n' +
        'Для получения расписания напиши мне - "расписание".\n' +
        'Для получения расписания на завтра напиши мне - "расписание на завтра".\n' +
        'Узнать расписание другой группы - "расписания {№ группы}".')
})
bot.command('привет', (ctx)=>{
    ctx.reply('Привет. А ты знаешь что я умею?Нет?Напиши мне "помощь"!')
})
bot.on((ctx)=>{
    ctx.reply('Таких словечек я еще не знаю. Напиши мне "помощь" чтобы получить справку по функциям!')
})
bot.startPolling(() => {
  console.log('Bot started.')
});