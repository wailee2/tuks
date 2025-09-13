// src/pages/Notifications.jsx
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../services/socket';
import { markNotificationRead as apiMarkRead, fetchNotifications } from '../services/notification'; // optional

export default function Notifications({ onNotificationClick } = {}) {
  const { user } = useContext(AuthContext);
  const { socket, subscribeToNotifications } = useSocket(user?.id);
  const [notifications, setNotifications] = useState([]);

  // load persisted notifications from backend on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await fetchNotifications(); // implement in services/notification
        setNotifications(data);
      } catch (err) {
        // ignore and continue
        console.error('Failed to fetch notifications', err);
      }
    };
    load();
  }, [user?.id]);

  // subscribe to real-time notifications
  useEffect(() => {
    if (!socket) return;
    const handler = (n) => {
      // server should send { type, content, data }
      setNotifications((prev) => [n, ...prev]);
    };
    const unsubscribe = subscribeToNotifications(handler);
    return () => {
      unsubscribe();
    };
  }, [socket, subscribeToNotifications]);

  const handleClick = async (n) => {
    // optional: mark read in backend
    try {
      await apiMarkRead(n.id);
    } catch (err) {
      // ignore
    }
    // remove or mark read locally
    setNotifications((prev) => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    if (onNotificationClick) onNotificationClick(n);
  };

  return (
    <div className="fixed top-4 right-4 w-80 flex flex-col gap-2 z-50">
      {notifications.length === 0 ? (
        <div className="bg-white p-2 rounded shadow">No notifications</div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id ?? `${n.type}-${n.created_at}`}
            onClick={() => handleClick(n)}
            className={`p-3 rounded shadow cursor-pointer ${n.read ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}
          >
            <div className="text-sm font-medium">{n.type}</div>
            <div className="text-sm">{n.content}</div>
          </div>
        ))
      )}
    </div>
  );
}
