import { useEffect, useRef } from "react";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "https://team-2-chess-app.onrender.com";

const socket = io(SOCKET_SERVER_URL, {
  autoConnect: false,
});

const useSocket = () => {
  const isConnected = useRef(false);

  useEffect(() => {
    if (!isConnected.current) {
      socket.connect();
      isConnected.current = true;
      console.log("Socket connected");
    }

    const handleConnect = () => console.log("Socket reconnected");
    const handleDisconnect = () => {
      console.log("Socket disconnected");
      isConnected.current = false;
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return socket;
};

export { useSocket, socket };
