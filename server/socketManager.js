import { Chess } from "chess.js";
import {
  createGameRecord,
  updateGameFenAndPgn,
  endGameRecord,
  getGameRecord,
} from "./models/gameModel.js";
import { getDatabasePool } from "./utils/dbSingleton.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
const activeGames = {};
const funnyCaptureMessages = [
  "So easy!",
  "Just give up already!",
  "GG",
  "Noob",
  "Why don't u cry?",
  "Just got again",
  "Braindead",
];
function initializeSocketIo(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("Socket connection rejected: No token provided.");
      return next(new Error("Authentication error: No token provided."));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.userId = decoded.id;
      socket.userEmail = decoded.email;

      console.log(`Socket authenticated for user ID: ${socket.userId}`);
      next();
    } catch (err) {
      console.error("Socket connection rejected: Invalid token.", err.message);
      return next(new Error("Authentication error: Invalid token."));
    }
  });
  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected with socket ID: ${socket.id}`);
    socket.on("joinGame", async ({ gameId }) => {
      const userId = socket.userId;

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
        };
        socket.join(newGameId);
        socket.emit("gameCreated", { gameId: newGameId, playerColor: "w" });
        console.log(`Game ${newGameId} created by user ${userId}`);
        try {
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
        socket.join(gameId);
        socket.emit("gameJoined", { gameId: gameId, playerColor: "b" });

        io.to(gameId).emit("opponentJoined", {
          gameId,
          opponentId: userId,
          opponentUsername: socket.userEmail,
        });

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

        io.to(gameId).emit("gameStart", { fen: initialFen, turn: initialTurn });
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
            console.error("Error updating game state in DB:", dbError);
            socket.emit("gameError", {
              message: "Failed to save move to database.",
            });
            return;
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
            let result;
            if (game.chessInstance.isCheckmate()) {
              result = `${
                game.turn === "w" ? "Black" : "White"
              } wins by checkmate!`;
            } else if (game.chessInstance.isDraw()) {
              result = "Draw!";
            } else if (game.chessInstance.isStalemate()) {
              result = "Stalemate!";
            } else if (game.chessInstance.isThreefoldRepetition()) {
              result = "Draw by threefold repetition!";
            } else if (game.chessInstance.isInsufficientMaterial()) {
              result = "Draw by insufficient material!";
            }
            io.to(gameId).emit("gameOver", { result });

            try {
              await endGameRecord(gameId, result);
            } catch (dbError) {
              console.error("Error ending game record in DB:", dbError);
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
