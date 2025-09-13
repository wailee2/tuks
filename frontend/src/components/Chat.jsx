import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getConversationAPI, sendMessageAPI } from '../services/message';
import { connectSocket, sendMessageSocket, subscribeToMessages } from '../services/socket';

export default function Chat({ otherUserId }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const loadMessages = async () => {
      const res = await getConversationAPI(otherUserId);
      setMessages(res.data);
    };
    loadMessages();

    const socket = connectSocket(user.id);
    subscribeToMessages((msg) => {
      if (msg.sender_id === otherUserId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
  }, [otherUserId]);

  const handleSend = async () => {
    if (!text) return;
    await sendMessageAPI(otherUserId, text);
    sendMessageSocket(user.id, otherUserId, text);
    setMessages([...messages, { sender_id: user.id, receiver_id: otherUserId, content: text }]);
    setText('');
  };

  return (
    <div className="p-4 border rounded max-w-md">
      <div className="h-64 overflow-y-auto border-b mb-2 p-2">
        {messages.map((m, idx) => (
          <div key={idx} className={m.sender_id === user.id ? 'text-right' : 'text-left'}>
            <span className={`p-1 rounded ${m.sender_id === user.id ? 'bg-green-200' : 'bg-gray-200'}`}>
              {m.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 p-2 border rounded" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
