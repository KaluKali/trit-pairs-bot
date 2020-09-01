const mariadb = require('mariadb');

const UsersDB = function () {
    this.connection = mariadb.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
    });
    this.connection
        .then(conn => {
            console.log("Connection id is " + conn.threadId);
        })
        .catch(err => {
            console.error("Not connected due to error: " + err);
        });
};

UsersDB.prototype.callback = function(sql,values,cb){
    this.connection
        .then(conn => {
            console.log("Connection id is " + conn.threadId);
            conn.ping()
                .then(conn.query(sql,values)
                    .then(cb)
                    .catch(error => )
                )
                .catch(err=>{
                    console.log(`Error in method: callback\n${err}`)
                });
        })
        .catch(err => {
            console.error("Not connected due to error: " + err);
        });

    this.connection.ping()
        .then(this.connection.query(sql,values,cb))
        .catch(err=>{
            console.log(`Error in method: callback\n${err}`)
        });
};
UsersDB.prototype.execute = function(sql, values){
    this.connection.ping()
        .then(this.connection.query(sql,values))
        .catch(err=>{
            console.log(`Error in method: callback\n${err}`);
            this.reconnection(sql, values);
        });
};
UsersDB.prototype.reconnection = function(sql, values, cb){
    this.connection.end()
        .then(() => {
            this.connection = mariadb.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                database: process.env.DB_NAME,
                password: process.env.DB_PASS,
            });
            this.connection
                .then(conn => {
                    console.log("Reconnection id is " + conn.threadId);
                    this.connection.query(sql,values, cb ? (err, data)=>{
                        err ? Error("Connection reopen: Ошибка переподключения " + err.message) : cb(data)
                    } : undefined);
                })
                .catch(err => {
                    console.error("Not reconnected due to error: " + err);
                });
        })
        .catch(err => {
            console.log(`Connection was closed with error: ${err}`)
        });
};

module.exports = new UsersDB();
