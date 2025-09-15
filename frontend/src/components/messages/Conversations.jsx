// src/components/messages/Conversations.jsx
import React from 'react';

export default function Conversations({ convos = [], onSelectUser }) {
  if (!convos || convos.length === 0) {
    return <div className="text-sm text-gray-500">No recent conversations</div>;
  }

  return (
    <div>
      {convos.map((c) => (
        <div
          key={c.id}
          className="p-2 flex items-center gap-3 hover:bg-gray-100 cursor-pointer rounded"
          onClick={() => onSelectUser(c)}
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">{(c.name || c.username || 'U')[0]}</div>
          <div className="flex-1">
            <div className="font-medium">{c.name || c.username}</div>
            <div className="text-xs text-gray-500">@{c.username}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
