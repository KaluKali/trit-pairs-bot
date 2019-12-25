const api = require('./api')

const valid_groups = [
    12,13,14,15,16,21,22,23,24,25,26,31,32,33,34,35,36,41,42,43,46,101,102,103
];

exports.Init = function () {

}
//.then(response=>yourfunc())
class TritData {
    constructor(){}

    static isGroup(group){
        return valid_groups.indexOf(group) !== -1 ? true : false;
    }
    getPromise(){ // returned ONLY data. Check api.js
        return api('json2.php');
    }
    getData(func){
        this.getPromise().then(response=>func(response));
    }
    static getValidGroups(){
        return valid_groups;
    }
}

module.exports = TritData