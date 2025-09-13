import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSocket, sendMessageSocket, subscribeToMessages } from '../services/socket';

export default function Messages({ recipientId }) {
  const { user } = useContext(AuthContext);
  const socket = useSocket(user?.id);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      // Only add messages between current user and recipient
      if (
        (msg.sender_id === user.id && msg.receiver_id === recipientId) ||
        (msg.sender_id === recipientId && msg.receiver_id === user.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    subscribeToMessages(socket, handleMessage);

    return () => {
      socket.off('receive_message', handleMessage);
    };
  }, [socket, user.id, recipientId]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const msgData = {
      sender_id: user.id,
      receiver_id: recipientId,
      content: newMessage,
    };

    sendMessageSocket(socket, user.id, recipientId, newMessage);
    setMessages((prev) => [...prev, msgData]);
    setNewMessage('');
  };

  return (
    <div className="p-4 border rounded max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Chat</h2>

      <div className="mb-4 h-64 overflow-y-auto border p-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 p-2 rounded ${
              msg.sender_id === user.id ? 'bg-green-200 text-right' : 'bg-gray-200 text-left'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
