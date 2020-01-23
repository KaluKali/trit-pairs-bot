const mysql = require('mysql2');

const SqlDB = function () {
    this.connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
    });
    this.connection.connect(function(err){
        if (err) return Error("MAIN Ошибка подключения к MySQL: " + err.message)
    });
};

SqlDB.prototype.getData = function(sql,values){
    return new Promise(resolve =>{
        this.connection.connect(function (err) {
            if (err) {
                this._reopen();
                console.error("GETDATA Ошибка подключения к MySQL: " + err.message);
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
        if (err) {
            this._reopen();
            console.error("CALLBACK Ошибка подключения к MySQL: " + err.message);
        }
    });
    this.connection.query(sql,value,func);
};
SqlDB.prototype.execute = function(sql,value){
    this.connection.connect(function (err) {
        if (err){
            this._reopen();
            console.error("EXEC Ошибка подключения к MySQL: " + err.message);
        }
    });
    this.connection.query(sql,value,(err)=>{
        console.log(`Error in SqlDB class:${err}`);
    });
};
SqlDB.prototype._reopen = function(){
    this.connection.destroy();
    this.connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
    });
    this.connection.connect(function(err){
        if (err) return Error("MAIN Ошибка подключения " + err.message);
        else console.log('reopened connection to mysql-db');
    });
};

module.exports = SqlDB;