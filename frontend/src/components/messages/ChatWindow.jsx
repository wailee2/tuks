// src/components/messages/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import Composer from './Composer';

/**
 * ChatWindow shows the messages for a selected user.
 * If no selectedUser -> shows a call-to-action to start a chat.
 *
 * Props:
 * - user: current logged in user object
 * - selectedUser: { id, username, name } or null
 * - messages: array
 * - loading: boolean
 * - onSend(content)
 * - onEdit(messageId, newText)
 * - onDelete(messageId)
 * - onFocusSearch() - focuses the sidebar search
 */
export default function ChatWindow({ user, selectedUser, messages = [], loading, onSend, onEdit, onDelete, onFocusSearch }) {
  const [editing, setEditing] = useState(null);
  const listRef = useRef();

  // scroll to bottom when messages change
  useEffect(() => {
    listRef.current?.scrollTo?.({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  if (!selectedUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Send a message to start chat</h2>
          <p className="text-gray-500 mt-2">Find someone using the search on the left.</p>
          <button
            onClick={() => onFocusSearch && onFocusSearch()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Start a chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="p-3 border-b flex items-center justify-between">
        <div>
          <div className="font-semibold">{selectedUser.name || selectedUser.username}</div>
          <div className="text-xs text-gray-500">@{selectedUser.username}</div>
        </div>
        {/* placeholder for settings like block/allow */}
        <div>
          <button className="text-sm text-gray-600">⋯</button>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="text-sm text-gray-500">Loading messages...</div>}
        {messages.map((m) => (
          <MessageItem
            key={m.id}
            message={m}
            mine={String(m.sender_id) === String(user?.id)}
            onEdit={(newText) => onEdit(m.id, newText)}
            onDelete={() => onDelete(m.id)}
          />
        ))}
      </div>

      <div className="p-3 border-t">
        <Composer onSend={onSend} />
      </div>
    </div>
  );
}
