// components/ToastContainer.jsx
import React from 'react';
import { useToasts } from '../context/ToastContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useToasts();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`max-w-sm px-4 py-2 rounded shadow text-sm ${
            t.type === 'error' ? 'bg-red-600 text-white' :
            t.type === 'success' ? 'bg-green-600 text-white' :
            'bg-gray-800 text-white'
          }`}
        >
          <div className="flex justify-between items-start gap-2">
            <div>{t.message}</div>
            <button onClick={() => removeToast(t.id)} className="ml-2 opacity-80">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
