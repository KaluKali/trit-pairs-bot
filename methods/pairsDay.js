const Markup = require('node-vk-bot-api/lib/markup');

const table = require('text-table');

const ServerTime = require('../tools/server_time');
const TritData = require('../trit_data');

const server_time = new ServerTime();
const trit_data = new TritData();

exports.ReverseMarkup = function (reverse_markup) {
    if (typeof reverse_markup === 'undefined') {
        reverse_markup = Markup.keyboard([
            Markup.button('Расписание', 'positive'),
            Markup.button('Расписание на завтра', 'positive'),
            Markup.button('Настроить уведомления', 'primary'),
            Markup.button('Указать группу', 'primary'),
        ], {columns: 2}).oneTime()
    }
    return async (ctx, obj) => { //send pairs to people
        if (typeof ctx === 'undefined' || typeof obj === 'undefined'){
            return new Error('pairs_Day: Argument error');
        }
        if (obj.group === 0){
            return ctx.reply('Вы не указали пару или не настроили бота! Напиши мне "помощь" для получения справки по функциям!')
        }

        const weekday = obj.weekday !== "" ? obj.weekday : server_time.getNowWeekday();
        const group = obj.group;

        trit_data.getData( (data) => {
            const data_day_s = [];

            data[group]['weekdays'][weekday]['pairs'].forEach((pair,i) => {
                if (i < 4){ // Pair limit
                    let p = [pair.name !== false ? pair.name : '-', pair.room !== false ? pair.room : '-'];
                    data_day_s.push(p,p.slice());
                }
            });
            data_day_s.forEach((elem,i) => {
                elem.push(TritData.PairsTime()[i]);
                elem.unshift(i+1);
            });
            const t = table(data_day_s, { align: [ 'l', 'c', 'l' ], hsep: ' || ' });
            ctx.reply(`Список уроков для ${group} группы на ${weekday}.\n\n${t.toString()}`,null,reverse_markup);
        });
    }
};