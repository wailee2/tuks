// src/components/messages/Composer.jsx
import React, { useState } from 'react';

export default function Composer({ onSend }) {
  const [text, setText] = useState('');

  async function submit(e) {
    e?.preventDefault();
    if (!text.trim()) return;
    await onSend(text.trim());
    setText('');
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Message..."
        className="flex-1 p-2 border rounded focus:outline-none"
      />
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
    </form>
  );
}
