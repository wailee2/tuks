import { useEffect, useState, useRef, useContext } from 'react';
import { useSocket } from '../services/socket';
import { AuthContext } from '../context/AuthContext';
import { getConversationAPI, sendMessageAPI } from '../services/message';

export default function Messages({ chatUserId, chatUserName }) {
  const { user, token } = useContext(AuthContext);
  const { socket, subscribeToMessages, send } = useSocket(user?.id, token);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  // helper to scroll to bottom
  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: 'smooth' });

  // load persisted conversation when chatUserId changes
  useEffect(() => {
    if (!chatUserId || !user) {
      setMessages([]);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const data = await getConversationAPI(chatUserId);
        if (!mounted) return;
        setMessages(data || []);
        scrollToBottom();
      } catch (err) {
        console.error('Failed to load conversation', err);
      }
    };
    load();

    return () => { mounted = false; };
  }, [chatUserId, user]);

  // subscribe to real-time incoming messages (socket)
  useEffect(() => {
    if (!socket) return;
    // handler receives a saved message object from server
    const handler = (msg) => {
      // only append messages that belong to this conversation
      if (
        (msg.sender_id === user.id && msg.receiver_id === Number(chatUserId)) ||
        (msg.sender_id === Number(chatUserId) && msg.receiver_id === user.id)
      ) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };

    const unsub = subscribeToMessages(handler);
    // subscribeToMessages returns unsubscribe function (our hook provides that)
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [socket, subscribeToMessages, chatUserId, user]);

  // send message: call REST to persist; server will emit to receiver (and may emit to sender via socket helper)
  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    try {
      // persist via API (this returns the saved message)
      const saved = await sendMessageAPI(chatUserId, text); // { id, sender_id, receiver_id, content, created_at }
      // show locally (server may not emit to sender for REST path)
      setMessages((prev) => [...prev, saved]);
      setInput('');
      scrollToBottom();

      // optionally also emit via socket if you prefer socket-first flow:
      // send('send_message', { sender_id: user.id, receiver_id: Number(chatUserId), content: text });
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{chatUserName ?? `Chat with ${chatUserId}`}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 border rounded bg-white">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500">No messages yet. Say hi 👋</div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id ?? `${m.sender_id}-${m.receiver_id}-${m.created_at}`}
              className={`max-w-[80%] p-2 rounded ${
                m.sender_id === user.id ? 'bg-green-200 self-end ml-auto text-right' : 'bg-gray-200 self-start mr-auto text-left'
              }`}
            >
              <div>{m.content}</div>
              <div className="text-xs text-gray-600 mt-1">{new Date(m.created_at).toLocaleString()}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
