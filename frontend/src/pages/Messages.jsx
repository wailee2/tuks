import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMessages, sendMessage, markMessagesRead } from '../services/message';
import { initSocket, subscribe } from '../services/socket';

export default function Messages({ chatUser }) {
  // chatUser = username of the person you’re chatting with
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  // Fetch messages with this user
  useEffect(() => {
    if (!chatUser) return;
    let mounted = true;
    setLoading(true);

    getMessages(chatUser, { limit: 50, page: 0 })
      .then((data) => {
        if (!mounted) return;
        setMessages(Array.isArray(data) ? data : data.messages || []);
      })
      .finally(() => mounted && setLoading(false));

    // Mark as read when opening chat
    markMessagesRead(chatUser).catch(() => {});

    return () => {
      mounted = false;
    };
  }, [chatUser]);

  // Socket for real-time updates
  useEffect(() => {
    if (!token) return;
    initSocket(token);

    const off = subscribe('message:received', (msg) => {
      if (!msg) return;
      if (
        (msg.fromUsername === chatUser && msg.toUsername === user?.username) ||
        (msg.toUsername === chatUser && msg.fromUsername === user?.username)
      ) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    });

    return () => off();
  }, [chatUser, token, user?.username]);

  useEffect(() => scrollToBottom(), [messages]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !chatUser) return;

    const payload = { toUsername: chatUser, content: text.trim() };

    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      content: text,
      fromUsername: user?.username || 'You',
      toUsername: chatUser,
      pending: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((p) => [...p, tempMsg]);
    setText('');
    scrollToBottom();

    try {
      const saved = await sendMessage(payload);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, failed: true } : m))
      );
      console.error('Send message failed', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto border rounded-lg p-4 bg-white">
      <div className="h-96 overflow-y-auto mb-3" aria-live="polite">
        {loading ? (
          <div className="text-center text-sm text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-gray-500">No messages yet</div>
        ) : (
          messages.map((m) => (
            <div key={m.id || m._id} className="mb-2">
              <div className="text-sm">
                <span className="font-semibold mr-2">
                  {m.fromUsername === user?.username ? 'You' : m.fromUsername}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div
                className={`py-2 px-3 rounded ${
                  m.pending ? 'opacity-60 italic' : ''
                } bg-gray-100 inline-block`}
              >
                {m.content}
                {m.failed && <span className="text-red-500 ml-2">(failed)</span>}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${chatUser}...`}
          className="flex-1 border rounded px-3 py-2"
        />
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
          Send
        </button>
      </form>
    </div>
  );
}
