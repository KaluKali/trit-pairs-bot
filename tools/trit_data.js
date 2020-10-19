const api = require('./utils/api');
const fs = require('fs');
const EventEmitter = require('events');

const now_date = new Date();

function isLargeDigit(i){
    return i.toString().length > 1
}

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
    getTimeTable(callback) {
        this.getFSData('timetable.json',(data,err)=>{
            if (!err){
                const back_date = new Date(data.date);
                if (back_date.getDate() === now_date.getDate()){
                    callback(data.data);
                } else {
                    this.updFSData('timetable.json',TritData.getTimeTablePromise(),callback);
                }
            } else {
                this.updFSData('timetable.json',TritData.getTimeTablePromise(),callback)
            }
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
                if (name === 'timetable.json') {
                    const timetable = response.filter((elem)=>elem.includes('lesson'))
                        .map(elem=>
                            `${isLargeDigit(elem[1]) ? '' : '0'}${elem[1]}:${isLargeDigit(elem[2]) ? '' : '0'}${elem[2]} - ${isLargeDigit(elem[3]) ? '' : '0'}${elem[3]}:${isLargeDigit(elem[4]) ? '' : '0'}${elem[4]}`);
                    fs.writeFileSync(name, JSON.stringify({date:now_date.toJSON(),data: timetable}),'utf-8');
                    if (callback) callback(timetable)
                } else {
                    fs.writeFileSync(name, JSON.stringify({date:now_date.toJSON(),data: response}),'utf-8');
                    if (callback) callback(response);
                }
            } catch (e) {
                console.warn(e);
            } finally {
                console.info(`${name} updated.`);
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
}

module.exports = TritData;
