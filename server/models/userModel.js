import pool from "../db.js";
export async function createUser(username, email, hashedPassword) {
  try {
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    return { insertId: result.insertId };
  } catch (error) {
    console.error("Error in createUser model:", error);
    throw error;
  }
}
export async function findUserByEmail(email) {
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
