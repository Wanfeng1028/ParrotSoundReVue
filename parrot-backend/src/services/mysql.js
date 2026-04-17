const mysql = require("mysql2/promise");
const { env } = require("../config/env");

let pool = null;
let mysqlMode = "disabled";

const initMysql = async () => {
  if (!env.mysql.host || !env.mysql.user || !env.mysql.database) {
    mysqlMode = "disabled";
    return { mode: mysqlMode };
  }
  try {
    pool = mysql.createPool({
      host: env.mysql.host,
      port: env.mysql.port,
      user: env.mysql.user,
      password: env.mysql.password,
      database: env.mysql.database,
      connectionLimit: 5,
      waitForConnections: true,
    });
    await pool.query("SELECT 1");
    mysqlMode = "mysql";
  } catch (error) {
    pool = null;
    mysqlMode = "disabled";
  }
  return { mode: mysqlMode };
};

const getMysqlPool = () => pool;
const getMysqlMode = () => mysqlMode;

module.exports = { initMysql, getMysqlPool, getMysqlMode };
