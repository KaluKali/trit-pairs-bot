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
        return pairs_days;
    }

    getDay() {
        const now_day = super.getDay();
        return now_day === 0 ? 1 : now_day
    }
    getNowDayWeek(){
        return pairs_days[this.getDay()];
    }
    static getDayWeek(day){
        if (typeof day !== 'number') return new TypeError('getDayWeek: mistake argument type');
        if (day < 7){
            return pairs_days[day];
        } else {
            return pairs_days[1];
        }
    }
}

module.exports = ServerTime;