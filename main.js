require('dotenv').config();
process.title = 'trit-pairs-bot';

const VkBot = require('node-vk-bot-api');
const bot = new VkBot(process.env.VK_API_KEY);

const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Markup = require('node-vk-bot-api/lib/markup');
const schedule = require('node-schedule');

const TritData = require('./tools/trit_data');
const ServerTime = require('./tools/server_time');
const SqlDb = require('./tools/sql_data');
const Message = require('./tools/message_tools/message');
const levenshtein = require('./tools/message_tools/levenshtein');
// tools
const server_time = new ServerTime();
// ОООЧЕНЬ жирный класс, в коде его больше нигде лучше не вызывать, подробнее - в его файле
const trit_data = new TritData();
const sql_db = new SqlDb();
// resource
const reverse_menu = Markup.keyboard([
    Markup.button('Расписание на сегодня', 'positive'),
    Markup.button('Расписание на завтра', 'positive'),
    Markup.button('Неделя', 'positive'),
    Markup.button('Настройки', 'primary'),
], { columns:2 }).oneTime();
const ctx_scenes = require('./scenes/index');
const ctx_methods = require('./methods/index');
const leven_list = ['расписание','найди','помощь','настроить','привет','меню','неделя', 'кабинет'];
// jobs
schedule.scheduleJob('00 00 07 * * 1-6', ()=>{
    return ctx_methods(reverse_menu, null, { data: trit_data, db: sql_db }).mailing(server_time.getWeekday(),'', bot);
});
schedule.scheduleJob('0 0 */6 ? * *', ()=>{
    bot.stop();
    console.log('Timeout to restart bot is set.');
    setTimeout(()=>{
        bot.start();
        bot.startPolling((err) => {
            if (!err) {
                console.log('Bot restarted.')
            } else {
                console.error(err)
            }
        });
    }, 30000);
});
// prod 0 0 */6 ? * *
// Every hour 0 0 * ? * *
// Every second * * * ? * *
// default 0 * * * *
schedule.scheduleJob('0 * * * *', ()=>{
    console.log('Checked pairs change.');
    trit_data.CheckChange()
});
// scenes
bot.use(new Session().middleware());
bot.use(new Stage(...ctx_scenes(reverse_menu, null, { data: trit_data, db: sql_db })).middleware());
// event for processing an invitation to a conversation
bot.event('message_new', (ctx,next) => {
    try {
        if (ctx.message.action.type === 'chat_invite_user'){
            bot.execute('messages.send', {
                peer_id: ctx.message.peer_id, // <- inside account id-dialog, DONT unique
                random_id: Math.floor(Math.random() * Math.floor(10000000000)),
                message: 'Беседа добавлена в список уведомления о изменениях в расписании.'
            });
            // get all info for group
            // ONLY admins permission in conversation
            // let ss = await bot.execute('messages.getConversationsById', {
            //     peer_ids:2000000001 // <- inside dialog bot id, DONT unique
            // });
        }
    } catch (ignore) {
        next();
    }
});
// serialization messages
bot.use((ctx, next)=>{
    ctx.message.payload = ctx.message.payload ? JSON.parse(ctx.message.payload) : [];
    const message = ctx.message.text.split(' ');
    for (let i of leven_list){
        if (levenshtein(i, message[0]) <= 2){
            message.shift();
            message.unshift(i);
            ctx.message.text = message.join(' ');
            return next();
        }
    }
    next();
});

bot.command('поиск пары', (ctx)=>{
    ctx.reply('Напиши мне \"найди {пара}\"');
});
bot.command('неделя', (ctx)=>{
    ctx.scene.enter('week');
});
bot.command('найди', async (ctx)=>{
    let msg = await Message.parseFind(ctx.message.text, {data: trit_data});
    ctx_methods(reverse_menu, null, { data: trit_data }).find_pairs(ctx,msg);
});
bot.command('кабинет', async (ctx)=>{
    let msg = await Message.parseCabinet(ctx.message.text, {data: trit_data});
    ctx_methods(reverse_menu, null, { data: trit_data }).find_cabinet(ctx,msg);
});
bot.command('настройки', (ctx) => {
    ctx.scene.enter('settings')
});
bot.command('расписание', async (ctx)=>{
    let msg = await Message.parsePairsDay(ctx.message.text, {data: trit_data});
    ctx_methods(reverse_menu, null, { data: trit_data, db: sql_db }).pairs_day(ctx,msg);
});
// bot.command('test2228', async (ctx)=>{
//     trit_data.CheckChange()
// });

bot.on((ctx) => {
    if (ctx.message.peer_id < 2000000000){
        ctx.scene.enter('unknown_command',0)
    }
});

trit_data.on('changes', async (data_changes, amount)=>{
    if (amount > 20) {
        ctx_methods().send_text_changes(data_changes, bot)
    } else {
        ctx_methods().send_image_changes(data_changes, bot)
    }
    return trit_data.updateFSData('data.json', TritData.getDataPromise());
    // todo save Conversation-ids into db API 5.124 в ответе на вызов messages.send с параметром peer_ids возвращается conversation_message_id.
});
bot.startPolling((err) => {
    if (!err) console.log('Bot started');
    else console.error(err);
});
