// src/components/Messages.jsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { initSocket, subscribe } from '../services/socket';
import { sendMessage, fetchMessages, searchUsers, markRead, editMessage, deleteMessage } from '../services/messages';

import Sidebar from '../components/messages/Sidebar';
import ChatWindow from '../components/messages/ChatWindow';

export default function Messages() {
  const { user, token } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null); // { id, username, name }
  const [messages, setMessages] = useState([]);
  const [convos, setConvos] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const sidebarSearchRef = useRef(null);

  // --- Subscribe socket once (not per selectedUser) ---
  useEffect(() => {
    if (!token) return;
    const s = initSocket(token);

    const unsubMsg = subscribe('private_message', (msg) => {
      setMessages((prev) => {
        // prevent duplicates
        if (prev.some((m) => String(m.id) === String(msg.id))) return prev;

        // only append if msg is part of current chat
        if (!selectedUser) return prev;
        const participants = [msg.sender_id, msg.receiver_id].map(String);
        if (participants.includes(String(selectedUser.id))) {
          return [...prev, msg];
        }
        return prev;
      });
    });

    const unsubNotif = subscribe('notification', (n) => {
      console.log('notification', n);
    });

    return () => {
      unsubMsg();
      unsubNotif();
    };
  }, [token, selectedUser]); // keep selectedUser so filtering still works

  // --- Load conversation when selectedUser changes ---
  useEffect(() => {
    if (!selectedUser || !selectedUser.username) return;
    let cancelled = false;

    async function load() {
      setLoadingMessages(true);
      try {
        const resp = await fetchMessages(selectedUser.username, { limit: 200, page: 0 });
        const msgs = resp?.messages ?? [];
        if (!cancelled) {
          // dedupe by id
          const uniqueMsgs = Array.from(new Map(msgs.map((m) => [String(m.id), m])).values());
          setMessages(uniqueMsgs);
          try {
            await markRead(selectedUser.username);
          } catch (e) {
            console.warn('markRead failed', e);
          }
        }
      } catch (err) {
        console.error('Failed to load messages', err, err?.response?.status, err?.response?.data);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  // --- Focus searchbar from main panel ---
  function focusSearch() {
    sidebarSearchRef.current?.focus?.();
  }

  // --- When a user is selected from sidebar ---
  function handleSelectUser(userObj) {
    setSelectedUser(userObj);
    setConvos((prev) => {
      const exists = prev.find((p) => String(p.id) === String(userObj.id));
      if (exists) return prev;
      return [userObj, ...prev].slice(0, 50);
    });
  }

  // --- Handle sending message ---
  async function handleSend(content) {
    if (!selectedUser) return;
    try {
      await sendMessage(selectedUser.username, content);
      // ⛔ don’t append manually — socket will push it
    } catch (err) {
      console.error('send failed', err);
    }
  }

  // --- Edit & Delete handlers ---
  async function handleEditMessage(messageId, newText) {
    try {
      await editMessage(messageId, newText);
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(messageId) ? { ...m, content: newText, edited: true } : m
        )
      );
    } catch (err) {
      console.error('edit failed', err);
    }
  }

  async function handleDeleteMessage(messageId) {
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(messageId)));
    } catch (err) {
      console.error('delete failed', err);
    }
  }

  return (
    <div className="h-full min-h-screen flex bg-gray-50">
      <Sidebar
        onSelectUser={handleSelectUser}
        searchRef={sidebarSearchRef}
        onStartChatFocus={focusSearch}
        convos={convos}
        fetchUserSearch={searchUsers}
      />
      <main className="flex-1 p-4">
        <ChatWindow
          user={user}
          selectedUser={selectedUser}
          messages={messages}
          loading={loadingMessages}
          onSend={handleSend}
          onEdit={handleEditMessage}
          onDelete={handleDeleteMessage}
          onFocusSearch={focusSearch}
        />
      </main>
    </div>
  );
}
