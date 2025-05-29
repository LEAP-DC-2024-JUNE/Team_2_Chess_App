import dotenv from "dotenv";

dotenv.config();
import { setDatabasePool } from "./utils/dbSingleton.js";
import initializeSocketIo from "./socketManager.js";
import express from "express";
import http from "http";
import cors from "cors";
import router from "./routes/authRouter.js";
import { Server as SocketIoServer } from "socket.io";
import createDatabasePool from "./db.js";
const pool = createDatabasePool();
setDatabasePool(pool);

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://team-chess-app.vercel.app",
        "https://team-2-chess-app.onrender.com",
      ]
    : [
        "http://localhost:3000",
        "https://team-chess-app.vercel.app",
        "https://team-2-chess-app.onrender.com",
      ];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use("/", router);
const io = new SocketIoServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initializeSocketIo(io);
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

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
