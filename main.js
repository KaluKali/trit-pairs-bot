const VkBot = require('node-vk-bot-api');
const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Scene = require('node-vk-bot-api/lib/scene');

const ServerTime = require('./server_time');
const TritData = require('./trit_data');
const MessageParser = require('./message_parser')

var table = require('text-table');

var schedule = require('node-schedule');

var server_time = new ServerTime();

var trit_data = new TritData();

const bot = new VkBot("your token");

const mysql = require("mysql2");

const stud_table = 'users'; // name table in bd

const pairs_time = [
    '8:00 - 8:45',
    '8:50 - 9:35',
    '9:50 - 10:35',
    '10:40 - 11:25',
    '11:45 - 12:30',
    '12:45 - 13:30',
    '13:40 - 14:25',
    '14:30 - 15:15',
];

scheduleStart(server_time.getDay());

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "botdb",
  password: "root"
});

connection.connect(function(err){
    if (err) {
      return console.error("Ошибка подключения к MySQL: " + err.message);
    } else {
      console.log("MySQL connected.");
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
bot.command('найди', (ctx)=>{
    const res = new MessageParser();
    find_Pairs(ctx,res.parse2_find_arg(ctx.message.body));
})

bot.command('debug', (ctx)=>{

})
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
        ctx.reply('Напиши мне, что именно хочешь настроить? Можешь написать "помощь" для получения справки по функциям!');
    }
});
bot.command('расписание', async (ctx)=>{
    const user_info = await getUserInfo(ctx.message.user_id);
    const parser = new MessageParser();

    const obj_parsed = parser.parse_pairs_day(ctx.message.body);

    if (obj_parsed.group === -1){
        obj_parsed.group = user_info.user_group;
    }
    pairs_Day(ctx,obj_parsed);
});
bot.on((ctx)=>{
    ctx.reply('Таких словечек я еще не знаю. Напиши мне "помощь" чтобы получить справку по функциям!')
})
bot.startPolling(() => {
    console.log('Bot started.')
});

async function getUserInfo(vk_id) {
    const sql = `SELECT * FROM ${stud_table} WHERE vk_id LIKE ${vk_id} LIMIT 1`;
    return new Promise((resolve => {
        connection.query(sql, function(err, results) {
            if(err) console.log(err);
            else resolve(results[0]);
        });
    }));
}

function scheduleStart(weekday){
    schedule.scheduleJob('00 07 * * *', function(){
        p_D_to_all(weekday);
        scheduleStart(weekday);
    });
}

async function pairs_Day(ctx, obj){ //send pairs to people
    if (typeof ctx === 'undefined' || typeof obj === 'undefined'){
        return new Error('pairs_Day: Argument error');
    }
    if (obj.group === 0){
        return ctx.reply('Вы не указали пару или не настроили бота! Напиши мне "помощь" для получения справки по функциям!')
    }

    const weekday = obj.weekday !== "" ? obj.weekday : server_time.getNowDayWeek();
    const group = obj.group;

    trit_data.getData(function (data) {
        data_day = data[group]['weekdays'][weekday]['pairs'];
        const data_day_s = []
        data_day.forEach(function (pair,i) {
            if (i < 4){// Pair limit
                p = [data_day[i].name != false ? data_day[i].name : '-', data_day[i].room != false ? data_day[i].room : '-'];
                data_day_s.push(p.slice(),p.slice());
            }
        });
        data_day_s.forEach(function (elem,i) {
            elem.push(pairs_time[i]);
            elem.unshift(i+1);
        });
        const t = table(data_day_s, { align: [ 'l', 'c', 'l' ], hsep: ' || ' });
        ctx.reply(`Список уроков для ${group} группы на ${weekday}.\n\n${t.toString()}`);
    })
}

async function find_Pairs(ctx, obj){ //send pairs to people
    if (typeof obj !== 'undefined' || typeof ctx !== 'undefined'){
        if (obj.pair === ""){
            return ctx.reply('Ты не указал пару которую нужно найти!');
        }
    } else {
        return new Error('find_Pairs: Argument error');
    }

    const pair = obj.pair;
    const group = obj.group;
    const weekday = obj.weekday !== "" ? obj.weekday : -1

    trit_data.getData(function (data) {
        const fin = [];
        TritData.getValidGroups.forEach(function (group_f, i) {
            for (var weekday_f in data[group_f]['weekdays']){
                data[group_f]['weekdays'][weekday_f].pairs.forEach(function (pair_f) {
                    if ((pair_f.name+'').toLowerCase().indexOf(pair) + 1){
                        fin.push([pair_f.name,weekday_f,group_f]);
                    }
                });
            }
        });

        let s_response;

        if (group !== -1 && weekday !== -1){
            s_response = fin.filter(obj_f => obj_f[2] == group && obj_f[1] == weekday);
        } else {
            if (group == -1 && weekday !== -1){
                s_response = fin.filter(obj_f => obj_f[1] == weekday);
            } else {
                if (group !== -1 && weekday == -1){
                    s_response = fin.filter(obj_f => obj_f[2] == group);
                } else {
                    s_response = fin;
                }
            }
        }

        const t = table(typeof s_response == 'undefined' ? '' : s_response, { align: [ 'r', 'c', 'l' ], hsep: ' || ' });

        ctx.reply(`Список пар, найденных на ${weekday == -1 ? 'всю неделю' : weekday} у ${group == -1 ? 'всех групп' : `группы ${group}`}:\n\n${t}`);
    })
}

async function p_D_to_all(weekday){
    const sql = `SELECT vk_id FROM ${stud_table}`;
    connection.query(sql, function(err, results) { // получаем список всех юзеров из вк
        if(err) console.log(err);
        const users = [];
        for(let i=0; i < results.length; i++){
            users.push(results[i].vk_id); // формируем список юзеров
        }
        trit_data.getData(async function (data) {
            const exec_groups = [];
            const g_users = []
            for (var i =0;i<users.length;i++){
                const user_info = await getUserInfo(users[i]); // todo !!! запрашиваем таблицу по каждому юзеру
                exec_groups.push(user_info.user_group); // получаем его группу
                g_users.push(user_info); // формируем список таблиц юзеров
            }
            uniq_exec_groups = [...new Set(exec_groups)]
            // сортируем только по уникальным значениям, получая те группы которым нужно сформировать таблицу расписания
            uniq_exec_groups.forEach(function (group) {
                data_day = data[group]['weekdays'][weekday]['pairs'];
                const data_day_s = []
                // формируем таблицу
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
                // формируем таблицу end
                const send_users = g_users.filter(user => user.user_group == group && user.notify == 1 && user.notify_e_d == 1);
                // сортируем по группе, параметрам уведомлений которые выставлены у юзеров
                // получая список юзеров которым нужно отправить расписание
                const send_users_id = []
                for (var i=0;i<send_users.length;i++){
                    send_users_id.push(send_users[i].vk_id)
                }

                const t_s = `Список уроков для ${group} группы на ${weekday}.\n\n${t.toString()}`

                bot.sendMessage(send_users_id,t_s)
            });
        })
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
        if (!TritData.isGroup(ctx.session.stud_group)){
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