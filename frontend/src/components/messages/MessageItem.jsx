// src/components/messages/MessageItem.jsx
import React, { useState } from 'react';

/**
 * Simple message bubble. Supports edit/delete and shows 'edited' badge.
 * Props:
 * - message: { id, sender_id, receiver_id, content, created_at, edited? }
 * - mine: boolean
 * - onEdit(newText)
 * - onDelete()
 */
export default function MessageItem({ message, mine, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  function save() {
    if (draft.trim() && draft !== message.content) {
      onEdit(draft);
    }
    setIsEditing(false);
  }

  function cancel() {
    setDraft(message.content);
    setIsEditing(false);
  }

  return (
    <div className={`max-w-[70%] p-3 rounded ${mine ? 'ml-auto bg-blue-600 text-white' : 'bg-white border'}`}>
      {!isEditing ? (
        <>
          <div className="whitespace-pre-wrap">{message.content}</div>
          <div className="text-xs mt-2 flex items-center justify-between text-gray-300">
            <div>{new Date(message.created_at).toLocaleString()}</div>
            <div className="flex items-center gap-2">
              {message.edited && <span className="text-xs italic">edited</span>}
              {mine && (
                <>
                  <button className="text-xs underline" onClick={() => setIsEditing(true)}>Edit</button>
                  <button className="text-xs underline text-red-400" onClick={() => onDelete(message.id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full p-2 rounded border"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={save}>Save</button>
            <button className="px-3 py-1 border rounded" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
