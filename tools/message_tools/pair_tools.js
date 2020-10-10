const TritData = require('../trit_data');
const trit_data = new TritData();

const PairTools = function() {};

PairTools.prototype.jsonToPairs = (data, group, weekday) => {
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
    // постоянно прилетает неправильная data
    data[group]['weekdays'][weekday]['pairs'].forEach((pair,i) => {
        if (i < 5){ // Pair limit
            if (pair.room === false) pair.room = '—';
            if (pair.name === false) pair.name = '—';
            data_day_s.push(
                [trit_data.PairsTime()[i_pair-1], pair.room.trim(), pair.name.trim().toLowerCase()],
                [trit_data.PairsTime()[i_pair], pair.room.trim(), pair.name.trim().toLowerCase()]
            );
            i_pair+=2;
        }
    });
    return data_day_s;
};

module.exports.default = new PairTools();
