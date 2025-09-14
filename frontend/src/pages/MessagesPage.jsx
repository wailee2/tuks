// src/pages/MessagesPage.jsx
import React, { useState } from "react";
import ChatList from "./ChatList";
import Messages from "./Messages";

export default function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState(null);

  // TODO: Replace with your real user list from API
  const dummyUsers = [
    { username: "prime" },
    { username: "guy2" },
    { username: "charlie" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <ChatList users={dummyUsers} onSelect={setSelectedUser} />

      {/* Chat window */}
      <div className="flex-1 p-4">
        {selectedUser ? (
          <Messages chatUser={selectedUser} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
