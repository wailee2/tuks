// src/pages/Messages.jsx
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../services/socket";
import { sendMessage as sendMessageAPI } from "../services/message";

export default function Messages() {
  const { user, token } = useContext(AuthContext);
  const {
    isConnected,
    subscribeToMessages,
    sendMessage,
  } = useSocket(token);

  const [chatUserId, setChatUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // listen for incoming messages
  useEffect(() => {
    if (!token) return;

    const unsubscribe = subscribeToMessages((msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token, subscribeToMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatUserId) return;

    const msg = {
      sender_id: user.id,
      receiver_id: parseInt(chatUserId),
      content: newMessage,
    };

    sendMessage(msg); // real-time via socket
    await sendMessageAPI(msg, token); // persist to DB

    setMessages((prev) => [...prev, { ...msg, self: true }]);
    setNewMessage("");
  };

  return (
    <div className="p-4 flex flex-col h-screen">
      <div className="mb-4">
        <label className="block text-sm font-medium">
          Chat with User ID:
        </label>
        <input
          type="text"
          value={chatUserId}
          onChange={(e) => setChatUserId(e.target.value)}
          className="border p-2 rounded w-full"
          placeholder="Enter user ID"
        />
      </div>

      <div className="flex-1 border rounded p-2 overflow-y-auto mb-4 bg-gray-50">
        {messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 my-1 rounded ${
                msg.sender_id === user.id
                  ? "bg-green-200 text-right"
                  : "bg-gray-200 text-left"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-xs text-gray-500">
                From: {msg.sender_id} → To: {msg.receiver_id}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Select a user to start chatting</p>
        )}
      </div>

      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border p-2 rounded-l"
        />
        <button
          onClick={handleSendMessage}
          className="bg-green-500 text-white px-4 rounded-r"
        >
          Send
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Socket: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
      </p>
    </div>
  );
}
