// src/pages/Notifications.jsx
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../services/socket";

export default function Notifications() {
  const { token } = useContext(AuthContext);
  const { subscribeToNotifications } = useSocket(token);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!token) return;

    const unsubscribe = subscribeToNotifications((notif) => {
      setNotifications((prev) => [...prev, notif]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token, subscribeToNotifications]);

  return (
    <div className="p-4">
      <h2 className="font-bold mb-2">Notifications</h2>
      {notifications.length > 0 ? (
        notifications.map((n, idx) => (
          <div
            key={idx}
            className="p-2 my-1 bg-blue-100 border rounded"
          >
            {n.message}
          </div>
        ))
      ) : (
        <p className="text-gray-500">No notifications yet</p>
      )}
    </div>
  );
}
