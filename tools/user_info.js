const SqlDB = require('../tools/sql_data');
const sql_db = new SqlDB();

const user_info = async function (vk_id, fields=false) {
    if (Array.isArray(fields)) {
        return sql_db.getData(`SELECT ${fields.join()} FROM ${process.env.DB_TABLE} WHERE vk_id LIKE ${vk_id} LIMIT 1`);
    } else {
        return sql_db.getData(`SELECT * FROM ${process.env.DB_TABLE} WHERE vk_id LIKE ${vk_id} LIMIT 1`);
    }
};
module.exports = user_info;
