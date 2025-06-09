"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { socket } from "./socket";
import { SendHorizonal } from "lucide-react";

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
  const [movesList, setMovesList] = useState([]);
  const [whitePlayerUsername, setWhitePlayerUsername] = useState(null);
  const [blackPlayerUsername, setBlackPlayerUsername] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const chatMessagesEndRef = useRef(null);
  console.log(error);
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
          ? `Welcome, ${storedUsername}!.`
          : "Socket connected (unauthenticated)."
      );
    };
    const handleDisconnect = () => {
      setMessage("Socket disconnected.");
      setOpponentOnline(false);
      setGameId(null);
      setWhitePlayerUsername(null);
      setBlackPlayerUsername(null);
      chess.reset();
      setBoardFen(chess.fen());
      setMovesList([]);
      setChatMessages([]);
      setChatInput("");
      setError("");
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
  }, [userId, username, chess]);

  useEffect(() => {
    const handleGameCreated = (data) => {
      setGameId(data.gameId);
      setPlayerColor(data.playerColor);
      setMessage(`Game created! Share ID: ${data.gameId}`);
      chess.reset();
      setBoardFen(chess.fen());
      setTurn("w");
      setMovesList([]);
      setOpponentOnline(false);
      setWhitePlayerUsername(username);
      setBlackPlayerUsername(null);
      setChatMessages([]);
    };

    const handleGameJoined = (data) => {
      setGameId(data.gameId);
      setPlayerColor(data.playerColor);
      setMessage(`Joined game: ${data.gameId}`);
      chess.reset();
      setBoardFen(chess.fen());
      setTurn("w");
      setMovesList([]);
      setOpponentOnline(true);
      setBlackPlayerUsername(username);
      setWhitePlayerUsername(null);
      setChatMessages([]);
    };

    const handleGameStart = (data) => {
      chess.load(data.fen);
      setBoardFen(data.fen);
      setTurn(data.turn);
      setMovesList(chess.history());
      setMessage("Game started!");
      setOpponentOnline(true);
      setWhitePlayerUsername(data.whitePlayerUsername);
      setBlackPlayerUsername(data.blackPlayerUsername);
    };

    const handleMoveMade = (data) => {
      chess.move(data.move);
      setBoardFen(data.fen);
      setTurn(data.turn);
      setMovesList(chess.history());
      if (data.captureMessage) {
        setMessage(data.captureMessage);
      } else {
        setMessage("");
      }
    };

    const handleGameOver = (data) => {
      setMessage(`Game Over: ${data.result}`);
      setMovesList(chess.history());
    };

    const handleGameError = (data) => {
      setError(data.message);
    };

    const handlePlayerDisconnected = (data) => {
      setMessage(data.message);
      setOpponentOnline(false);
    };
    const handleChatMessage = (data) => {
      setChatMessages((prevMessages) => [...prevMessages, data]);
    };

    socket.on("gameCreated", handleGameCreated);
    socket.on("gameJoined", handleGameJoined);
    socket.on("gameStart", handleGameStart);
    socket.on("moveMade", handleMoveMade);
    socket.on("gameOver", handleGameOver);
    socket.on("gameError", handleGameError);
    socket.on("playerDisconnected", handlePlayerDisconnected);
    socket.on("chatMessage", handleChatMessage);

    return () => {
      socket.off("gameCreated", handleGameCreated);
      socket.off("gameJoined", handleGameJoined);
      socket.off("gameStart", handleGameStart);
      socket.off("moveMade", handleMoveMade);
      socket.off("gameOver", handleGameOver);
      socket.off("gameError", handleGameError);
      socket.off("playerDisconnected", handlePlayerDisconnected);
      socket.off("chatMessage", handleChatMessage);
    };
  }, [chess, username]);

  const createNewGame = () => {
    if (!userId) {
      setMessage("Please log in to create a game.");
      return;
    }
    setError("");
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
    [chess, gameId, playerColor, opponentOnline]
  );

  const sendChatMessage = () => {
    if (chatInput.trim() === "" || !gameId) {
      setError("Cannot send empty message or not in a game.");
      return;
    }
    socket.emit("chatMessage", { gameId, message: chatInput });
    setChatInput("");
    setError("");
  };

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
  };

  const handleChatInputKeyPress = (e) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  };
  console.log(username);
  return (
    <div className="flex flex-col items-center p-4 h-screen">
      <div className="flex gap-6">
        {gameId && (
          <div className="box-border border-2 bg-green-300 px-2 py-2 rounded-2xl">
            <div className=" text-lg font-semibold text-gray-800">
              Game ID: <span className="font-bold underline">{gameId}</span>
              <div>
                <p>
                  White: <span>{whitePlayerUsername || "Waiting..."}</span>
                </p>
                <p>
                  Black: <span>{blackPlayerUsername || "Waiting..."}</span>
                </p>
              </div>
              <p>
                Current Turn:{" "}
                <span className="font-bold">
                  {turn === "w" ? "White" : "Black"}
                </span>
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4 justify-evenly">
          <button
            onClick={createNewGame}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={!userId}
          >
            Create New Game
          </button>
          <button
            onClick={joinExistingGame}
            className="bg-gray-200 hover:bg-blue-700  font-bold py-2 px-4 rounded"
            disabled={!userId}
          >
            Join Existing Game
          </button>
        </div>
      </div>
      {message && (
        <p className="text-xl font-bold mt-4 text-green-500">{message}</p>
      )}

      <div className="flex mt-4 gap-8">
        <div className="flex flex-col gap-2">
          <div className="box-border border-2 rounded-2xl bg-gray-200 px-2 max-w-[150px] font-bold ">
            <p>{username}</p>
          </div>
          <div className="w-[670px] h-[700px]">
            <Chessboard
              position={boardFen}
              onPieceDrop={onDrop}
              boardOrientation={playerColor === "b" ? "black" : "white"}
            />
          </div>
        </div>

        {gameId && (
          <div className="flex flex-col w-full max-w-[600px]  lg:mt-0">
            <div className="p-4  rounded-lg shadow-lg overflow-y-auto max-h-[300px] mb-4 bg-green-300">
              <h3 className="text-lg font-bold  text-center  border-t border-gray-700 ">
                Move History
              </h3>
              <ol className="list-none p-0 m-0 text-sm">
                {movesList.reduce((acc, move, index) => {
                  const moveNumber = Math.floor(index / 2) + 1;
                  if (index % 2 === 0) {
                    acc.push(
                      <li
                        key={moveNumber}
                        className="grid grid-cols-[30px_1fr_1fr] items-center mb-1"
                      >
                        <span className="font-semibold  text-left">{`${moveNumber}.`}</span>
                        <span className="text-white font-medium text-left">
                          {move}
                        </span>
                        {movesList[index + 1] && (
                          <span className=" text-left pl-2">
                            {movesList[index + 1]}
                          </span>
                        )}
                      </li>
                    );
                  }
                  return acc;
                }, [])}
              </ol>
              {movesList.length === 0 && (
                <p className=" text-center mt-4">No moves made yet.</p>
              )}
            </div>
            <div className="flex flex-col  p-4 bg-green-300  rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-center  border-b border-gray-700 pb-2">
                Chat
              </h3>
              <div
                className=" overflow-y-auto pr-2"
                style={{ maxHeight: "250px" }}
              >
                {chatMessages.length === 0 && (
                  <p className="text-gray-400 text-center mt-4">
                    No messages yet.
                  </p>
                )}
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 p-2 rounded-lg ${
                      msg.senderId === userId
                        ? "bg-gray-200 ml-auto"
                        : "bg-gray-700  text-white mr-auto"
                    } max-w-[70%] break-words`}
                  >
                    <p className="font-bold text-sm mb-1">
                      {msg.senderUsername}:
                    </p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs  text-right mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>
              <div className="mt-4 flex">
                <input
                  type="text"
                  value={chatInput}
                  onChange={handleChatInputChange}
                  onKeyPress={handleChatInputKeyPress}
                  placeholder={
                    gameId ? "Type your message..." : "Join a game to chat..."
                  }
                  className="flex-grow p-2 rounded-l-lg bg-gray-300 border "
                  disabled={!gameId || !opponentOnline}
                />
                <button
                  onClick={sendChatMessage}
                  className="p-2 bg-gray-950 text-white rounded-r-lg flex items-center justify-center duration-200 shadow-md"
                  disabled={
                    !gameId || !opponentOnline || chatInput.trim() === ""
                  }
                >
                  <SendHorizonal size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessGame;
