const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS
});
connection.connect(function(err){
    if (err) {
        return console.error("Ошибка подключения к MySQL: " + err.message);
    } else console.log("MySQL connected.");
});

const SqlDB = function () {
    this.connection = connection;
};

SqlDB.prototype.getData = function(sql,values){
    return new Promise(resolve =>{
        this.connection.query(sql,values,(err,[data])=>{
            resolve(data);
        });
    });
};
SqlDB.prototype.callback = function(sql,value,func){
    this.connection.query(sql,value,func);
};
SqlDB.prototype.execute = async function(sql,value){
    this.connection.query(sql,value,(err)=>{
        console.log(`Error in SqlDB class:${err}`);
    })
};

module.exports = SqlDB;