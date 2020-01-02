// require('dotenv').config();


const VkBot = require('node-vk-bot-api');
const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Markup = require('node-vk-bot-api/lib/markup');

// const table = require('text-table');
const schedule = require('node-schedule');

const ServerTime = require('./server_time');
// const TritData = require('./trit_data');
const MessageParser = require('./tools/message_parser');
// const YaSpeller = require('./tools/ya_speller');
const SqlDB = require('./tools/sql_data');
const levenshtein = require('./tools/levenshtein');

const hello_carousel = require('./carousels/carousel');

const server_time = new ServerTime();
// var trit_data = new TritData();
// var ya_speller = new YaSpeller();
const sql_db = new SqlDB();
const message_parser = new MessageParser();

const bot = new VkBot(process.env.VK_API_KEY);

const reverse_menu = Markup.keyboard([
    Markup.button('Расписание', 'positive'),
    Markup.button('Расписание на завтра', 'positive'),
    Markup.button('Настроить уведомления', 'primary'),
    Markup.button('Указать группу', 'primary'),
], { columns:2 }).oneTime();
const ctx_scenes = require('./scenes/index').Init(reverse_menu);
const ctx_methods = require('./methods/index').Init(reverse_menu);

const white_list = ['расписание','найди','помощь','настроить','привет','меню','начать'];
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

schedule.scheduleJob(new schedule.RecurrenceRule(
    null,
    null,
    null,
    new schedule.Range(0,6),
    7,//hour
    0,//minute
    0,//second
), function(){
    return ctx_methods.sendingpairs(server_time.getNowDayWeek(),bot);
});

async function getUserInfo(vk_id) {
    return sql_db.getData(`SELECT * FROM ${process.env.DB_TABLE} WHERE vk_id LIKE ${vk_id} LIMIT 1`,[]);
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

    const message = ctx.message.text.split(' ');
    for (let i of white_list){
        if (levenshtein(i, message[0]) <= 2){
            message.shift();
            message.unshift(i);
            ctx.message.text = message.join(' ');
            return next();
        }
    }
    next();
});
bot.command('помощь', (ctx)=>{
    ctx.reply(help.join('\n\n'),null,reverse_menu);
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
            ctx.reply('Выберете один из вариантов:',null,reverse_menu);
        }
    } else return bot.execute('messages.send', {
        user_id: ctx.message.from_id,
        message: 'Возможности бота:',
        random_id: Math.floor(Math.random() * 10000),
        template: JSON.stringify(hello_carousel)
    }).catch((res) => {
        console.log(res);
    });
});
bot.command('поиск пары', (ctx)=>{
    ctx.reply([help[help.length-1],help[help.length-2],help[help.length-3],help[help.length-4]].join('\n\n'));
});
bot.command('найди', async (ctx)=>{
    let obj = await message_parser.parse2_find_arg(ctx.message.text);
    ctx_methods.findpairs(ctx,obj);
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
});
bot.command('расписание', async (ctx)=>{
    const user_info = await getUserInfo(ctx.message.from_id);
    const obj_parsed = message_parser.parse_pairs_day(ctx.message.text);

    if (typeof user_info === 'undefined'){
        ctx.scene.enter('group');
    } else {
        if (obj_parsed.group === -1) obj_parsed.group = user_info.user_group;
        ctx_methods.pairsday(ctx,obj_parsed);
    }
});
bot.command('начать', (ctx)=>{
    ctx.reply('Привет! А ты знаешь что я умею?Нет?Напиши мне "помощь"!',null,Markup.keyboard(
        [
            Markup.button('Помощь', 'primary')
        ]
    ).oneTime());
});
bot.on(async (ctx) => {
    switch (ctx.message.payload.method) {
        case 'on':
            if (ctx.message.payload.button === 'Да'){
                if (typeof ctx.client_info.carousel === 'undefined'){
                    return ctx.reply(help.join('\n\n'));
                } else {
                    return bot.execute('messages.send', {
                        user_id: ctx.message.from_id,
                        message: 'Возможности бота:',
                        random_id: Math.floor(Math.random() * 1000),
                        template: JSON.stringify(hello_carousel)
                    }).catch((res) => {
                        console.log(res);
                    });
                }
            } else return ctx.reply('Выберете один из вариантов:',null,reverse_menu);
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
bot.startPolling(() => {
    console.log('Bot started.')
});