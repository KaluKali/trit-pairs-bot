const VkBot = require('node-vk-bot-api');
const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Markup = require('node-vk-bot-api/lib/markup');

var table = require('text-table');
var schedule = require('node-schedule');

const ServerTime = require('./server_time');
const TritData = require('./trit_data');
const MessageParser = require('./tools/message_parser');
// const YaSpeller = require('./tools/ya_speller');
const SqlDB = require('./tools/sql_data');
const levenshtein = require('./tools/levenshtein')

const global_params = require('./globals');

const hello_carousel = require('./carousels/carousel');

const white_list = ['расписание','найди','помощь','настроить','привет','меню','начать'];

var server_time = new ServerTime();
var trit_data = new TritData();
// var ya_speller = new YaSpeller();
var sql_db = new SqlDB();
const message_parser = new MessageParser();

const bot = new VkBot("77c5ccdc618ed80de1493e236705be07285ecd857a520ffa92d788cc9a7ca124022c4deab258c069d62e5");

const help =
    ['1.1 Для настройки уведомлений напиши мне: \n"настроить уведомления"',
    '1.2 Для настройки группы напиши мне: \n"настроить группу"',
    '1.3 Для полной настройки бота напиши мне: \n"настроить"',
    '1.4 Для получения меню напиши мне: \n"меню"',
    '2.1 Для получения Твоего расписания на сегодня напиши мне: \n"расписание"',
    '2.2 Для получения Твоего расписания на завтра напиши мне: \n"расписание на завтра"',
    '2.3 Для получения Твоего расписания на любой день недели: \n"расписание на {день недели}"',
    '3.1 Для получения расписания Любой группы на любой день недели: \n"расписание {№ группы} на {день недели}"',
    '3.2 Для получения расписания Любой группы на завтра: \n"расписание {№ группы} на завтра"',
    '3.3 Для получения расписания Любой группы на сегодня: \n"расписания {№ группы}"',
    '4.1 Найти когда будет пара по всей неделе: \n"найди {пара}"',
    '4.2 Найти когда будет пара на определенный день недели: \n"найди {пара} на {день недели}"',
    '4.3 Найти когда будет пара у группы по всей неделе: \n"найди {номер группы} {пара}"',
    '4.4 Найти когда будет пара у группы на определнный день недели: \n"найди {номер группы} {пара} {день недели}"'];

const revers_menu = Markup.keyboard([
    Markup.button('Расписание', 'positive'),
    Markup.button('Расписание на завтра', 'positive'),
    Markup.button('Настроить уведомления', 'primary'),
    Markup.button('Указать группу', 'primary'),
], { columns:2 }).oneTime();
const ctx_scenes = require('./scenes/index').Init(revers_menu);


scheduleStart(server_time.getNowDayWeek());

function scheduleStart(weekday){
    schedule.scheduleJob('40 09 * * *', function(){
        p_D_to_all(weekday);
    });
}

async function getUserInfo(vk_id) {
    return sql_db.getData(`SELECT * FROM ${global_params.db_table} WHERE vk_id LIKE ${vk_id} LIMIT 1`,[]);
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
            elem.push(TritData.PairsTime()[i]);
            elem.unshift(i+1);
        });
        const t = table(data_day_s, { align: [ 'l', 'c', 'l' ], hsep: ' || ' });
        ctx.reply(`Список уроков для ${group} группы на ${weekday}.\n\n${t.toString()}`,null,revers_menu);
    })
}

