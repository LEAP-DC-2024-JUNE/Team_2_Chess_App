import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../models/userModel.js";
export async function signup(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await createUser(username, email, hashedPassword);

    res.status(201).json({
      message: "User created successfully",
      userId: result.insertId,
      username: username,
      email: email,
    });
  } catch (error) {
    console.error("Signup controller error:", error);
    res.status(500).json({ error: "Internal server error during signup." });
  }
}
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    res.status(200).json({
      message: "Login successful",
      userId: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Login controller error:", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
}
