import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getNotifications, markAsRead, markAllRead } from '../services/notification';
import { initSocket, subscribe } from '../services/socket';

export default function Notifications({ pageSize = 20 }) {
  const { token } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getNotifications({ page: 0, limit: pageSize })
      .then((res) => {
        const items = res?.notifications ?? res?.items ?? res ?? [];
        if (mounted) setNotifications(items);
      })
      .catch((err) => console.error('Failed to load notifications', err))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [pageSize]);

  useEffect(() => {
    if (!token) return;
    initSocket(token);

    const off = subscribe('notification', (n) => {
      if (!n) return;
      setNotifications((prev) => [n, ...prev]);
    });

    return () => off();
  }, [token]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error('Mark as read failed', e);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error('Mark all read failed', e);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="relative px-3 py-2"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-red-600 text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border rounded shadow-lg z-50">
          <div className="p-2 border-b flex justify-between items-center">
            <span className="font-semibold">Notifications</span>
            <button onClick={handleMarkAll} className="text-sm text-gray-500">
              Mark all read
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-sm text-gray-500">You're all caught up</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 mb-2 rounded ${n.read ? 'bg-gray-50' : 'bg-white shadow-sm'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">
                        {n.title ?? n.message ?? 'Notification'}
                      </div>
                      {n.body && <div className="text-xs text-gray-600 mt-1">{n.body}</div>}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(n.createdAt ?? n.created_at ?? Date.now()).toLocaleString()}
                      </div>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="ml-4 text-xs text-blue-600"
                      >
                        Mark
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
