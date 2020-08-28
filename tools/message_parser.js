const TritData = require('./trit_data');
const ServerTime = require('./server_time');
const levenshtein = require('../tools/levenshtein');

const server_time = new ServerTime();
const trit_data = new TritData();

const MessageParser = function (text) {
    this.args = text.toLowerCase()
        .replace(/ {1,}/g,' ')
        .split(' ');
    // regxp: remove duplicate spaces
    // for remove first functional word
    this.args.shift();
};
MessageParser.prototype.parse_find = async function () {
    const params = {pair:'',group:-1,weekday:''};
    const valid_groups = await new Promise(resolve => trit_data.getValidGroups(resolve));

    this.args.forEach((param) => {
        if (param === 'на') return;
        if (param.indexOf('групп') !== -1) return;
        if (isNaN(+param)) {
            if (ServerTime.isWeekday(param)) {
                return params.weekday = param;
            } else {
                for (let day of ServerTime.Weekdays()) {
                    if (levenshtein(day, param) <= 2) return params.weekday = day;
                }
                return params.pair = `${params.pair} ${param}`;
            }
        } else {
            if (valid_groups.indexOf(+param) !== -1) {
                params.group = +param;
            } else params.pair = `${params.pair} ${param}`;
        }
    });
    params.pair = params.pair.trim();

    return params;
};
MessageParser.prototype.parsePairsDay = async function () {
    const params = {group: -1, weekday: ""};
    //struct: расписание {1,2} {2,3}
    // 1 группа
    // 2
    // 3 день недели
    let valid_groups = await new Promise(resolve => trit_data.getValidGroups(resolve));
    this.args.forEach((param) => {
        if (param === 'на') return;
        else if (param.indexOf('завтр') !== -1) return params.weekday = ServerTime.getWeekday(server_time.getDay() + 1);
        else if (param.indexOf('сегодн') !== -1) return params.weekday = ServerTime.getWeekday(server_time.getDay());
        else if (isNaN(+param)) {
            if (ServerTime.isWeekday(param)) {
                params.weekday = '' + param;
            } else {
                for (const day of ServerTime.Weekdays()) {
                    if (levenshtein(day, param) <= 2) return params.weekday = day;
                }
            }
        } else {
            if (valid_groups.indexOf(+param) !== -1) {
                params.group = +param;
            }
        }
    });
    return params;
};
MessageParser.prototype.parse_cabinet = function() {
    const params = {cab: '', weekday: ''};
    //struct: кабинет {1} {2}
    // 1 номер кабинета
    // 2 день недели

    this.args.forEach((param) => {
        if (ServerTime.isWeekday(param)) {
            return params.weekday = param;
        } else {
            for (const day of ServerTime.Weekdays()) {
                if (levenshtein(day, param) <= 2) return params.weekday = day;
            }
            return params.cab = param
        }
    });
    return params;
};

module.exports = MessageParser;
