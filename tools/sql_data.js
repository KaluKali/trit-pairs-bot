const mysql = require('mysql2');

const SqlDB = function () {
    this.connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS
    });
    this.connection.connect(function(err){
        if (err) return Error("Ошибка подключения к MySQL: " + err.message)
    });
};

SqlDB.prototype.getData = function(sql,values){
    return new Promise(resolve =>{
        this.connection.connect(function (err) {
            if (err) {
                console.error("Ошибка подключения к MySQL: " + err.message);
                return resolve(err);
            }
        });
        this.connection.query(sql,values,(err,[data])=>{
            if (err) resolve(err);
            else resolve(data);
        });
    });
};
SqlDB.prototype.callback = function(sql,value,func){
    this.connection.connect(function (err) {
        if (err) return console.error("Ошибка подключения к MySQL: " + err.message);
    });
    this.connection.query(sql,value,func);
};
SqlDB.prototype.execute = function(sql,value){
    this.connection.connect(function (err) {
        if (err) return console.error("Ошибка подключения к MySQL: " + err.message);
    });
    this.connection.query(sql,value,(err)=>{
        console.log(`Error in SqlDB class:${err}`);
    });
};

module.exports = SqlDB;