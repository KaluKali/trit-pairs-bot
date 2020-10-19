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
const trit_data = new TritData();
const sql_db = new SqlDb();
const saveImageVK = require('./tools/image_tools/save_image_into_vk');
const gmSettings = {
    imageMagick: true,
};
if (process.platform === 'win32') gmSettings.appPath = 'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\';
const gm = require('gm').subClass(gmSettings);
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
    let msg = await Message.parseFind(ctx.message.text);
    ctx_methods(reverse_menu, null, { data: trit_data }).find_pairs(ctx,msg);
});
bot.command('кабинет', async (ctx)=>{
    let msg = await Message.parseCabinet(ctx.message.text);
    ctx_methods(reverse_menu, null, { data: trit_data }).find_cabinet(ctx,msg);
});
bot.command('настройки', (ctx) => {
    ctx.scene.enter('settings')
});
bot.command('расписание', async (ctx)=>{
    let msg = await Message.parsePairsDay(ctx.message.text);
    ctx_methods(reverse_menu, null, { data: trit_data }).pairs_day(ctx,msg);
});


bot.on((ctx) => {
    if (ctx.message.peer_id < 2000000000){
        ctx.scene.enter('unknown_command',0)
    }
});
trit_data.on('changes', (data_changes)=>{
    let pairDayWeek = {
        'понедельник':[],
        'вторник':[],
        'среда':[],
        'четверг':[],
        'пятница':[],
        'суббота':[],
    };
    for (let one_group in data_changes){
        for (let one_day in data_changes[one_group]){
            pairDayWeek[one_day].push({
                'group':one_group,
                'changes':data_changes[one_group][one_day]
            })
        }
    }

    let week_markups = [];
    const title_indent = 3;
    for (let one_day in pairDayWeek){
        // title indent
        let pangoMarkup = `\n<span><b>${one_day[0].toUpperCase() + one_day.slice(1)}</b>\n\n`;
        pairDayWeek[one_day].forEach(dayChanges=>{
            pangoMarkup += `\nГруппа ${dayChanges.group}\n\n`;
            for (let pairIndex in dayChanges.changes){
                let stock = `${dayChanges.changes[pairIndex].stock.name ? dayChanges.changes[pairIndex].stock.name : '—'} ${dayChanges.changes[pairIndex].stock.room ? `  каб. ${dayChanges.changes[pairIndex].stock.room}` : '  каб. —'}`;
                let modify = `${dayChanges.changes[pairIndex].modified.name ? dayChanges.changes[pairIndex].modified.name : '—'} ${dayChanges.changes[pairIndex].modified.room ? `  каб. ${dayChanges.changes[pairIndex].modified.room}` : '  каб. —'}`;
                pangoMarkup += `${pairIndex}. <s>${stock}</s><span background="lightgreen">${modify}</span>\n`
            }
        });
        week_markups.push(pangoMarkup);
    }

    let monday_indent = week_markups[0].split('\n').length-title_indent;
    let thursday_indent = week_markups[3].split('\n').length-title_indent;

    let tuesday_indent = week_markups[1].split('\n').length-title_indent;
    let friday_indent = week_markups[4].split('\n').length-title_indent;

    if (monday_indent > thursday_indent) {
        for (let i = monday_indent - thursday_indent; i>0; i--) week_markups[3] += '\n'
    } else {
        for (let i = thursday_indent - monday_indent; i>0; i--) week_markups[0] += '\n'
    }
    if (tuesday_indent > friday_indent) {
        for (let i = tuesday_indent - friday_indent; i>0; i--) week_markups[4] += '\n'
    } else {
        for (let i = friday_indent - tuesday_indent; i>0; i--) week_markups[1] += '\n'
    }

    for (let i=0;i<week_markups.length;i++) week_markups[i] += '</span>';

    gm().out('-kerning','1')
        .out(`pango:<markup>${week_markups.filter((item, index)=>(index < 3)).join('')}</markup>`)
        .out('-orient','top-right').out('+append')
        .out(`pango:<markup>${week_markups.filter((item, index)=>(index < 6 && index >= 3)).join('')}</markup>`)
        .out('-orient','top-right').out('+append')
        .borderColor('#FFFFFF')
        .border(20,20)
        .toBuffer('JPEG',async (err,buffer)=>{
            if (err){
                console.log(`toBuffer in main.js error: ${err}`);
                for (let i = 1; i < 3;i++){
                    await bot.execute('messages.send', {
                        peer_id: 2000000000+i, // <- inside account id-dialog, DONT unique
                        random_id: Math.floor(Math.random() * Math.floor(10000000000)),
                        message: 'Выложено новое расписание!',
                    }).catch(error => console.error(`Main.js error: ${error}`));
                }
                return trit_data.updFSData('data.json', TritData.getDataPromise());
            } else {
                await saveImageVK(buffer,bot,async (photo_data)=>{
                    for (let i = 1; i < 3;i++){
                        await bot.execute('messages.send', {
                            peer_id: 2000000000+i, // <- inside account id-dialog, DONT unique
                            random_id: Math.floor(Math.random() * Math.floor(10000000000)),
                            attachment: `photo${photo_data[0].owner_id}_${photo_data[0].id}`,
                        }).catch(error => console.error(error));
                    }
                    trit_data.updFSData('data.json', TritData.getDataPromise());
                });
            }
        });
    // todo save Conversation-ids into db API 5.124 в ответе на вызов messages.send с параметром peer_ids возвращается conversation_message_id.
});
bot.startPolling((err) => {
    if (!err) console.log('Bot started');
    else console.error(err);
});
