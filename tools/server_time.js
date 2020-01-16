const pairs_days = [
    'воскресенье',
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
        return pairs_days.indexOf(day) !== -1;
    }
    static Weekdays(){
        return pairs_days.slice();
    }

    getDay() {
        let now_day = super.getDay();
        return now_day === 0 ? 1 : now_day
    }
    getNowWeekday(){
        return pairs_days[this.getDay()];
    }
    static getWeekday(day){
        if (typeof day !== 'number') return new TypeError('getWeekday: mistake argument type');
        return pairs_days[day === 0 || day > 7 ? 1 : day]
    }
}

module.exports = ServerTime;