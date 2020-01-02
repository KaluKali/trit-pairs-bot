const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "botdb",
    password: "root"
})
connection.connect(function(err){
    if (err) {
        return console.error("Ошибка подключения к MySQL: " + err.message);
    } else console.log("MySQL connected.");
});

var SqlDB = function(){
    this.connection = connection;
}

SqlDB.prototype.getData = function(sql,value){
    return new Promise(resolve =>{
        this.connection.query(sql,value,(err,[data])=>{
            resolve(data);
        });
    });
}
SqlDB.prototype.callback = function(sql,value,func){
    this.connection.query(sql,value,func);
}
SqlDB.prototype.execute = async function(sql,value){
    this.connection.query(sql,value,(err)=>{
        console.log(`Error in SqlDB class:${err}`);
    })
}

module.exports = SqlDB