import express from "express";
import cors from "cors";
import router from "./routes/authRouter.js";
import pool from "./db.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/", router);

pool
  .getConnection()
  .then((connection) => {
    console.log("Successfully connected to the database!");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
