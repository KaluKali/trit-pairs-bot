require('dotenv').config();
process.title = 'trit-pairs-bot';

const VkBot = require('node-vk-bot-api');
const bot = new VkBot(process.env.VK_API_KEY);

const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Markup = require('node-vk-bot-api/lib/markup');
const schedule = require('node-schedule');

const ServerTime = require('./tools/server_time');
const Message = require('./tools/message_parser');
const SqlDB = require('./tools/sql_data');
const levenshtein = require('./tools/levenshtein');
// tools
const server_time = new ServerTime();
const sql_db = new SqlDB();
// resource
const reverse_menu = Markup.keyboard([
    Markup.button('Расписание', 'positive'),
    Markup.button('Расписание на завтра', 'positive'),
    Markup.button('Настройки', 'primary'),
], { columns:2 }).oneTime();
const hello_carousel = require('./carousels/carousel');
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
    return ctx_methods.sendingpairs(server_time.getNowWeekday(),bot);
});

async function getUserInfo(vk_id) {
    return sql_db.getData(`SELECT * FROM ${process.env.DB_TABLE} WHERE vk_id LIKE ${vk_id} LIMIT 1`,[]);
}

bot.use(new Session().middleware());
bot.use(new Stage(ctx_scenes[0],ctx_scenes[1],ctx_scenes[2],ctx_scenes[3],ctx_scenes[4],ctx_scenes[5],ctx_scenes[6]).middleware());
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
    let obj = await new Message(ctx.message.text).parse_find();
    ctx_methods.findpairs(ctx,obj);
});
bot.command('настройки', (ctx) => {
    ctx.scene.enter('settings')
});
bot.command('расписание', async (ctx)=>{
    const user_info = await getUserInfo(ctx.message.from_id);
    const obj_parsed = await new Message(ctx.message.text).parse_pairs_day();

    if (obj_parsed.group === -1){
        if (typeof user_info === 'undefined'){
            ctx.scene.enter('group');
        } else {
            obj_parsed.group = user_info.user_group;
            ctx_methods.pairsday(ctx,obj_parsed);
        }
    } else {
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
    if (ctx.message.payload.method === 'on') {
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