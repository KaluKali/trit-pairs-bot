const api = require('./tools/api');
const fs = require('fs');

const now_date = new Date();

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
    // constructor(){}

    static getDataPromise(){
        return api('https://trit.biz/rr/json2.php');
    }
    getData(func){
        fs.access('data.json', fs.constants.F_OK, (err) => {
            if(!err){
                fs.readFile('data.json',"utf8", (err,data)=>{
                    if (!err){
                        const data_s = JSON.parse(data);
                        const back_date = new Date(data_s.date);
                        if (back_date.getDate() === now_date.getDate()){
                            func(data_s.data);
                        } else {
                            TritData.getDataPromise().then(response=>{
                                try {
                                    fs.writeFileSync("data.json", JSON.stringify({date:now_date.toJSON(),data:response}),"utf-8");
                                } catch (e) {
                                    console.log(e);
                                } finally {
                                    console.log('data.json updated');
                                    func(response);
                                }
                            });
                        }
                    }
                });
            } else {
                TritData.getDataPromise().then(response=>{
                    try {
                        fs.writeFileSync("data.json", JSON.stringify({date:now_date.toJSON(),data:response}),"utf-8");
                    } catch (e) {
                        console.log(e);
                    } finally {
                        console.log("data.json created");
                        func(response);
                    }

                });
            }
        });
    }
    static getGroupsPromise(){
        return api('https://trit.biz/rr/json.php');
    }
    getValidGroups(func){
        fs.access('groups.json', fs.constants.F_OK, (err) => {
            if(!err){
                fs.readFile('groups.json',"utf8", (err,data)=>{
                    if (!err){
                        const data_s = JSON.parse(data);
                        const back_date = new Date(data_s.date);
                        if (back_date.getDate() === now_date.getDate()){
                            func(data_s.data);
                        } else {
                            TritData.getGroupsPromise().then(response=>{
                                try {
                                    fs.writeFileSync("groups.json", JSON.stringify({date:now_date.toJSON(),data:response}),"utf-8");
                                } catch (e) {
                                    console.log(e);
                                } finally {
                                    console.log('groups.json updated');
                                    func(response);
                                }
                            });
                        }
                    }
                });
            } else {
                TritData.getGroupsPromise().then(response=>{
                    try {
                        fs.writeFileSync("groups.json", JSON.stringify({date:now_date.toJSON(),data:response}),"utf-8");
                    } catch (e) {
                        console.log(e);
                    } finally {
                        console.log('groups.json created');
                        func(response);
                    }
                });
            }
        });
    }
    static ValidGroups(){
        return valid_groups;
    }
    static PairsTime(){
        return pairs_time;
    }
}

module.exports = TritData;