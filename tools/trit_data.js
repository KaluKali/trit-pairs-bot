const api = require('./api');
const fs = require('fs');
const EventEmitter = require('events');

const now_date = new Date();

const pairs_time = [
    '08:00 - 08:45',
    '08:50 - 09:35',
    '09:45 - 10:30',
    '10:35 - 11:20',
    '11:40 - 12:25',
    '12:45 - 13:30',
    '13:50 - 14:35',
    '14:30 - 15:25',
    '15:35 - 16:20',
    '16:25 - 17:10',
];

let cache_groups;
let cache_data;


class TritData extends EventEmitter{
    static getDataPromise(){
        return api('https://trit.biz/rr/json2.php');
    }
    static getGroupsPromise(){
        return api('https://trit.biz/rr/json.php');
    }
    constructor() {
        super();
        this.getFSData('data.json',(data_fs,err)=>{
            if (!err){
                const back_date = new Date(data_fs.date);
                if (back_date.getDate() === now_date.getDate()){
                    cache_data = data_fs;
                } else {
                    this.updFSData('data.json',TritData.getDataPromise(), data_inet=>cache_data = data_inet)
                }
            } else {
                this.updFSData('data.json',TritData.getDataPromise(), data_inet=>cache_data = data_inet);
            }
        });
        this.getFSData('group.json',(data_fs,err)=>{
            if (!err){
                const back_date = new Date(data_fs.date);
                if (back_date.getDate() === now_date.getDate()){
                    cache_groups = data_fs
                } else {
                    this.updFSData('group.json',TritData.getGroupsPromise(), data_inet=>cache_groups = data_inet);
                }
            } else {
                this.updFSData('group.json',TritData.getGroupsPromise(), data_inet=>cache_groups = data_inet)
            }
        });
    }
    getData(callback){
        const back_date = new Date(cache_data.date);
        if (back_date.getDate() === now_date.getDate()) {
            callback(cache_data.data)
        } else {
            this.updFSData('data.json',TritData.getDataPromise(), data_inet=>{
                cache_data = data_inet;
                callback(cache_data.data);
            });
        }
    }
    getGroups(callback){
        const back_date = new Date(cache_groups.date);
        if (back_date.getDate() === now_date.getDate()) {
            callback(cache_groups.data)
        } else {
            this.updFSData('data.json',TritData.getDataPromise(), data_inet=>{
                cache_groups = data_inet;
                callback(cache_groups.data);
            });
        }
    }
    CheckChange() {
        TritData.getDataPromise().then(data_inet=>{
            let pairs_change;
            this.getFSData('data.json',(data_fs,err)=>{
                if (!err){
                    TritData.getGroupsPromise().then(response=>{
                        for (let one_group of response){
                            for (let one_weekday of Object.keys(data_inet[one_group]['weekdays'])){
                                data_inet[one_group]['weekdays'][one_weekday].pairs.forEach((pair_inet, i_inet)=>{
                                    let changes = data_fs.data[one_group]['weekdays'][one_weekday].pairs
                                        .some((pair_fs, i_fs)=>
                                            (pair_inet.name === pair_fs.name && pair_inet.room === pair_fs.room && i_inet === i_fs) === true);
                                    if (!changes){
                                        if (typeof pairs_change === "undefined") pairs_change = {};
                                        if (typeof pairs_change[one_group] === "undefined") pairs_change[one_group] = {};
                                        if (typeof pairs_change[one_group][one_weekday] === "undefined") pairs_change[one_group][one_weekday] = {};
                                        pairs_change[one_group][one_weekday][i_inet+1]={
                                            'modified': data_fs.data[one_group]['weekdays'][one_weekday].pairs[i_inet],
                                            'stock': pair_inet
                                        };
                                    }
                                });
                            }
                        }
                        if (pairs_change){
                            this.emit("changes",pairs_change)
                        }
                    }).catch(err => this.emit(undefined,err))
                } else {
                    this.updFSData('data.json', TritData.getDataPromise())
                }
            });
        });
    }
    PairsTime(){
        return pairs_time;
    }
    getFSData(name, callback){
        fs.access(name, fs.constants.F_OK, (err) => {
            if (!err){
                fs.readFile(name, 'utf-8', (err,data)=>{
                    if (!err){
                        callback(JSON.parse(data));
                    } else {
                        console.error(err);
                        callback(undefined,err)
                    }
                });
            } else {
                console.warn(`${name} отсутствует или занят.\n${err}`);
                callback(undefined,err);
            }
        });
    }
    updFSData(name, promise, callback){
        promise.then(response=>{
            try {
                fs.writeFileSync(name, JSON.stringify({date:now_date.toJSON(),data:response}),"utf-8");
            } catch (e) {
                console.warn(e);
            } finally {
                console.info(`${name} updated.`);
                if (callback){
                    callback(response);
                }
            }
        }).catch(err => {
            this.getFSData(name,(fs_data, err_fs)=>{
                if (!err_fs){
                    callback(fs_data.data,err);
                } else {
                    callback(undefined, err_fs);
                    console.error(err_fs);
                }
            })
        });
    }
}

module.exports = TritData;
