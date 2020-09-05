const mysql = require('mysql2');

function SqlDB() {
    this.connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
    });
    this.connection.connect(function(err){
        if (err) return Error("MAIN Ошибка подключения к MySQL: " + err.message);
    });
}

SqlDB.prototype.getData = function(sql,values){
    return new Promise(resolve =>{
        this.connection.ping((err)=>{
            if (err) {
                this.reopen();
                resolve(err);
            }
            this.connection.query(sql,values,(err,[data])=>resolve(data));
        });
    });
};
SqlDB.prototype.callback = function(sql,value,func){
    this.connection.ping((err)=>{
        if (err) this.reopen();
        this.connection.query(sql,value,func);
    });
};
SqlDB.prototype.execute = function(sql,value){
    this.connection.ping((err)=>{
        if (err) this.reopen();
        this.connection.query(sql,value);
    });
};
SqlDB.prototype.reopen = function(){
    this.connection.close();
    this.connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
    });
    this.connection.connect(function(err){
        if (err) return Error("REOPEN Ошибка подключения " + err.message);
        else console.log('reopened connection to mysql-db');
    });
};

module.exports = SqlDB;
