"use client";

import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { socket } from "./socket";

const ChessGame = () => {
  const [gameId, setGameId] = useState(null);
  const [chess] = useState(new Chess());
  const [boardFen, setBoardFen] = useState(chess.fen());
  const [playerColor, setPlayerColor] = useState(null);
  const [turn, setTurn] = useState("w");
  const [message, setMessage] = useState("");
  const [opponentOnline, setOpponentOnline] = useState(false);
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("jwtToken");
    const storedUsername = localStorage.getItem("username");

    if (storedUserId && storedToken && !socket.connected) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      socket.auth = { token: storedToken };
      socket.connect();
    } else {
      setMessage("Please log in to play chess.");
    }

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      setMessage(
        userId
          ? `Welcome, ${username}! Socket connected.`
          : "Socket connected (unauthenticated)."
      );
    };
    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setMessage("Socket disconnected.");
    };
    const handleAuthError = (data) => {
      console.error("Authentication Error:", data.message);
      setMessage(`Authentication Error: ${data.message}. Please log in again.`);
      localStorage.clear();
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleAuthError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleAuthError);
      socket.disconnect();
    };
  }, [userId, username]);

  useEffect(() => {
    const handleGameCreated = (data) => {
      setGameId(data.gameId);
      setPlayerColor(data.playerColor);
      setMessage(`Game created! Share ID: ${data.gameId}`);
      setBoardFen(chess.fen());
      setTurn("w");
      setOpponentOnline(false);
    };

    const handleGameJoined = (data) => {
      setGameId(data.gameId);
      setPlayerColor(data.playerColor);
      setMessage(`Joined game: ${data.gameId}`);
      setBoardFen(chess.fen());
      setTurn("w");
      setOpponentOnline(true);
    };

    const handleOpponentJoined = (data) => {
      setMessage(
        `Opponent ${data.opponentUsername || data.opponentId} joined!`
      );
      setOpponentOnline(true);
    };

    const handleGameStart = (data) => {
      chess.load(data.fen);
      setBoardFen(data.fen);
      setTurn(data.turn);
      setMessage("Game started!");
      setOpponentOnline(true);
    };

    const handleMoveMade = (data) => {
      chess.move(data.move);
      setBoardFen(data.fen);
      setTurn(data.turn);
      if (data.captureMessage) {
        setMessage(data.captureMessage);
      } else {
        setMessage("");
      }
    };

    const handleGameOver = (data) => {
      setMessage(`Game Over: ${data.result}`);
    };

    const handleGameError = (data) => {
      setError(data.message);
    };

    const handlePlayerDisconnected = (data) => {
      setMessage(data.message);
      setOpponentOnline(false);
    };

    socket.on("gameCreated", handleGameCreated);
    socket.on("gameJoined", handleGameJoined);
    socket.on("opponentJoined", handleOpponentJoined);
    socket.on("gameStart", handleGameStart);
    socket.on("moveMade", handleMoveMade);
    socket.on("gameOver", handleGameOver);
    socket.on("gameError", handleGameError);
    socket.on("playerDisconnected", handlePlayerDisconnected);

    return () => {
      socket.off("gameCreated", handleGameCreated);
      socket.off("gameJoined", handleGameJoined);
      socket.off("opponentJoined", handleOpponentJoined);
      socket.off("gameStart", handleGameStart);
      socket.off("moveMade", handleMoveMade);
      socket.off("gameOver", handleGameOver);
      socket.off("gameError", handleGameError);
      socket.off("playerDisconnected", handlePlayerDisconnected);
    };
  }, [chess]);

  const createNewGame = () => {
    if (!userId) {
      setMessage("Please log in to create a game.");
      return;
    }
    socket.emit("joinGame", {});
  };

  const joinExistingGame = () => {
    if (!userId) {
      setMessage("Please log in to join a game.");
      return;
    }
    const id = prompt("Enter game ID to join:");
    if (id) {
      socket.emit("joinGame", { gameId: id });
    }
  };

  const onDrop = useCallback(
    (sourceSquare, targetSquare, piece) => {
      if (chess.isGameOver() || !gameId || !playerColor) {
        setMessage("Game is over or not started.");
        return false;
      }

      const isMyTurn =
        (playerColor === "w" && chess.turn() === "w") ||
        (playerColor === "b" && chess.turn() === "b");

      if (!isMyTurn) {
        setMessage("It's not your turn!");
        return false;
      }

      if (!opponentOnline && !gameId) {
      } else if (!opponentOnline) {
        setMessage("Waiting for opponent to join/reconnect.");
        return false;
      }

      let promotion = undefined;
      if (
        (piece[1] === "P" && targetSquare[1] === "8") ||
        (piece[1] === "p" && targetSquare[1] === "1")
      ) {
        promotion = prompt("Promote to (q, r, b, n)?", "q");
        if (
          !promotion ||
          !["q", "r", "b", "n"].includes(promotion.toLowerCase())
        ) {
          setMessage("Invalid promotion piece. Defaulting to queen.");
          promotion = "q";
        }
      }

      socket.emit("makeMove", {
        gameId,
        sourceSquare,
        targetSquare,
        promotion,
      });

      return true;
    },
    [chess, gameId, playerColor, opponentOnline, userId]
  );

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">Chess Game</h1>
      <div className="mb-4 text-lg">
        {username ? (
          <p>
            Logged in as: <span className="font-semibold">{username}</span> (ID:{" "}
            {userId})
          </p>
        ) : (
          <p className="text-red-500">
            Not logged in. Please{" "}
            <a href="/login" className="text-blue-500 underline">
              Log In
            </a>{" "}
            or{" "}
            <a href="/signup" className="text-blue-500 underline">
              Sign Up
            </a>
            .
          </p>
        )}
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={createNewGame}
          className=" hover:bg-green-700 font-bold py-2 px-4 rounded"
          disabled={!userId}
        >
          Create New Game
        </button>
        <button
          onClick={joinExistingGame}
          className=" hover:bg-blue-700 ont-bold py-2 px-4 rounded"
          disabled={!userId}
        >
          Join Existing Game
        </button>
      </div>

      {gameId && (
        <div className="mb-4 text-xl font-semibold">
          Game ID: <span className="text-indigo-700">{gameId}</span>
          <p>
            You are playing as:{" "}
            <span className="font-bold">
              {playerColor === "w" ? "White" : "Black"}
            </span>
          </p>
          <p>
            Current Turn:{" "}
            <span className="font-bold">
              {turn === "w" ? "White" : "Black"}
            </span>
          </p>
          <p className={opponentOnline ? "text-green-600" : "text-red-600"}>
            Opponent Status:{" "}
            {opponentOnline ? "Online" : "Offline / Not Joined"}
          </p>
        </div>
      )}

      <div className="w-[800px] h-[800px] mb-4">
        <Chessboard
          position={boardFen}
          onPieceDrop={onDrop}
          boardOrientation={playerColor === "b" ? "black" : "white"}
        />
      </div>

      {message && (
        <p className="text-xl font-semibold mt-4 text-blue-700">{message}</p>
      )}
      {error && (
        <p className="text-xl font-semibold mt-4 text-red-700">{error}</p>
      )}
    </div>
  );
};

export default ChessGame;
