"use client";

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useSocket, socket } from "./socket";

const ChessGame = () => {
  useSocket();

  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [message, setMessage] = useState("");
  const [opponentConnected, setOpponentConnected] = useState(false);

  useEffect(() => {
    socket.on(
      "gameCreated",
      ({ gameId: newGameId, playerColor: newPlayerColor }) => {
        setGameId(newGameId);
        setPlayerColor(newPlayerColor);
        setMessage(`Game created! Share ID: ${newGameId}`);
      }
    );

    socket.on(
      "gameJoined",
      ({ gameId: joinedGameId, playerColor: joinedPlayerColor }) => {
        setGameId(joinedGameId);
        setPlayerColor(joinedPlayerColor);
        setMessage(`Joined game: ${joinedGameId}`);
        setOpponentConnected(true);
      }
    );

    socket.on("opponentJoined", () => {
      setOpponentConnected(true);
      setMessage("Opponent connected! Game starting...");
    });

    socket.on("gameStart", ({ fen, turn }) => {
      setGame(new Chess(fen));
      setMessage(
        `Game started. It's ${turn === "w" ? "White" : "Black"}'s turn.`
      );
    });

    socket.on("moveMade", ({ fen, turn }) => {
      setGame(new Chess(fen));
      setMessage(`It's ${turn === "w" ? "White" : "Black"}'s turn.`);
    });

    socket.on("invalidMove", ({ message }) => {
      setMessage(`Invalid move: ${message}`);
    });

    socket.on("gameError", ({ message }) => {
      setMessage(`Game Error: ${message}`);
    });

    socket.on("gameOver", ({ result }) => {
      setMessage(`Game Over! ${result}`);
    });

    socket.on("playerDisconnected", ({ message }) => {
      setMessage(message);
      setOpponentConnected(false);
    });

    return () => {
      socket.off("gameCreated");
      socket.off("gameJoined");
      socket.off("opponentJoined");
      socket.off("gameStart");
      socket.off("moveMade");
      socket.off("invalidMove");
      socket.off("gameError");
      socket.off("gameOver");
      socket.off("playerDisconnected");
    };
  }, []);

  function onDrop(sourceSquare, targetSquare, piece) {
    if (
      !gameId ||
      !playerColor ||
      !opponentConnected ||
      game.isGameOver() ||
      game.isDraw()
    ) {
      setMessage("Waiting for opponent or game to start/end.");
      return false;
    }

    if (game.turn() !== playerColor) {
      setMessage("Not your turn!");
      return false;
    }

    let promotion = undefined;
    if (
      (piece.startsWith("wP") && targetSquare[1] === "8") ||
      (piece.startsWith("bP") && targetSquare[1] === "1")
    ) {
      promotion = "q";
    }

    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: promotion,
    });

    if (move === null) {
      setMessage("Illegal move.");
      return false;
    }

    socket.emit("makeMove", { gameId, sourceSquare, targetSquare, promotion });
    return true;
  }

  const createNewGame = () => {
    socket.emit("joinGame", {});
  };

  const joinExistingGame = () => {
    const id = prompt("Enter game ID to join:");
    if (id) {
      socket.emit("joinGame", { gameId: id });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">Two-Player Chess</h1>
      <div className="mb-4">
        <button
          onClick={createNewGame}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Create New Game
        </button>
        <button
          onClick={joinExistingGame}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Join Game
        </button>
      </div>
      {message && <p className="mb-4 text-lg text-red-600">{message}</p>}
      {gameId && (
        <p className="mb-2">
          Your Game ID: <span className="font-bold">{gameId}</span>
        </p>
      )}
      {playerColor && (
        <p className="mb-4">
          You are:{" "}
          <span className="font-bold">
            {playerColor === "w" ? "White" : "Black"}
          </span>
        </p>
      )}

      <div className="w-[600px] h-[600px]">
        <Chessboard
          id="TwoPlayerChess"
          position={game.fen()}
          onPieceDrop={onDrop}
          customBoardStyle={{
            borderRadius: "4px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
          }}
          boardOrientation={playerColor === "b" ? "black" : "white"}
        />
      </div>
    </div>
  );
};

export default ChessGame;
