"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
export default function Home() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [opponentMove, setOpponentMove] = useState(null);
  const [playerJoinedMessage, setPlayerJoinedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const gameId = "your-game-room-id";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const newSocket = io("http://localhost:5000");

      newSocket.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to Socket.IO server:", newSocket.id);
        newSocket.emit("joinGame", gameId);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
        console.log("Disconnected from Socket.IO server");
      });

      newSocket.on("connect_error", (error) => {
        console.error("Connection Error:", error);
      });

      newSocket.on("opponentMove", (move) => {
        console.log("Opponent made a move:", move);
        setOpponentMove(move);
      });

      newSocket.on("playerJoined", (playerId) => {
        console.log("Player joined the game:", playerId);
        setPlayerJoinedMessage(`Player ${playerId} joined the room.`);
      });

      newSocket.on("newMessage", (data) => {
        console.log("New chat message:", data);
        setNewMessage(data);
        setMessages((prevMessages) => [...prevMessages, data]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("connect_error");
        newSocket.off("opponentMove");
        newSocket.off("playerJoined");
        newSocket.off("newMessage");
        newSocket.disconnect();
      };
    }
  }, [gameId]);

  const sendMove = (from, to) => {
    if (socket && isConnected) {
      const moveData = { from, to };
      console.log("Emitting makeMove:", moveData);
      socket.emit("makeMove", moveData);
    }
  };

  const handleSendMessage = () => {
    if (socket && isConnected && chatInput.trim()) {
      console.log("Emitting chatMessage:", chatInput);
      socket.emit("chatMessage", chatInput);
      setChatInput("");
    }
  };

  return (
    <div>
      <h1>Next.js Chess App</h1>
      {isConnected ? (
        <p>Connected to Socket.IO server</p>
      ) : (
        <p>Not connected to Socket.IO server</p>
      )}

      {opponentMove && <p>Opponent's move: {JSON.stringify(opponentMove)}</p>}
      {playerJoinedMessage && <p>{playerJoinedMessage}</p>}
      {newMessage && (
        <p>
          New message: {newMessage.sender} - {newMessage.message}
        </p>
      )}

      <div>
        <h2>Chat</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.sender}:</strong> {msg.message}
            </li>
          ))}
        </ul>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <button onClick={() => sendMove("a2", "a4")}>Send Test Move</button>
    </div>
  );
}
