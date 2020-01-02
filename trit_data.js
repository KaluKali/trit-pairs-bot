const api = require('./api')

const valid_groups = [
    12,13,14,15,16,21,22,23,24,25,26,31,32,33,34,35,36,41,42,43,46,101,102,103
];

const pairs_time = [
    '8:00 - 8:45',
    '8:50 - 9:35',
    '9:50 - 10:35',
    '10:40 - 11:25',
    '11:45 - 12:30',
    '12:45 - 13:30',
    '13:40 - 14:25',
    '14:30 - 15:15',
];


//.then(response=>yourfunc())
class TritData {
    constructor(){}

    static isGroup(group){
        return valid_groups.indexOf(group) !== -1 ? true : false;
    }
    getPromise(){ // returned ONLY data. Check api.js
        return api('https://trit.biz/rr/json2.php');
    }
    getData(func){
        this.getPromise().then(response=>func(response));
    }
    static ValidGroups(){
        return valid_groups;
    }
    static PairsTime(){
        return pairs_time;
    }
}

module.exports = TritData