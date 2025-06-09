"use client";

import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Link from "next/link";

const Header = () => {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("jwtToken");
    const storedUsername = localStorage.getItem("username");

    if (storedUsername && storedUserId && storedToken && !socket.connected) {
      setUserId(storedUserId);
      setUsername(storedUsername);
      socket.auth = { token: storedToken };
      socket.connect();
    }
    // else {
    //   setMessage("Please log in to play chess.");
    // }

    // const handleConnect = () => {
    //   console.log("Socket connected:", socket.id);
    //   setMessage(
    //     userId
    //       ? `Welcome, ${username}! Socket connected.`
    //       : "Socket connected (unauthenticated)."
    //   );
    // };
    // const handleDisconnect = () => {
    //   console.log("Socket disconnected");
    //   setMessage("Socket disconnected.");
    // };
    // const handleAuthError = (data) => {
    //   console.error("Authentication Error:", data.message);
    //   setMessage(`Authentication Error: ${data.message}. Please log in again.`);
    //   localStorage.clear();
    // };

    // socket.on("connect", handleConnect);
    // socket.on("disconnect", handleDisconnect);
    // socket.on("connect_error", handleAuthError);

    return () => {
      //   socket.off("connect", handleConnect);
      //   socket.off("disconnect", handleDisconnect);
      //   socket.off("connect_error", handleAuthError);
      socket.disconnect();
    };
  }, [userId, username]);

  return (
    <div className="text-xl w-full text-white bg-gray-500 py-4 px-8 flex justify-between items-center absolute top-0">
      <Link href={"/"} className="text-3xl font-medium">
        Ultimate Chess
      </Link>
      {username ? (
        // <p>
        //   Logged in as: <span className="font-semibold">{username}</span> (ID:
        //   {userId})
        // </p>
        <p>{username}</p>
      ) : (
        <p className="flex items-center gap-8">
          <a
            href="/login"
            className="bg-white text-black font-semibold rounded-none py-2 px-4 hover:opacity-75"
          >
            Log In
          </a>
          <a
            href="/signup"
            className="bg-white text-black font-semibold rounded-none py-2 px-4 hover:opacity-75"
          >
            Sign Up
          </a>
        </p>
      )}
    </div>
  );
};

export default Header;
