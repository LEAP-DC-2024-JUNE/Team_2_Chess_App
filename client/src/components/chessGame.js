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
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [captureMessage, setCaptureMessage] = useState("");
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
    } else if (!storedUserId || !storedToken) {
      setMessage("Please log in to play chess.");
    }

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      setMessage(
        storedUsername
          ? `Welcome, ${storedUsername}!`
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
      setShowRematchModal(false);
      setCaptureMessage("");
    };
    const handleAuthError = (data) => {
      console.error("Authentication Error:", data.message);
      setMessage(`Authentication Error: ${data.message}. Please log in again.`);
      localStorage.clear();
      setUserId(null);
      setUsername(null);
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
      setCaptureMessage("");
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
      setCaptureMessage("");
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
      setCaptureMessage("");
    };

    const handleMoveMade = (data) => {
      chess.move(data.move);
      setBoardFen(data.fen);
      setTurn(data.turn);
      setMovesList(chess.history());
      if (data.captureMessage) {
        setCaptureMessage(data.captureMessage);
        setTimeout(() => setCaptureMessage(""), 3000);
      } else {
        setCaptureMessage("");
      }
      if (data.captureMessage) {
        setMessage("");
      } else {
        setMessage("");
      }
    };

    const handleGameOver = (data) => {
      setMessage(`Game Over: ${data.message}`);
      setMovesList(chess.history());
      let outcome = "";
      if (data.status === "1-0") {
        if (playerColor === "w") {
          outcome = "You Won!";
        } else if (playerColor === "b") {
          outcome = "You Lost!";
        } else {
          outcome = "White Won!";
        }
      } else if (data.status === "0-1") {
        if (playerColor === "b") {
          outcome = "You Won!";
        } else if (playerColor === "w") {
          outcome = "You Lost!";
        } else {
          outcome = "Black Won!";
        }
      } else if (data.status === "1/2-1/2") {
        outcome = "It's a Draw!";
      } else {
        outcome = "Game ended.";
      }
      setGameOverMessage(outcome);
      setShowRematchModal(true);
      setCaptureMessage("");
    };

    const handleGameError = (data) => {
      setError(data.message);
      setCaptureMessage("");
    };

    const handlePlayerDisconnected = (data) => {
      setMessage(data.message);
      setOpponentOnline(false);
      setCaptureMessage("");
      setGameOverMessage(data.message);
      setShowRematchModal(true);
    };
    const handleChatMessage = (data) => {
      setChatMessages((prevMessages) => [...prevMessages, data]);
    };
    const handleRematchAccepted = (data) => {
      console.log("Rematch Accepted! Starting new game:", data);
      setShowRematchModal(false);
      chess.load(data.fen);
      setBoardFen(data.fen);
      setTurn(data.turn);
      setMovesList([]);
      setGameId(data.gameId);
      if (userId === data.newWhitePlayerId) {
        setPlayerColor("w");
      } else if (userId === data.newBlackPlayerId) {
        setPlayerColor("b");
      } else {
        setPlayerColor(null);
        console.error(
          "Could not determine player color in rematch! User ID:",
          userId,
          "New White ID:",
          data.newWhitePlayerId,
          "New Black ID:",
          data.newBlackPlayerId
        );
      }

      setWhitePlayerUsername(data.whitePlayerUsername);
      setBlackPlayerUsername(data.blackPlayerUsername);
      setMessage("Rematch started!");
      setError("");
      setChatMessages([]);
      setCaptureMessage("");
    };
    socket.on("gameCreated", handleGameCreated);
    socket.on("gameJoined", handleGameJoined);
    socket.on("gameStart", handleGameStart);
    socket.on("moveMade", handleMoveMade);
    socket.on("gameOver", handleGameOver);
    socket.on("gameError", handleGameError);
    socket.on("playerDisconnected", handlePlayerDisconnected);
    socket.on("chatMessage", handleChatMessage);
    socket.on("rematchAccepted", handleRematchAccepted);

    return () => {
      socket.off("gameCreated", handleGameCreated);
      socket.off("gameJoined", handleGameJoined);
      socket.off("gameStart", handleGameStart);
      socket.off("moveMade", handleMoveMade);
      socket.off("gameOver", handleGameOver);
      socket.off("gameError", handleGameError);
      socket.off("playerDisconnected", handlePlayerDisconnected);
      socket.off("chatMessage", handleChatMessage);
      socket.off("rematchAccepted", handleRematchAccepted);
    };
  }, [chess, username, playerColor, userId]);

  const createNewGame = () => {
    if (!userId) {
      setMessage("Please log in to create a game.");
      return;
    }
    setError("");
    socket.emit("joinGame", {});
    setShowRematchModal(false);
  };

  const joinExistingGame = () => {
    if (!userId) {
      setMessage("Please log in to join a game.");
      return;
    }
    const id = prompt("Enter game ID to join:");
    if (id) {
      socket.emit("joinGame", { gameId: id });
      setShowRematchModal(false);
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
        setMessage("Waiting for opponent to join/reconnect.");
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
  const handleRematchRequest = () => {
    if (!gameId) {
      setError("No active game to request a rematch for.");
      return;
    }
    setMessage("Rematch request sent. Waiting for opponent...");
    setError("");
    socket.emit("requestRematch", { gameId });
  };

  const handleGoHomeFromModal = () => {
    setShowRematchModal(false);
    setGameId(null);
    setPlayerColor(null);
    setTurn("w");
    setMovesList([]);
    setOpponentOnline(false);
    setWhitePlayerUsername(null);
    setBlackPlayerUsername(null);
    setChatMessages([]);
    setChatInput("");
    chess.reset();
    setBoardFen(chess.fen());
    setMessage("Game ended. Ready for a new game.");
    setError("");
    setCaptureMessage("");
  };

  const copyGameIdToClipboard = () => {
    if (gameId) {
      navigator.clipboard
        .writeText(gameId)
        .then(() => {
          setCopyStatus("Copied!");
          setTimeout(() => setCopyStatus(""), 3000);
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
          setCopyStatus("Failed to copy!");
          setTimeout(() => setCopyStatus(""), 3000);
        });
    }
  };
  console.log(captureMessage);
  return (
    <div>
      <div className="flex px-10 py-10 justify-evenly h-screen">
        <div className="flex flex-col gap-2 items-center justify-center ">
          <div>
            {gameId && (
              <div className="bg-green-700 p-4 rounded-xl shadow-lg w-[400px] h-[400px]">
                {" "}
                <h2 className="text-xl font-bold mb-2 text-center text-green-200">
                  Your Game Details
                </h2>
                <div className="text-lg font-semibold mb-2">
                  <p className="mb-1 text-gray-200">
                    White:{" "}
                    <span className="font-medium text-gray-200">
                      {whitePlayerUsername || "Waiting..."}
                    </span>
                  </p>
                  <p className="mb-1 font-bold">
                    Black:{" "}
                    <span className=" font-bold">
                      {blackPlayerUsername || "Waiting..."}
                    </span>
                  </p>
                  <p className="text-gray-200">
                    Current Turn:{" "}
                    <span className="font-bold text-gray-200">
                      {turn === "w" ? "White" : "Black"}
                    </span>
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-green-600">
                  <p className="text-lg font-bold text-green-200 mb-2 text-center">
                    Share this Game ID:
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <code className="bg-gray-800 text-gray-200 p-2 rounded-md select-all text-sm break-all font-mono">
                      {gameId}
                    </code>
                    <button
                      onClick={copyGameIdToClipboard}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors duration-200 text-sm mt-2 sm:mt-0"
                    >
                      {copyStatus || "Copy ID"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 text-center">
                    Your friend can use this ID to join your game.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col p-4 ">
            <div className="flex flex-col  gap-6">
              {" "}
              <div className="flex flex-col gap-4 justify-evenly mt-4 md:mt-0">
                <button
                  onClick={createNewGame}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md transition duration-300 ease-in-out"
                  disabled={!userId}
                >
                  Create New Game
                </button>
                <button
                  onClick={joinExistingGame}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md transition duration-300 ease-in-out"
                  disabled={!userId}
                >
                  Join Existing Game
                </button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div>
            {message && (
              <p className="text-xl font-bold mt-8 text-green-500">{message}</p>
            )}
            {captureMessage && (
              <p className="text-2xl font-bold mt-2 mb-4 text-yellow-600 animate-bounce-in">
                {captureMessage}
              </p>
            )}
            <div className="flex mt-4 gap-8">
              <div className="flex flex-col gap-2">
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
                          gameId
                            ? "Type your message..."
                            : "Join a game to chat..."
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
            {showRematchModal && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center flex flex-col gap-4">
                  <h2 className="text-3xl font-bold text-gray-500 mb-4">
                    Game Over!
                  </h2>
                  <p className="text-2xl font-bold mb-6 text-gray-950">
                    {gameOverMessage}
                  </p>

                  <div className="flex flex-col gap-4">
                    <button
                      onClick={handleRematchRequest}
                      className="bg-green-400 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                      Request Rematch
                    </button>
                    <button
                      onClick={handleGoHomeFromModal}
                      className="bg-gray-600 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessGame;
