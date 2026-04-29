import mysql from "mysql2/promise";

export const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "pingfindb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
  supportBigNumbers: true
};

const pool = mysql.createPool(DB_CONFIG);

export { pool };

export async function getConnection() {
  return pool.getConnection();
}

export async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.ping();
    return {
      success: true,
      message: "Verbinding met MySQL geslaagd.",
      config: {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        database: DB_CONFIG.database,
        user: DB_CONFIG.user
      }
    };
  } catch (err) {
    return {
      success: false,
      message: `Verbinding mislukt: ${err.message}`,
      config: {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        database: DB_CONFIG.database,
        user: DB_CONFIG.user
      }
    };
  } finally {
    if (conn) conn.release();
  }
}
