// Notifications.jsx
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../services/socket'; // use the hook, not a socket export

export default function Notifications() {
  const { token } = useContext(AuthContext);
  const { socket } = useSocket(token); // connect socket using the hook
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      setNotifications((prev) => [data, ...prev]);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Notifications</h2>
      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <ul>
          {notifications.map((n, i) => (
            <li key={i} className="border-b py-1">{n.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
