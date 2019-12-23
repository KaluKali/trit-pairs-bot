class ServerTime extends Date{
    constructor(){
        super();
        this.pairs_days = [
            'воскресенье',
            'понедельник',
            'вторник',
            'среда',
            'четверг',
            'пятница',
            'суббота'
        ];
    }
    getDay() {
        const now_day = super.getDay()
        return now_day < 6 ? now_day : 0
    }
    getNowDayWeek(){
        return this.pairs_days[this.getDay()]
    }
    getDayWeek(day){
        if (day < 6){
            return this.pairs_days[day]
        } else {
            return this.pairs_days[1]
        }
    }
}

module.exports = ServerTime