import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getNotificationsAPI, markNotificationReadAPI } from '../services/message';

export default function Notifications() {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    const res = await getNotificationsAPI();
    setNotifications(res.data);
  };

  const markRead = async (id) => {
    await markNotificationReadAPI(id);
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  useEffect(() => { loadNotifications(); }, []);

  return (
    <div className="p-4 border rounded max-w-md">
      <h2 className="font-bold mb-2">Notifications</h2>
      {notifications.length === 0 && <p>No notifications</p>}
      {notifications.map(n => (
        <div key={n.id} className={`p-2 mb-1 ${n.read ? 'bg-gray-200' : 'bg-green-200'}`}>
          <p>{n.message}</p>
          {!n.read && <button onClick={() => markRead(n.id)} className="text-sm underline">Mark as read</button>}
        </div>
      ))}
    </div>
  );
}
