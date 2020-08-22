const TritData = require('./trit_data');
const trit_data = new TritData();

const PairTools = function () {

};

PairTools.prototype.jsonToPairs = (data, group, weekday) =>{
    let i_pair = 1;
    const data_day_s = [];
    data[group]['weekdays'][weekday]['pairs'].forEach((pair,i) => {
        if (i < 4){ // Pair limit
            if (pair.room === false) pair.room = '—';
            if (pair.name === false) pair.name = '—';
            data_day_s.push(
                [i_pair, trit_data.PairsTime()[i_pair-1], pair.room, pair.name],
                [i_pair+1, trit_data.PairsTime()[i_pair], pair.room, pair.name]
            );
            i_pair+=2;
        }
    });
    return data_day_s;
};

module.exports.default = new PairTools();
