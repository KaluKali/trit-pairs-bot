const TritData = require('../trit_data');
const trit_data = new TritData();

const PairTools = function() {};

PairTools.prototype.jsonToPairs = function (data, group, weekday, cb) {
    let i_pair = 1;
    let data_day_s = [];

    if (!data[group]) {
        console.error(`Error data:`);
        console.error(data);
        return [
            ['Внутренняя','ошибка', ''],
            ['Повторите','запрос','позже']
        ]
    }
    trit_data.getTimeTable((timetable, err)=>{
        if (!err) {
            data[group]['weekdays'][weekday]['pairs'].forEach((pair,i) => {
                if (i < 5){ // Pair limit
                    if (pair.room === false) pair.room = '—';
                    if (pair.name === false) pair.name = '—';
                    data_day_s.push(
                        [timetable[i_pair-1], pair.room.trim(), pair.name.trim().toLowerCase()],
                        [timetable[i_pair], pair.room.trim(), pair.name.trim().toLowerCase()]
                    );
                    i_pair+=2;
                }
            });
            cb(data_day_s)
        }
    });
};

module.exports.default = new PairTools();
