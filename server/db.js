import mysql from "mysql2/promise";
import fs from "fs";

const createDatabasePool = () => {
  try {
    const caCert = fs.readFileSync(process.env.DB_CA_CERT_PATH);

    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 4000,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        ca: caCert,
        rejectUnauthorized: true,
      },
    });

    console.log("Database pool created successfully.");
    return pool;
  } catch (error) {
    console.error("Failed to create database pool:", error);
    throw error;
  }
};

export default createDatabasePool;
