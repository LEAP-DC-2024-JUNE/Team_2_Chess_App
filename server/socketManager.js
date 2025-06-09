import { Chess } from "chess.js";
import {
  createGameRecord,
  updateGameFenAndPgn,
  endGameRecord,
  getGameRecord,
} from "./models/gameModel.js";
import { getDatabasePool } from "./utils/dbSingleton.js";
import { findUserById } from "./models/userModel.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
const activeGames = {};
const funnyCaptureMessages = [
  "So easy!",
  "Just give up already!",
  "GG",
  "Noob",
  "Why don't u cry?",
  "U are not that good",
  "Braindead",
];
function initializeSocketIo(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("No token provided.");
      return next(new Error("No token provided."));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      const user = await findUserById(decoded.id);
      socket.username = user ? user.username : "Guest";

      console.log(`Authenticated for user ID: ${socket.userId}`);
      next();
    } catch (err) {
      console.error("Invalid token.", err.message);
      return next(new Error("Authentication error: Invalid token."));
    }
  });
  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected with id: ${socket.id}`);
    socket.on("joinGame", async ({ gameId }) => {
      const userId = socket.userId;
      const username = socket.username;

      if (!userId) {
        socket.emit("gameError", { message: "User not authenticated." });
        return;
      }
      if (!gameId) {
        const newGameId = uuidv4();
        activeGames[newGameId] = {
          game_id: newGameId,
          player1Id: userId,
          player2Id: null,
          chessInstance: new Chess(),
          turn: "w",
          pgn: "",
          whitePlayerUsername: username,
          blackPlayerUsername: null,
        };
        socket.join(newGameId);
        socket.emit("gameCreated", { gameId: newGameId, playerColor: "w" });
        console.log(`Game ${newGameId} created by user ${username}`);
        try {
          const whitePlayer = await findUserById(userId);
          if (whitePlayer) {
            activeGames[newGameId].whitePlayerUsername = whitePlayer.username;
          }
          await createGameRecord(
            newGameId,
            userId,
            null,
            activeGames[newGameId].chessInstance.fen()
          );
        } catch (dbError) {
          console.error("Error creating game record in DB:", dbError);
          socket.emit("gameError", {
            message: "Failed to create game record in database.",
          });
          delete activeGames[newGameId];
          return;
        }
      } else if (activeGames[gameId] && !activeGames[gameId].player2Id) {
        if (activeGames[gameId].player1Id === userId) {
          socket.emit("gameError", {
            message: "You are already in this game as White.",
          });
          return;
        }

        activeGames[gameId].player2Id = userId;
        activeGames[gameId].blackPlayerUsername = username;
        socket.join(gameId);
        socket.emit("gameJoined", { gameId: gameId, playerColor: "b" });

        const initialFen = activeGames[gameId].chessInstance.fen();
        const initialTurn = activeGames[gameId].chessInstance.turn();

        try {
          const pool = getDatabasePool();
          await pool.execute(
            "UPDATE Games SET black_player_id = ? WHERE game_id = ?",
            [userId, gameId]
          );
        } catch (dbError) {
          console.error(
            "Error updating game record with second player in DB:",
            dbError
          );
          socket.emit("gameError", {
            message: "Failed to update game record in database.",
          });
          delete activeGames[gameId];
          return;
        }

        io.to(gameId).emit("gameStart", {
          fen: initialFen,
          turn: initialTurn,
          whitePlayerUsername: activeGames[gameId].whitePlayerUsername,
          blackPlayerUsername: activeGames[gameId].blackPlayerUsername,
        });
        console.log(`User ${userId} joined game ${gameId}`);
      } else {
        socket.emit("gameError", {
          message: "Game is full or does not exist.",
        });
      }
    });

    socket.on(
      "makeMove",
      async ({ gameId, sourceSquare, targetSquare, promotion }) => {
        const userId = socket.userId;
        const game = activeGames[gameId];

        if (!game) {
          socket.emit("gameError", { message: "Game not found." });
          return;
        }
        if (!userId) {
          socket.emit("gameError", {
            message: "Authentication required to make a move.",
          });
          return;
        }

        const currentPlayerId =
          game.turn === "w" ? game.player1Id : game.player2Id;
        if (userId !== currentPlayerId) {
          socket.emit("gameError", {
            message: "Not your turn or unauthorized move!",
          });
          return;
        }

        let move = null;
        try {
          move = game.chessInstance.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: promotion,
          });
        } catch (e) {
          console.error(
            `Error attempting move ${sourceSquare}-${targetSquare} in game ${gameId}:`,
            e.message
          );
          socket.emit("gameError", { message: `Illegal move: ${e.message}` });
          return;
        }

        if (move) {
          game.turn = game.chessInstance.turn();
          game.pgn = game.chessInstance.pgn();
          try {
            await updateGameFenAndPgn(
              gameId,
              game.chessInstance.fen(),
              game.pgn
            );
          } catch (dbError) {
            console.error("Error updating game FEN/PGN in DB:", dbError);
          }
          let captureMessage = null;
          if (move.captured) {
            captureMessage =
              funnyCaptureMessages[
                Math.floor(Math.random() * funnyCaptureMessages.length)
              ];
            console.log(`Capture in game ${gameId}: ${captureMessage}`);
          }
          io.to(gameId).emit("moveMade", {
            fen: game.chessInstance.fen(),
            move,
            turn: game.turn,
            captureMessage,
          });

          if (game.chessInstance.isGameOver()) {
            let resultText;
            let finalResultStatus;

            if (game.chessInstance.isCheckmate()) {
              finalResultStatus = game.turn === "w" ? "0-1" : "1-0";
              resultText = `${
                game.turn === "w" ? "Black" : "White"
              } wins by checkmate!`;
            } else if (game.chessInstance.isDraw()) {
              finalResultStatus = "1/2-1/2";
              resultText = "Draw!";
            } else if (game.chessInstance.isStalemate()) {
              finalResultStatus = "1/2-1/2";
              resultText = "Stalemate!";
            } else if (game.chessInstance.isThreefoldRepetition()) {
              finalResultStatus = "1/2-1/2";
              resultText = "Draw by threefold repetition!";
            } else if (game.chessInstance.isInsufficientMaterial()) {
              finalResultStatus = "1/2-1/2";
              resultText = "Draw by insufficient material!";
            }
            io.to(gameId).emit("gameOver", { result: resultText });

            try {
              await endGameRecord(
                gameId,
                finalResultStatus,
                game.chessInstance.fen(),
                game.pgn
              );
              delete activeGames[gameId];
              console.log(
                `Game ${gameId} finalized and removed from activeGames.`
              );
            } catch (dbError) {
              console.error("Error finalizing game record in DB:", dbError);
              socket.emit("gameError", {
                message: "Failed to finalize game in database.",
              });
            }
          }
        } else {
          socket.emit("invalidMove", { message: "Illegal move." });
        }
      }
    );

    socket.on("chatMessage", ({ gameId, message }) => {
      if (!gameId || !message || !socket.userId || !socket.username) {
        socket.emit("chatError", {
          message: "Invalid chat message or user not authenticated.",
        });
        return;
      }
      const game = activeGames[gameId];
      if (
        !game ||
        (game.player1Id !== socket.userId && game.player2Id !== socket.userId)
      ) {
        console.warn(
          `User ${socket.username} tried to chat in game ${gameId} but is not a participant.`
        );
        socket.emit("chatError", { message: "You are not part of this game." });
        return;
      }

      io.to(gameId).emit("chatMessage", {
        senderId: socket.userId,
        senderUsername: socket.username,
        message: message,
        timestamp: Date.now(),
      });
      console.log(`Chat in game ${gameId} from ${socket.username}: ${message}`);
    });

    socket.on("disconnect", async () => {
      console.log(
        `User ${
          socket.userId || "unauthenticated user"
        } disconnected with socket ID: ${socket.id}`
      );
      for (const gameId in activeGames) {
        if (
          activeGames[gameId].player1Id === socket.userId ||
          activeGames[gameId].player2Id === socket.userId
        ) {
          const disconnectedPlayerColor =
            activeGames[gameId].player1Id === socket.userId ? "White" : "Black";
          const winningPlayerColor =
            disconnectedPlayerColor === "White" ? "Black" : "White";
          const result = `${winningPlayerColor} wins by abandonment!`;

          io.to(gameId).emit("playerDisconnected", {
            message: `Opponent disconnected. ${result}`,
          });

          try {
            await endGameRecord(gameId, result);
          } catch (dbError) {
            console.error("Error updating game record on disconnect:", dbError);
          }

          delete activeGames[gameId];
          console.log(`Game ${gameId} ended due to player disconnect.`);
          break;
        }
      }
    });
  });
}

export default initializeSocketIo;
