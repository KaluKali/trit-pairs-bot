const api = require('./utils/api');
const fs = require('fs');
const EventEmitter = require('events');
const table = require('text-table');
const textToImage = require('../tools/image_tools/txt_table_to_image');
const saveImageVK = require('../tools/image_tools/save_image_into_vk');
const renderTableImage = require("../methods/representation/render_table_image");
const textTableWeekday = require("./message_tools/pair_tools");

const now_date = new Date();

const TIMETABLE_FILE = 'timetable.json';
const DATA_FILE = 'data.json';
const GROUPS_FILE = 'groups.json';
const CACHE_FILE = 'cache.json'

const table_style = {align: ['l', 'l', 'l' ], hsep: '  '}

function _isLargeDigit(i) {
    return i.toString().length > 1
}
/** ООЧЕНЬ ЖИРНЫЙ КЛАСС
 хранит в себе всё расписание и при необходимости обновляет
 вызывается в коде только 1 раз из main.js, дальше по коду раскидываются указатели по типу "resources.data"
 **/
class TritData extends EventEmitter{
    constructor(bot) {
        super();
        this.bot = bot
        this.data = {};
        this.groups = [];
        this.timetable = [];
        this.data_cache = {};

        console.log('Exemplar TritData created.')
        this._checkUpdateFile(CACHE_FILE)
    }
    static getDataPromise() {
        return api('https://trit.biz/rr/json2.php');
    }
    static getGroupsPromise() {
        return api('https://trit.biz/rr/json.php');
    }
    static getTimeTablePromise() {
        return api('https://trit.biz/rr/json_timetable.php');
    }

