const TritData = require('../trit_data');
const ServerTime = require('../server_time');
const levenshtein = require('../tools/levenshtein');

const server_time = new ServerTime();

class MessageParser {
    // constructor(){}

    parse2_find_arg(txt){
        const params = {pair:'',group:-1,weekday:''};
        const args = txt
            .replace(/ {1,}/g,' ')
            .split(' ');
        // regxp: remove duplicate spaces
        args.shift();
        // struct: найди {1,2} {1} {3}
        // 1: пара
        // 2: № группы
        // 3: день недели

        args.forEach((param,i)=>{
            if (param==='на') return;
            if (param.indexOf('групп')!== -1) return;
            if (isNaN(+param)){
                if(ServerTime.isWeekday(param)){
                    return params.weekday = param;
                } else {
                    for (let day of ServerTime.Weekdays()){
                        if (levenshtein(day,param) <= 2) return params.weekday = day;
                    }

                    return params.pair = `${params.pair} ${param}`;
                }
            } else {
                if (TritData.isGroup(+param)) return params.group = +param;
                else return params.pair = `${params.pair} ${param}`;
            }
        });
        params.pair = params.pair.trim();
        return params;
    }
    parse_pairs_day(txt){
        const params = {group:-1,weekday:''};
        const args = txt
            .replace(/ {1,}/g,' ')
            .split(' ');
        // regxp: remove duplicate spaces
        args.shift();
        //struct: расписание {1,2} {2,3}
        // 1 группа
        // 2
        // 3 день недели

        args.forEach((param)=>{
            if (param==='на') return;
            else if (param==='завтра'){
                params.weekday = ServerTime.getDayWeek(server_time.getDay()+1);
                return;
            }
            else if(isNaN(+param)){
                if (ServerTime.isWeekday(param)){
                    params.weekday = ''+param;
                } else {
                    for (const day of ServerTime.Weekdays()){
                        if (levenshtein(day,param) <= 2) return params.weekday = day;
                    }
                }
            } else {
                if (TritData.isGroup(+param)){
                    params.group = +param;
                }
            }
        });
        return params;
    }
    parse_settings(txt){
        const params = {notify:false,change_group:false,settings:false};
        const args = txt
            .replace(/ {1,}/g,' ')
            .split(' ');
        // regxp: remove duplicate spaces
        args.shift();
        //struct: настроить {1}
        // 1 уведомления,группа

        args.forEach((param)=>{
            if (param.toLowerCase().indexOf('указать') !== -1) return params.change_group=true;
            else if (param.toLowerCase().indexOf('уведомлен') !== -1) return params.notify =true;
            else if (param.toLowerCase().indexOf('групп') !== -1) return params.change_group=true;
            else if (param.toLowerCase().indexOf('бот') !== -1) return params.settings=true;
        });
        return params;
    }
}

module.exports = MessageParser;