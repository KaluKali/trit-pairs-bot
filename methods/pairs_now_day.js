const table = require('text-table');

const ServerTime = require('../tools/server_time');
const TritData = require('../tools/trit_data');
const getUserInfo = require('../tools/user_info');

const server_time = new ServerTime();
const trit_data = new TritData();

const pairs_now_day = (reverse_markup, table_style) => {
    return async (ctx, obj) => { //send pairs to people
        if (typeof ctx === 'undefined' || typeof obj === 'undefined'){
            return new Error('pairs_Day: Argument error');
        }

        const user_info = await getUserInfo(ctx.message.from_id);
        if (obj.group === -1){
            if (typeof user_info === 'undefined'){
                return ctx.scene.enter('group');
            } else {
                obj.group = user_info.user_group;
            }
        }
        const weekday = obj.weekday !== "" ? obj.weekday : server_time.getWeekday();
        const group = obj.group;

        trit_data.getData( (data) => {
            const data_day_s = [];
            let i_pair = 1;
            data[group]['weekdays'][weekday]['pairs'].forEach((pair,i) => {
                if (i < 4){ // Pair limit
                    if (pair.room === false) pair.room = '-';
                    if (pair.name === false) pair.name = '-';
                    data_day_s.push(
                        [i_pair, TritData.PairsTime()[i_pair-1], pair.room, pair.name],
                        [i_pair+1, TritData.PairsTime()[i_pair], pair.room, pair.name]
                    );
                    i_pair+=2;
                }
            });
            const t = table(data_day_s, table_style);
            ctx.reply(`Список уроков для ${group} группы на ${weekday}.\n\n${t.toString()}`,null,reverse_markup);
        });
    }
};

module.exports = pairs_now_day;