async function find_Pairs(ctx, obj){ //send pairs to people
    if (typeof obj !== 'undefined' || typeof ctx !== 'undefined'){
        if (obj.pair === ""){
            return ctx.reply('Ты не указал какую пару нужно найти!',null,revers_menu);
        }
    } else {
        return new Error('find_Pairs: Argument error');
    }

    const pair = obj.pair;
    const group = obj.group;
    const weekday = obj.weekday !== "" ? obj.weekday : -1

    trit_data.getData((data) => {
        const fin = [];
        TritData.ValidGroups().forEach((group_f, i) => {
            for (var weekday_f in data[group_f]['weekdays']){ // data[group_f] is not iterable
                data[group_f]['weekdays'][weekday_f].pairs.forEach((pair_f)=> {
                    console.log(pair_f)
                    var pair_s = (pair_f.name+'')
                    if (pair_s.indexOf(pair) !== -1 || levenshtein(pair_s,pair) <= 2){
                        fin.push([pair_f.name,weekday_f,group_f]);
                    }
                });
            }
        });

        let s_response;

        if (group !== -1 && weekday !== -1) s_response = fin.filter(obj_f => obj_f[2] == group && obj_f[1] == weekday);
        else {
            if (group == -1 && weekday !== -1) s_response = fin.filter(obj_f => obj_f[1] == weekday);
            else {
                if (group !== -1 && weekday == -1) s_response = fin.filter(obj_f => obj_f[2] == group);
                else s_response = fin;
            }
        }

        const t = table(typeof s_response == 'undefined' ? '' : s_response, { align: [ 'r', 'c', 'l' ], hsep: ' || ' });

        ctx.reply(`Список пар, найденных на ${weekday == -1 ? 'всю неделю' : weekday} у ${group == -1 ? 'всех групп' : `группы ${group}`}:\n\n${t}`,null,revers_menu);
    })
}

async function p_D_to_all(weekday){
    const sql = `SELECT vk_id FROM ${global_params.db_table}`;
    sql_db.callback(sql, (err, results) => { // получаем список всех юзеров из вк
        if(err) console.log(`p_D_to_all Error: ${err}`);
        const users = [];
        for(let i of results) users.push(i.vk_id); // формируем список юзеров
        trit_data.getData(async (data) => {
            const exec_groups = [];
            const g_users = []
            for (let i of users){
                const user_info = await getUserInfo(i).catch(err=>console.log(`p_D_to_all user_info error:${err}`)); // todo !!! запрашиваем таблицу по каждому юзеру
                exec_groups.push(user_info.user_group); // получаем его группу
                g_users.push(user_info); // формируем список таблиц юзеров
            }
            uniq_exec_groups = [...new Set(exec_groups)]
            // сортируем только по уникальным значениям, получая те группы которым нужно сформировать таблицу расписания
            uniq_exec_groups.forEach((group) => {
                data_day = data[group]['weekdays'][weekday]['pairs'];
                const data_day_s = []
                // формируем таблицу
                data_day.forEach((pair,i) => {
                    if (i < 4){
                        p = [data_day[i].name != false ? data_day[i].name : '-', data_day[i].room != false ? data_day[i].room : '-'];
                        data_day_s.push(p.slice(),p.slice());
                    }
                });
                data_day_s.forEach((elem,i) => {
                    elem.push(TritData.PairsTime()[i]);
                    elem.unshift(i+1);
                });

                const t = table(data_day_s, { align: [ 'l', 'c', 'l' ], hsep: ' || ' });
                // формируем таблицу end
                var send_users = g_users.filter(user => user.user_group === group && user.notify === 1 && user.notify_e_d === 1);
                // сортируем по группе, параметрам уведомлений которые выставлены у юзеров
                // получая список юзеров которым нужно отправить расписание
                const send_users_id = []
                for (i of send_users) send_users_id.push(i.vk_id);
                if (send_users_id.length !== 0){
                    bot.sendMessage(send_users_id,`Список уроков для ${group} группы на ${weekday}.\n\n${t.toString()}`,null,revers_menu);
                }
            });
        })
    });
}

const session = new Session();
const settings_stage = new Stage(ctx_scenes[0],ctx_scenes[1],ctx_scenes[2],ctx_scenes[3]);
bot.use(session.middleware());
bot.use(settings_stage.middleware());

