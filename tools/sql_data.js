const { Client } = require('pg');

function SqlDB() {
    this.connection = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: 5432,
    });
    this.connection.connect(err =>err ? console.error('DB connection error: ', err) : null);
}

SqlDB.prototype.getData = function(sql,values){
    return new Promise((resolve,reject) =>{
        this.connection.query(...[values ? [sql,values] : sql])
            .then(data=>resolve(data.rows))
            .catch(err=>reject(err));
    });
};
SqlDB.prototype.callback = function(sql,value,cb){
    this.connection.query(sql,value)
        .then(data=>cb(null, data.rows))
        .catch(err=>cb(err));
};
SqlDB.prototype.execute = function(sql,value){
    this.connection.query(sql,value);
};
SqlDB.prototype.reopen = function(){
    this.connection.end();
    this.connection = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: 5432,
    });
    this.connection.connect(function(err){
        if (err) return Error(`Reconnect: Ошибка подключения: ${err.message}`);
        else console.log('Reconnected to database.');
    });
};

module.exports = SqlDB;
