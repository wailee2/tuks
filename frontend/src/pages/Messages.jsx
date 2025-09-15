// src/components/Messages.jsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { initSocket, disconnectSocket, subscribe, getSocket } from '../services/socket';
import { sendMessage, fetchMessages, searchUsers, markRead, editMessage, deleteMessage } from '../services/messages';

import Sidebar from '../components/messages/Sidebar';
import ChatWindow from '../components/messages/ChatWindow';

/**
 * Messages page — main layout: Sidebar + Main chat area.
 * It uses AuthContext (you requested this).
 */
export default function Messages() {
  const { user, token } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null); // { id, username, name }
  const [messages, setMessages] = useState([]); // current conversation
  const [convos, setConvos] = useState([]); // previousconversations, simple local list
  const [loadingMessages, setLoadingMessages] = useState(false);

  // ref for sidebar search input focus control
  const sidebarSearchRef = useRef(null);

  // initialize socket when token available
  useEffect(() => {
    if (!token) return;
    const s = initSocket(token);

    // subscribe to private messages
    const unsubMsg = subscribe('private_message', (msg) => {
      // when server pushes new message, if it's for or from current selectedUser, update UI
      setMessages((prev) => {
        if (!selectedUser) return prev;
        // msg has sender_id, receiver_id etc.
        const participantIds = [msg.sender_id, msg.receiver_id].map(String);
        const selectedId = String(selectedUser.id);
        if (participantIds.includes(selectedId)) {
          return [...prev, msg];
        }
        return prev;
      });
      // optionally update convo list / play sound
    });

    const unsubNotif = subscribe('notification', (n) => {
      // could update notification dropdown - left as an exercise
      console.log('notification', n);
    });

    return () => {
      unsubMsg();
      unsubNotif();
      // keep socket open if you want global socket; if you want to close:
      // disconnectSocket();
    };
  }, [token, selectedUser]);

  // load conversation when selectedUser changes
  useEffect(() => {
    if (!selectedUser) return;
    let cancelled = false;
    async function load() {
      setLoadingMessages(true);
      try {
        const { messages: msgs } = await fetchMessages(selectedUser.username, { limit: 200, page: 0 });
        if (!cancelled) {
          setMessages(msgs);
          await markRead(selectedUser.username); // mark read when opened
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, [selectedUser]);

  // when "Send a message to start chat" pressed -> focus sidebar searchbar
  function focusSearch() {
    sidebarSearchRef.current?.focus?.();
  }

  // handler when user selected in sidebar
  function handleSelectUser(userObj) {
    setSelectedUser(userObj);
    // optionally update recent convos
    setConvos((prev) => {
      const exists = prev.find((p) => String(p.id) === String(userObj.id));
      if (exists) return prev;
      return [userObj, ...prev].slice(0, 50);
    });
  }

  // handle sending message (from ChatWindow)
  async function handleSend(content) {
    if (!selectedUser) return;
    try {
      const res = await sendMessage(selectedUser.username, content);
      // server will broadcast message; optimistically append
      if (res?.message) setMessages((m) => [...m, res.message]);
    } catch (err) {
      console.error('send failed', err);
      // TODO: show UI error / retry
    }
  }

  // handlers for edit/delete (call API then update local state)
  async function handleEditMessage(messageId, newText) {
    try {
      await editMessage(messageId, newText);
      setMessages((prev) => prev.map((m) => (String(m.id) === String(messageId) ? { ...m, content: newText, edited: true } : m)));
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