    getData(callback){
        if (Object.keys(this.data).length) return callback(this.data);
        else this._checkUpdateFile(DATA_FILE, callback);
    }
    getCache(group,weekday,theme=0) {
        if (group && weekday) {
            if (Array.isArray(this.data_cache[group]['weekdays'][weekday]) && this.data_cache[group]['weekdays'][weekday][theme]) {
                return this.data_cache[group]['weekdays'][weekday][theme]
            }
        } else {
            if (Array.isArray(this.data_cache[group]['weekdays'][weekday]) && this.data_cache[group]['table'] &&
                this.data_cache[group]['table'][theme]) {
                return this.data_cache[group]['weekdays'][weekday]['table'][theme]
            }
        }
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
                        cb && cb(res);
                    });
                case GROUPS_FILE:
                    return this.updateFSData(file,TritData.getGroupsPromise(),(res)=>{
                        this.groups = res;
                        cb && cb(res);
                    });
                case TIMETABLE_FILE:
                    return this.updateFSData(file,TritData.getTimeTablePromise(),(res)=>{
                        this.timetable = res;
                        cb && cb(res);
                    });
                case CACHE_FILE:
                    return this.updateFSData(file,this.renderSchedule())
            }
        }
        this.getFSData(file,(data,err)=>{
            if (!err) {
                const back_date = new Date(data.date);
                if (back_date.getDate() === now_date.getDate()) {
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
                        case CACHE_FILE:
                            this.data_cache = data.data;
                            break;
                    }
                    cb && cb(data.data);
                } else upd(file)
            } else upd(file)
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
                    fs.writeFile(name, JSON.stringify({date:now_date.toJSON(),data: timetable}),
                        ()=>cb && cb(timetable, null));
                    break;
                default:
                    fs.writeFile(name, JSON.stringify({date:now_date.toJSON(),data: response}),
                        ()=>cb && cb(response, null));
                    break;
            }
        }).catch(err => {
            this.getFSData(name,(fs_data, err_fs)=>{
                if (!err_fs){
                    cb && cb(fs_data.data,err);
                } else {
                    cb && cb(null, err_fs);
                    console.error('Error updateFSData',err_fs);
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
                        callback(null,err)
                    }
                });
            } else {
                console.warn(`${name} отсутствует или занят.`,err);
                callback(null,err);
            }
        });
    }
    checkChange() {
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
            let groups_changed = [];
            this.getFSData(DATA_FILE,(data_fs,err)=>{
                if (!err){
                    TritData.getGroupsPromise().then(response=>{
                        for (let one_group of response) {
                            for (let one_weekday of Object.keys(data_inet[one_group]['weekdays'])){
                                let groups_pairs_day_obj = data_inet[one_group]['weekdays'][one_weekday];
                                pairs_change[one_weekday].date = groups_pairs_day_obj.date;
                                groups_pairs_day_obj.pairs.forEach((pair_inet, pair_index_inet)=>{
                                    let changes = data_fs.data[one_group]['weekdays'][one_weekday].pairs
                                        .some((pair_fs, i_fs)=>
                                            pair_inet.name === pair_fs.name && pair_inet.room === pair_fs.room && pair_index_inet === i_fs);
                                    if (!changes){
                                        changes_counter++;
                                        !groups_changed.find(group=>group===one_group) && groups_changed.push(one_group)

                                        if (!pairs_change[one_weekday].changes[one_group]) pairs_change[one_weekday].changes[one_group] = {};

                                        pairs_change[one_weekday].changes[one_group][pair_index_inet+1]={
                                            'modified': data_fs.data[one_group]['weekdays'][one_weekday].pairs[pair_index_inet],
                                            'present': pair_inet
                                        };
                                    }
                                });
                            }
                        }
                        changes_counter && this.emit('data_changed', pairs_change, changes_counter);
                        this.updateFSData('data.json', TritData.getDataPromise(), (res)=>this.data=res);
                        this.updateFSData(CACHE_FILE,this._renderChanges(groups_changed))
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

    _renderWeekdayPromise(content) {
        return Promise.all([
            new Promise(resolve =>
                textToImage(content, 0, (err, buffer) => {
                    if (err) {
                        console.error(`Error in method render images:`);
                        console.error(err);
                    } else saveImageVK(buffer, this.bot, (photo_data) => resolve(`photo${photo_data[0].owner_id}_${photo_data[0].id}`));
                })),
            new Promise(resolve =>
                textToImage(content, 1, (err, buffer) => {
                    if (err) {
                        console.error(`Error in method render images:`);
                        console.error(err);
                    } else saveImageVK(buffer, this.bot, (photo_data) => resolve(`photo${photo_data[0].owner_id}_${photo_data[0].id}`));
                }))
        ])
    }

    _renderTableWeek(group_data) {
        return Promise.all([
            new Promise(resolve => renderTableImage(undefined,group_data,0,
                (err,buffer)=>saveImageVK(buffer, this.bot, (photo_data) => resolve(`photo${photo_data[0].owner_id}_${photo_data[0].id}`)))),
            new Promise(resolve => renderTableImage(undefined,group_data,1,
                (err,buffer)=>saveImageVK(buffer, this.bot, (photo_data) => resolve(`photo${photo_data[0].owner_id}_${photo_data[0].id}`)))),
        ])
    }

    async _renderChanges(groups) {
        const data = await new Promise(resolve => this.getData(resolve))

        for await (let one_group of groups) {
            for await (let one_weekday of Object.keys(data[one_group]['weekdays'])) {
                const timetable = await new Promise(resolve => this.getTimeTable(data=>resolve(data)))
                const arr_pairs = textTableWeekday(data[one_group]['weekdays'][one_weekday]['pairs'],timetable)

                let content = `Расписание группы ${one_group} на \n${one_weekday}\n\n${table(arr_pairs, table_style).toString()}`;

                await this._renderWeekdayPromise(content).then(cached=>this.data_cache[one_group]['weekdays'][one_weekday]=cached)
                this.data_cache[one_group].table = await this._renderTableWeek(data[one_group])
            }
        }

        return this.data_cache
    }

    async renderSchedule() {
        const data = await new Promise(resolve => this.getData(resolve))
        // deep copy
        Object.keys(data).forEach(group=>this.data_cache[group]={weekdays:Object.assign({},data[group]['weekdays'])})

        for await (let one_group of Object.keys(this.data_cache)) {
            console.log('Rendering group',one_group)

            this.data_cache[one_group].table = await this._renderTableWeek(data[one_group])

            for await (let one_weekday of Object.keys(this.data_cache[one_group]['weekdays'])) {
                if (typeof Array.isArray(this.data_cache[one_group]['weekdays'][one_weekday]) &&
                    this.data_cache[one_group]['weekdays'][one_weekday].length) continue
                else this.data_cache[one_group]['weekdays'][one_weekday]=[]

                const timetable = await new Promise(resolve => this.getTimeTable(data=>resolve(data)))
                const arr_pairs = textTableWeekday(data[one_group]['weekdays'][one_weekday]['pairs'],timetable)

                let content = `Расписание группы ${one_group} на \n${one_weekday}\n\n${table(arr_pairs, table_style).toString()}`;

                await this._renderWeekdayPromise(content).then(cached=>this.data_cache[one_group]['weekdays'][one_weekday]=cached)
            }
        }

        return this.data_cache
    }
}

module.exports = TritData;
