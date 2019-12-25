const TritData = require('./trit_data');
const ServerTime = require('./server_time');

const server_time = new ServerTime();

class MessageParser {
    constructor(){}

    parse2_find_arg(txt){
        const params = {pair:'',group:-1,weekday:''}
        const args = txt
            .replace(/ {1,}/g,' ')
            .split(' ');
            // regxp: remove duplicate spaces
        args.shift();
        // struct: найди {1,2} {1} {3}
        // 1: пара
        // 2: № группы
        // 3: день недели
        // при 1 в первом аргументе все остальные отметаются

        // block 1,2
        var func_block_1 = function () {
            if (isNaN((+args[0]))){
                params.pair = args[0]
            } else {
                if (TritData.isGroup((+args[0]))){
                    params.group = +args[0]
                }
            }
        }
        var func_block_2 = function () {
            if (isNaN((+args[1]))){
                params.pair = args[1]
            } else { console.log(`f_b_2:${args[1]}`)}
        }
        var func_block_3 = function () {
            if (isNaN((+args[2])) && ServerTime.isWeekDay(''+args[2])) params.weekday = args[2]
        }
        if (args.length == 1){
            func_block_1()
        }
        if (args.length == 2){
            func_block_1()
            func_block_2()
        }
        if (args.length == 3){
            func_block_1()
            func_block_2()
            func_block_3()
        }
        return params;
        //
    }
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
        // при 1 в первом аргументе все остальные отметаются

        args.forEach((param)=>{
            if (param==='на') continue;
            if (isNaN(+param)){
                if(ServerTime.isWeekDay(param)){
                    params.weekday = ''+param;
                } else {
                    params.pair = ''+param;
                }
            } else {
                params.group = +param;
            }
        });
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
            if (param==='завтра'){
                params.weekday = server_time.getDayWeek(server_time.getDay()+1)
                return;;
            }
            if(isNaN(+param)){
                if (ServerTime.isWeekDay(param)){
                    params.weekday = ''+param;
                }
            } else {
                params.group = +param;
            }
        });
        return params
    }
}

module.exports = MessageParser;