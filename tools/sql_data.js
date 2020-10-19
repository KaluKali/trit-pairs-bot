const { Client } = require('pg');

function SqlDB() {
    this.connection = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: 5432,
    });
    this.connection.connect()
        .catch(err=>{
            console.error('DB connection error: ', err);
            process.exit(1);
        })
}

SqlDB.prototype.getData = function(sql,values){
    return new Promise((resolve,reject) =>{
        this.connection.query(...[values ? [sql,values] : sql])
            .then(data=>resolve(data.rows))
            .catch(err=>reject(err));
    });
};
SqlDB.prototype.callback = function(sql, values, cb){
    this.connection.query(sql,values)
        .then(data=>cb(null, data.rows))
        .catch(()=>this.reopen(sql,values,cb));
};
SqlDB.prototype.execute = function(sql, values){
    this.connection.query(sql,values);
};
SqlDB.prototype.reopen = function(sql,values,cb){
    this.connection.end();
    this.connection = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: 5432,
    });
    this.connection.connect()
        .then(()=>console.log('Reconnected to database.'))
        .catch(err=>{
            console.error('DB reconnection error: ');
            console.error(err);
            process.exit(1);
        });
    this.connection.query(sql,values,(err,res)=>cb(err,res.rows));

};

module.exports = SqlDB;
