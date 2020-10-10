const SqlDB = require('../tools/sql_data');
const sql_db = new SqlDB();

const user_info = async function (vk_id, fields=[]) {
    return sql_db.getData(`SELECT ${fields.length ? fields.join() : '*'} FROM ${process.env.DB_TABLE} WHERE vk_id = ${vk_id} LIMIT 1`);
};
module.exports = user_info;
