import dotenv from "dotenv";

dotenv.config();
import initializeSocketIo from "./socketManager.js";
import express from "express";
import http from "http";
import cors from "cors";
import router from "./routes/authRouter.js";
import { Server as SocketIoServer } from "socket.io";
// import createDatabasePool from "./db.js";

// const pool = createDatabasePool();
const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
app.use("/", router);
const io = new SocketIoServer(server, {
  cors: {
    origin: "http://localhost:3000", // Your Next.js frontend URL
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.IO event listeners
initializeSocketIo(io);
// pool
//   .getConnection()
//   .then((connection) => {
//     console.log("Successfully connected to the database!");
//     connection.release();
//   })
//   .catch((err) => {
//     console.error("Database connection failed:", err);
//     process.exit(1);
//   });

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
