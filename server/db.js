import mysql from "mysql2/promise";
const pool = mysql.createPool({
  host: "34.56.242.26",
  user: "chess-app",
  password: "sumiya1234",
  database: "chess-app",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
