// src/services/socket.js
import { io } from "socket.io-client";
import { useEffect, useState, useRef } from "react";

export const useSocket = (token) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    // connect to backend
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
    });

    socketRef.current.on("connect", () => setIsConnected(true));
    socketRef.current.on("disconnect", () => setIsConnected(false));

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // subscribe to new messages
  const subscribeToMessages = (callback) => {
    if (!socketRef.current) return;
    socketRef.current.on("receive_message", callback);
    return () => socketRef.current.off("receive_message", callback);
  };

  // subscribe to notifications
  const subscribeToNotifications = (callback) => {
    if (!socketRef.current) return;
    socketRef.current.on("receive_notification", callback);
    return () =>
      socketRef.current.off("receive_notification", callback);
  };

  // send a message
  const sendMessage = (msg) => {
    if (socketRef.current) {
      socketRef.current.emit("send_message", msg);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    subscribeToMessages,
    subscribeToNotifications,
    sendMessage,
  };
};
