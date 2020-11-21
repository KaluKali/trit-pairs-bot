const api = require('./utils/api');
const fs = require('fs');
const EventEmitter = require('events');

const now_date = new Date();

const TIMETABLE_FILE = 'timetable.json';
const DATA_FILE = 'data.json';
const GROUPS_FILE = 'groups.json';

function _isLargeDigit(i) {
    return i.toString().length > 1
}
/** ООЧЕНЬ ЖИРНЫЙ ОБЪЕКТ
    хранит в себе всё расписание и при необходимости обновляет
    сделано для быстродействия
    вызывается в коде только 1 раз из main.js, дальше по коду раскидываются указатели по типу "resources.data"
**/
class TritData extends EventEmitter{
    constructor() {
        super();
        this.data = {};
        this.groups = [];
        this.timetable = [];
        console.log('Exemplar TritData created.')
    }
    static getDataPromise(){
        return api('https://trit.biz/rr/json2.php');
    }
    static getGroupsPromise(){
        return api('https://trit.biz/rr/json.php');
    }
    static getTimeTablePromise(){
        return api('https://trit.biz/rr/json_timetable.php');
    }
    getData(callback){
        if (Object.keys(this.data).length) return callback(this.data);
        else this._checkUpdateFile(DATA_FILE, callback);
    }
    getGroups(callback){
        if (this.groups.length) return callback(this.groups);
        else this._checkUpdateFile(GROUPS_FILE, callback);
    }
    getTimeTable(callback) {
        if (this.timetable.length) return callback(this.timetable);
        else this._checkUpdateFile(TIMETABLE_FILE, callback);
    }
    _checkUpdateFile(file, cb) {
        const upd = (file) => {
            switch (file) {
                case DATA_FILE:
                    return this.updateFSData(file,TritData.getDataPromise(),(res)=>{
                        this.data = res;
                        if (cb) cb(res);
                    });
                case GROUPS_FILE:
                    return this.updateFSData(file,TritData.getGroupsPromise(),(res)=>{
                        this.groups = res;
                        if (cb) cb(res);
                    });
                case TIMETABLE_FILE:
                    return this.updateFSData(file,TritData.getTimeTablePromise(),(res)=>{
                        this.timetable = res;
                        if (cb) cb(res);
                    });
            }
        }
        this.getFSData(file,(data,err)=>{
            if (!err) {
                const back_date = new Date(data.date);
                if (back_date.getDate() === now_date.getDate()){
                    // кэшируем данные
                    switch (file) {
                        case DATA_FILE:
                            this.data = data.data;
                            break;
                        case GROUPS_FILE:
                            this.groups = data.data;
                            break;
                        case TIMETABLE_FILE:
                            this.timetable = data.data
                            break;
                    }
                    if (cb) cb(data.data);
                } else {
                    upd(file)
                }
            } else {
                upd(file)
            }
        });
    }
    /**
     * Data callback
     *
     * @callback tritJsonDataCallback
     * @param {object} response data
     * @param {object} error or fs error
     */
    /**
     *
     * @param {string} name // filename
     * @param {Promise} promise
     * @param {tritJsonDataCallback} cb
     */
    updateFSData(name, promise, cb){
        promise.then(response=>{
            switch (name) {
                case TIMETABLE_FILE:
                    const timetable = response.filter((elem)=>elem.includes('lesson'))
                        .map(elem=>
                            `${_isLargeDigit(elem[1]) ? '' : '0'}${elem[1]}:${_isLargeDigit(elem[2]) ? '' : '0'}${elem[2]} - ${_isLargeDigit(elem[3]) ? '' : '0'}${elem[3]}:${_isLargeDigit(elem[4]) ? '' : '0'}${elem[4]}`);
                    fs.writeFileSync(name, JSON.stringify({date:now_date.toJSON(),data: timetable}),'utf-8');
                    if (cb) cb(timetable, null);
                    break;
                default:
                    fs.writeFileSync(name, JSON.stringify({date:now_date.toJSON(),data: response}),'utf-8');
                    if (cb) cb(response, null);
                    break;
            }
        }).catch(err => {
            this.getFSData(name,(fs_data, err_fs)=>{
                if (!err_fs){
                    cb(fs_data.data,err);
                } else {
                    cb(null, err_fs);
                    console.error(err_fs);
                }
            })
        });
    }
    getFSData(name, callback){
        fs.access(name, fs.constants.F_OK, (err) => {
            if (!err){
                fs.readFile(name, 'utf-8', (err,data)=>{
                    if (!err){
                        callback(JSON.parse(data));
                    } else {
                        console.error(`getFSData: ${err}`);
                        // вот тут лучше на null не править, сначала надо проверить нет ли где typeof === 'undefined'
                        callback(null,err)
                    }
                });
            } else {
                console.warn(`${name} отсутствует или занят.\n${err}`);
                // вот тут лучше на null не править, сначала надо проверить нет ли где typeof === 'undefined'
                callback(null,err);
            }
        });
    }
    CheckChange(){
        TritData.getDataPromise().then(data_inet=>{
            const pairs_change = {
                'понедельник':{date:'', changes:{}},
                'вторник':{date:'', changes:{}},
                'среда':{date:'', changes:{}},
                'четверг':{date:'', changes:{}},
                'пятница':{date:'', changes:{}},
                'суббота':{date:'', changes:{}},
            };
            let changes_counter = 0;
            this.getFSData(DATA_FILE,(data_fs,err)=>{
                if (!err){
                    TritData.getGroupsPromise().then(response=>{
                        for (let one_group of response){
                            for (let one_weekday of Object.keys(data_inet[one_group]['weekdays'])){
                                let groups_pairs_day_obj = data_inet[one_group]['weekdays'][one_weekday];
                                pairs_change[one_weekday].date = groups_pairs_day_obj.date;
                                groups_pairs_day_obj.pairs.forEach((pair_inet, pair_index_inet)=>{
                                    let changes = data_fs.data[one_group]['weekdays'][one_weekday].pairs
                                        .some((pair_fs, i_fs)=>
                                            (pair_inet.name === pair_fs.name && pair_inet.room === pair_fs.room && pair_index_inet === i_fs) === true);
                                    if (!changes){
                                        changes_counter++;
                                        if (typeof pairs_change[one_weekday].changes[one_group] === "undefined") pairs_change[one_weekday].changes[one_group] = {};
                                        pairs_change[one_weekday].changes[one_group][pair_index_inet+1]={
                                            'modified': data_fs.data[one_group]['weekdays'][one_weekday].pairs[pair_index_inet],
                                            'stock': pair_inet
                                        };
                                    }
                                });
                            }
                        }

                        if (changes_counter) this.emit('data_changed', pairs_change, changes_counter);
                    }).catch(err => {
                        console.error('Error in trit_data.CheckChange');
                        console.trace(err);
                    })
                } else {
                    this.updateFSData(DATA_FILE, TritData.getDataPromise(), (res)=>this.data=res);
                }
            });
        }).catch(err => {
            console.error(`Check pairs change error:`);
            console.trace(err)
        });
    }
}

module.exports = TritData;
