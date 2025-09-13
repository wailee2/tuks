import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const s = io(SOCKET_URL);
    s.emit('join', userId); // Join a private room with your userId
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [userId]);

  return socket;
};

export const sendMessageSocket = (socket, senderId, receiverId, content) => {
  if (!socket) return;
  socket.emit('send_message', { sender_id: senderId, receiver_id: receiverId, content });
};

export const subscribeToMessages = (socket, callback) => {
  if (!socket) return;
  socket.on('receive_message', callback);
};
