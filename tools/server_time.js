// 0-6 where 0-"воскресение"

/**
 * обертка над логикой обработки воскресенья как день не учитывающийся в расписании
**/
const pairs_days = [
    'воскресение',
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота'
];

class ServerTime extends Date{
    constructor(){
        super();
    }
    static isWeekday(day){
        if (typeof day != 'string') return new TypeError('Argument isValidWeekDay is string.');
        else return pairs_days.indexOf(day)!==-1;
    }
    static Weekdays(){
        // где-то в коде массив дней недели изменяется
        return pairs_days.slice();
    }
    static getWeekday(day){
        if (typeof day !== 'number') return new TypeError('getWeekday: mistake argument type');
        return pairs_days[day === 0 || day >= 7 ? 1 : day]
    }
    getDay() {
        this.setTime(ServerTime.now());
        let now_day = super.getDay();
        return now_day === 0 ? 1 : now_day
    }
    getWeekday(){
        return pairs_days[this.getDay()];
    }
}

module.exports = ServerTime;
