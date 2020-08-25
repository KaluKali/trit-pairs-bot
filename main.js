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
const Message = require('./tools/message_parser');
const levenshtein = require('./tools/levenshtein');
// tools
const server_time = new ServerTime();
const trit_data = new TritData();
const saveImageVK = require('./tools/saveImageVK');
const gm = require('gm').subClass({imageMagick: true, appPath:'C:\\Program Files\\ImageMagick-7.0.10-Q16-HDRI\\'});
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
    return ctx_methods(reverse_menu).mailing(server_time.getWeekday(),bot);
});
schedule.scheduleJob('0 0 */6 ? * *', ()=>{
    bot.stop();
    console.log('Timeout to restart bot is set.');
    setTimeout(()=>{
        bot.start();
        bot.startPolling(() => {
            console.log('Bot restarted.')
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
bot.use(new Stage(...ctx_scenes(reverse_menu)).middleware());
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
            //     peer_ids:2000000001 // <- inside dialog bot id, DONT private
            // });
        }
    } catch (ignore) {
        next();
    }
});
// serialization messages
bot.use((ctx,next)=>{
    ctx.message.payload = typeof ctx.message.payload !== 'undefined' ? JSON.parse(ctx.message.payload) : [];
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
    ctx.reply('')
});
bot.command('неделя', (ctx)=>{
    ctx.scene.enter('week')
});
bot.command('найди', async (ctx)=>{
    let obj = await new Message(ctx.message.text).parse_find();
    ctx_methods(reverse_menu).find_pairs(ctx,obj);
});
bot.command('кабинет', async (ctx)=>{
    let obj = await new Message(ctx.message.text).parse_cabinet();
    ctx_methods(reverse_menu).find_cabinet(ctx,obj);
});
bot.command('настройки', (ctx) => {
    ctx.scene.enter('settings')
});
bot.command('расписание', async (ctx)=>{
    const parsed_message = await new Message(ctx.message.text).parse_pairs_day();
    ctx_methods(reverse_menu).pairs_day_new(ctx,parsed_message, bot);
});
bot.on((ctx) => {
    if (ctx.message.peer_id < 2000000000){
        ctx.scene.enter('unknown_command',0)
    }
});
trit_data.on('changes',(data_changes)=>{
    let pairDayWeek = {};
    for (let one_group in data_changes){
        for (let one_day in data_changes[one_group]){
            if (typeof pairDayWeek[one_day] === 'undefined') pairDayWeek[one_day]=[];
            pairDayWeek[one_day].push({
                'group':one_group,
                'changes':data_changes[one_group][one_day]
            })
        }
    }
    let changeGraphic = gm().out('-kerning','1').out('-gravity','east');
    let prev_indent = 0;
    let cols = 0;
    let markups =[];
    for (let one_day in pairDayWeek){
        let pangoMarkup = `\n\n<markup>`;
        cols +=1;
        pangoMarkup += `${one_day[0].toUpperCase() + one_day.slice(1)}<span>\n\n`;
        pairDayWeek[one_day].forEach(dayChanges=>{
            pangoMarkup += `Группа ${dayChanges.group}\n\n`;
            for (let pairIndex in dayChanges.changes){
                let stock = `${dayChanges.changes[pairIndex].stock.name ? dayChanges.changes[pairIndex].stock.name : '—'} ${dayChanges.changes[pairIndex].stock.room ? `  каб. ${dayChanges.changes[pairIndex].stock.room}` : '  каб. —'}`;
                let modify = `${dayChanges.changes[pairIndex].modified.name ? dayChanges.changes[pairIndex].modified.name : '—'} ${dayChanges.changes[pairIndex].modified.room ? `  каб. ${dayChanges.changes[pairIndex].modified.room}` : '  каб. —'}`;
                pangoMarkup += `${pairIndex}. <s>${stock}</s><span background="lightgreen">${modify}</span>   \n`
            }
        });
        for (let now_indent = pangoMarkup.split('\n').length-1; now_indent < prev_indent; now_indent++) pangoMarkup+='\n';

        pangoMarkup += `</span></markup>`;
        prev_indent = pangoMarkup.split('\n').length-1;
        if (!(cols % 2)){
            markups.push(pangoMarkup);
            changeGraphic = changeGraphic.out(`pango:${markups.join('')}`).out('+append');
            markups = []
        } else {
            markups.push(pangoMarkup)
        }
    }
    if (markups.length) changeGraphic = changeGraphic.out(`pango:${markups.join('')}`);
    changeGraphic
        // .trim()
        // .borderColor('#FFFFFF')
        // .border(20,20)
        .out('-gravity','west')
        .out('-append')
        .toBuffer('JPEG',(err,buffer)=>{
            if (err){
                console.log(err);
                return;
            }
            saveImageVK(buffer,bot,async (photo_data)=>{
                for (let i = 1; i < 3;i++){
                    await bot.execute('messages.send', {
                        peer_id: 2000000000+i, // <- inside account id-dialog, DONT unique
                        random_id: Math.floor(Math.random() * Math.floor(10000000000)),
                        attachment: `photo${photo_data[0].owner_id}_${photo_data[0].id}`,
                    }).catch(error => console.log(error));
                }
                trit_data.updFSData('data.json', TritData.getDataPromise());
                // process.exit(1);
            });
        });

    // todo save Conversations-id into db
});
bot.startPolling(() => {
    console.log('Bot started.')
});
