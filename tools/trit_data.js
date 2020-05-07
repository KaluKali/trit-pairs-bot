const api = require('./api');
const fs = require('fs');
const EventEmitter = require('events');

const now_date = new Date();

const pairs_time = [
    '8:00 - 8:45',
    '8:50 - 9:35',
    '9:45 - 10:30',
    '10:50 - 11:35',
    '11:55 - 12:40',
    '12:45 - 13:30',
    '13:40 - 14:25',
    '14:30 - 15:15',
];


class TritData extends EventEmitter{
    static getDataPromise(){
        return api('https://trit.biz/rr/json2.php');
    }
    static getGroupsPromise(){
        return api('https://trit.biz/rr/json.php');
    }
    getData(callback){
        this.getFSData('data.json',(data,err)=>{
            if (!err){
                const exist_data = JSON.parse(data);
                const back_date = new Date(exist_data.date);
                if (back_date.getDate() === now_date.getDate()){
                    callback(exist_data.data);
                } else {
                    this.updFSData('data.json',TritData.getDataPromise(),callback)
                }
            } else {
                this.updFSData('data.json',TritData.getDataPromise(),callback);
            }
        });
    }
    getValidGroups(callback){
        this.getFSData('group.json',(data,err)=>{
            if (!err){
                const data_s = JSON.parse(data);
                const back_date = new Date(data_s.date);
                if (back_date.getDate() === now_date.getDate()){
                    callback(data_s.data);
                } else {
                    this.updFSData('group.json',TritData.getGroupsPromise(),callback);
                }
            } else {
                this.updFSData('groups.json',TritData.getGroupsPromise(),callback)
            }
        });
    }
    async CheckChange(){
        TritData.getDataPromise().then(data_inet=>{
            let pairs_change;
            this.getFSData('data.json',(data_fs,err)=>{
                if (!err){
                    data_fs = JSON.parse(data_fs).data;
                    TritData.getGroupsPromise().then(response=>{
                        for (let one_group of response){
                            for (let one_weekday of Object.keys(data_inet[one_group]['weekdays'])){
                                data_inet[one_group]['weekdays'][one_weekday].pairs.forEach((pair_inet, i_inet)=>{
                                    let success=false;
                                    data_fs[one_group]['weekdays'][one_weekday].pairs.forEach((pair_fs, i_fs)=>{
                                        if (pair_inet.name === pair_fs.name && pair_inet.room === pair_fs.room && i_inet === i_fs) success=true;
                                    });
                                    if (!success){
                                        if (typeof pairs_change === "undefined"){
                                            pairs_change = {}
                                        }
                                        if (typeof pairs_change[one_group] === "undefined") {
                                            pairs_change[one_group]={}
                                        }
                                        if (typeof pairs_change[one_group][one_weekday] === "undefined") {
                                            pairs_change[one_group][one_weekday]={}
                                        }
                                        pairs_change[one_group][one_weekday][i_inet+1]={
                                            'modified': data_fs[one_group]['weekdays'][one_weekday].pairs[i_inet],
                                            'stock': pair_inet
                                        };
                                    }
                                });
                            }
                        }
                        if (typeof pairs_change !== "undefined"){
                            this.emit("changes",pairs_change)
                        }
                    })
                } else {
                    this.updFSData('data.json',TritData.getDataPromise())
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
                        callback(data);
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
                console.warn(`${name} updated`);
                if (callback){
                    callback(response);
                }
            }
        });
    }
}

module.exports = TritData;