// src/components/ChatList.jsx
import React from "react";

export default function ChatList({ users, onSelect }) {
  return (
    <div className="w-64 border-r h-full overflow-y-auto">
      <h2 className="p-4 font-bold border-b">Chats</h2>
      <ul>
        {users.map((u) => (
          <li
            key={u.username}
            onClick={() => onSelect(u.username)}
            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
          >
            {u.username}
          </li>
        ))}
      </ul>
    </div>
  );
}
