﻿require('dotenv').config();
process.title = 'trit-pairs-bot';

const VkBot = require('node-vk-bot-api');
const bot = new VkBot(process.env.VK_API_KEY);

const Session = require('node-vk-bot-api/lib/session');
const Stage = require('node-vk-bot-api/lib/stage');
const Markup = require('node-vk-bot-api/lib/markup');
const schedule = require('node-schedule');

const ServerTime = require('./tools/server_time');
const Message = require('./tools/message_parser');
const levenshtein = require('./tools/levenshtein');
// tools
const server_time = new ServerTime();
// resource
const reverse_menu = Markup.keyboard([
    Markup.button('Расписание на сегодня', 'positive'),
    Markup.button('Расписание на завтра', 'positive'),
    Markup.button('Неделя', 'positive'),
    Markup.button('Настройки', 'primary'),
], { columns:2 }).oneTime();
const ctx_scenes = require('./scenes/index');
const ctx_methods = require('./methods/index');
const white_list = ['расписание','найди','помощь','настроить','привет','меню','неделя', 'кабинет'];

schedule.scheduleJob('00 00 07 * * 1-6', ()=>{
    bot.stop();
    bot.start();
    bot.startPolling(() => {
        console.log('Bot restarted.')
    });
    return ctx_methods(reverse_menu, ).mailing(server_time.getNowWeekday(),bot);
});

bot.use(new Session().middleware());
bot.use(new Stage(...ctx_scenes(reverse_menu)).middleware());

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
bot.command('поиск пары', (ctx)=>{
    ctx.reply("Напиши мне \"найди {пара}\"");
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
    // todo изучи step
    ctx.scene.enter('settings')
});
bot.command('расписание', async (ctx)=>{
    const parsed_message = await new Message(ctx.message.text).parse_pairs_day();
    ctx_methods(reverse_menu).pairs_day(ctx,parsed_message);
});
bot.on((ctx) => {
    ctx.scene.enter('unknown_command',0)
});
bot.startPolling(() => {
    console.log('Bot started.')
});