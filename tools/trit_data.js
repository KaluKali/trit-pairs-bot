const api = require('./utils/api');
const fs = require('fs');
const EventEmitter = require('events');

const now_date = new Date();

// const pairs_time = [
//     '08:00 - 08:45',
//     '08:50 - 09:35',
//     '09:45 - 10:30',
//     '10:35 - 11:20',
//     '11:40 - 12:25',
//     '12:45 - 13:30',
//     '13:50 - 14:35',
//     '14:40 - 15:25',
//     '15:35 - 16:20',
//     '16:25 - 17:10',
// ];
const pairs_time = [
    '08:00 - 08:40',
    '08:45 - 09:25',
    '09:35 - 10:15',
    '10:20 - 11:00',
    '11:20 - 12:00',
    '12:20 - 13:00',
    '13:10 - 13:50',
    '13:55 - 14:35',
    '14:40 - 15:20',
    '15:25 - 16:05',
];

class TritData extends EventEmitter{
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
        this.getFSData('data.json',(data,err)=>{
            if (!err){
                const back_date = new Date(data.date);
                if (back_date.getDate() === now_date.getDate()){
                    callback(data.data);
                } else {
                    this.updFSData('data.json',TritData.getDataPromise(),callback)
                }
            } else {
                this.updFSData('data.json',TritData.getDataPromise(),callback);
            }
        });
    }
    getGroups(callback){
        this.getFSData('group.json',(data,err)=>{
            if (!err){
                const back_date = new Date(data.date);
                if (back_date.getDate() === now_date.getDate()){
                    callback(data.data);
                } else {
                    this.updFSData('group.json',TritData.getGroupsPromise(),callback);
                }
            } else {
                this.updFSData('group.json',TritData.getGroupsPromise(),callback)
            }
        });
    }
    CheckChange(){
        TritData.getDataPromise().then(data_inet=>{
            // let pairChanges = [];
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
                        if (pairs_change) this.emit('changes', pairs_change);
                    }).catch(err => console.error(`Check pairs change error:\n${err}`))
                } else {
                    this.updFSData('data.json',TritData.getDataPromise())
                }

            });
        }).catch(err => console.error(`Check pairs change error:\n${err}`));
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
                        console.error(`getFSData: ${err}`);
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
                fs.writeFileSync(name, JSON.stringify({date:now_date.toJSON(),data:response}),'utf-8');
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
