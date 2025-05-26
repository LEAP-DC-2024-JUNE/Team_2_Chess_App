import { Chess } from "chess.js";

const activeGames = {};
function initializeSocketIo(io) {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("joinGame", ({ gameId }) => {
      if (!gameId) {
        gameId = `game-${Math.random().toString(36).substring(7)}`;
        activeGames[gameId] = {
          player1Id: socket.id,
          player2Id: null,
          chessInstance: new Chess(),
          turn: "w",
        };
        socket.join(gameId);
        socket.emit("gameCreated", { gameId, playerColor: "w" });
        console.log(`Game ${gameId} created by ${socket.id}`);
      } else if (activeGames[gameId] && !activeGames[gameId].player2Id) {
        activeGames[gameId].player2Id = socket.id;
        socket.join(gameId);
        socket.emit("gameJoined", { gameId, playerColor: "b" });
        io.to(activeGames[gameId].player1Id).emit("opponentJoined", {
          gameId,
          opponentId: socket.id,
        });
        io.to(gameId).emit("gameStart", {
          fen: activeGames[gameId].chessInstance.fen(),
          turn: activeGames[gameId].chessInstance.turn(),
        });
        console.log(`Player ${socket.id} joined game ${gameId}`);
      } else {
        socket.emit("gameError", {
          message: "Game is full or does not exist.",
        });
      }
    });

    socket.on(
      "makeMove",
      ({ gameId, sourceSquare, targetSquare, promotion }) => {
        const game = activeGames[gameId];
        if (!game) {
          socket.emit("gameError", { message: "Game not found." });
          return;
        }

        const currentPlayerId =
          game.turn === "w" ? game.player1Id : game.player2Id;
        if (socket.id !== currentPlayerId) {
          socket.emit("gameError", { message: "Not your turn!" });
          return;
        }

        const move = game.chessInstance.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: promotion,
        });

        if (move) {
          game.turn = game.chessInstance.turn();
          io.to(gameId).emit("moveMade", {
            fen: game.chessInstance.fen(),
            move,
            turn: game.turn,
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
          }
        } else {
          socket.emit("invalidMove", { message: "Illegal move." });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      for (const gameId in activeGames) {
        if (
          activeGames[gameId].player1Id === socket.id ||
          activeGames[gameId].player2Id === socket.id
        ) {
          io.to(gameId).emit("playerDisconnected", {
            message: "Opponent disconnected. Game ended.",
          });
          delete activeGames[gameId];
          console.log(`Game ${gameId} ended due to player disconnect.`);
          break;
        }
      }
    });
  });
}
export default initializeSocketIo;