// bot.use(async (ctx, next) => {
//     const args = ctx.message.text
//         .replace(/ {1,}/g,' ')
//         .split(' ');
//     var ya_txt = await ya_speller.getText(args.shift());
//     for (var i=0;i<white_list.length;i++){
//         if (ya_txt === white_list[i]){
//             args.unshift(ya_txt);
//             ctx.message.text = args.join(' ');
//             return next();
//         }
//     }
//     next();
// }) // YandexSpeller
bot.use((ctx,next)=>{
    ctx.message.payload = typeof ctx.message.payload !== 'undefined' ? JSON.parse(ctx.message.payload) : [];

    var message = ctx.message.text.split(' ');
    for (let i of white_list){
        if (levenshtein(i, message[0]) <= 2){
            message.shift()
            message.unshift(i)
            ctx.message.text = message.join(' ');
            return next();
        }
    }
    next();
});
bot.command('помощь', (ctx)=>{
    ctx.reply(help.join('\n\n'),null,revers_menu);
});
bot.command('привет', (ctx)=>{
    ctx.reply('Привет. А ты знаешь что я умею?Нет?Напиши мне "помощь"!',null,Markup.keyboard(
        [
            Markup.button('Помощь', 'primary')
        ]
    ).oneTime());
});
bot.command('меню', async (ctx)=>{
    if (ctx.client_info.carousel !== true){
        if (ctx.client_info.keyboard !== true){
            ctx.reply('Сожалеем. Вам доступны только текстовые команды.');
        } else {
            ctx.reply('Выберете один из вариантов:',null,revers_menu);
        }
    } else return await bot.execute('messages.send', {
        user_id: ctx.message.from_id,
        message:'Возможности бота:',
        random_id:Math.floor(Math.random()*1000),
        template:JSON.stringify(hello_carousel)
    }).catch((res)=>{
        console.log(res);
    });
})
bot.command('найди', (ctx)=>{
    find_Pairs(ctx,message_parser.parse2_find_arg(ctx.message.text));
});
bot.command('найти пару', (ctx)=>{
    ctx.reply([help[help.length-1],help[help.length-2],help[help.length-3],help[help.length-4]].join('\n\n'));
});
bot.command('настроить', (ctx) => {
    const params = message_parser.parse_settings(ctx.message.text);
    if (params.change_group){
        ctx.scene.enter('group');
    } else if (params.notify){
        ctx.reply('Какие именно уведомления вы хотите настроить?',null,Markup.keyboard(
            [
                Markup.button('Ежедневные', 'secondary', {method:'setting', button:'notify_e_d'}),
                Markup.button('Измения в расписании.', 'secondary',{method:'setting', button:'notify_c'}),
            ]
        ).oneTime());
    } else if (params.settings){
        ctx.scene.enter('settings');
    } else ctx.scene.enter('settings');
});
bot.command('указать группу', (ctx)=>{
    ctx.scene.enter('group');
})
bot.command('расписание', async (ctx)=>{
    const user_info = await getUserInfo(ctx.message.from_id);
    const obj_parsed = message_parser.parse_pairs_day(ctx.message.text);

    if (typeof user_info === 'undefined'){
        ctx.scene.enter('group');
    } else {

        if (obj_parsed.group === -1) obj_parsed.group = user_info.user_group;

        pairs_Day(ctx,obj_parsed);
    }
});
bot.command('начать', (ctx)=>{
    ctx.reply('Привет! А ты знаешь что я умею?Нет?Напиши мне "помощь"!',null,Markup.keyboard(
        [
            Markup.button('Помощь', 'primary')
        ]
    ).oneTime());
})
bot.on(async (ctx) => {
    switch (ctx.message.payload.method) {
        case 'on':
            if (ctx.message.payload.button === 'Да'){
                if (typeof ctx.client_info.carousel === 'undefined'){
                    return ctx.reply(help.join('\n\n'));
                } else {
                    return await bot.execute('messages.send', {
                        user_id: ctx.message.from_id,
                        message:'Возможности бота:',
                        random_id:Math.floor(Math.random()*1000),
                        template:JSON.stringify(hello_carousel)
                    }).catch((res)=>{
                        console.log(res);
                    });
                }
            } else return ctx.reply('Выберете один из вариантов:',null,revers_menu);
        case 'setting':
            if (ctx.message.payload.button === 'notify_c') ctx.scene.enter('notify_c');
            else if (ctx.message.payload.button === 'notify_e_d') ctx.scene.enter('notify_e_d');
            else if (ctx.message.payload.button === 'group') ctx.scene.enter('group');
            else if (ctx.message.payload.button === 'settings') ctx.scene.enter('settings');
    }
    ctx.reply('Таких словечек я еще не знаю. Хотите получить помощь по функциям?',null,Markup.keyboard(
        [
            Markup.button('Да', 'positive', {method:'on', button:'Да'}),
            Markup.button('Нет', 'negative',{method:'on', button:'Нет'}),
        ]
    ).oneTime())
});
bot.startPolling((err) => {
    console.log('Bot started.')
});