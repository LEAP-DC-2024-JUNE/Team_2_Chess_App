import { getDatabasePool } from "../utils/dbSingleton.js";
import { v4 as uuidv4 } from "uuid";
export async function createUser(username, email, hashedPassword) {
  const pool = getDatabasePool();
  const id = uuidv4();
  try {
    const [result] = await pool.execute(
      "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
      [id, username, email, hashedPassword]
    );
    return { insertId: id };
  } catch (error) {
    console.error("Error in createUser model:", error);
    throw error;
  }
}
export async function findUserByEmail(email) {
  const pool = getDatabasePool();
  try {
    const [rows] = await pool.execute(
      "SELECT id, username, email, password FROM users WHERE email = ?",
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error in findUserByEmail model:", error);
    throw error;
  }
}
