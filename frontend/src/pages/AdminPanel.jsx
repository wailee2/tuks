// pages/AdminPanel.jsx
import { useEffect, useState } from "react";
import API from "../services/api.js";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const roles = ["owner", "support", "moderator", "analyst", "user"];

  const loadUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await API.patch(`/users/${userId}`, { role });
      loadUsers();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Admin Panel</h1>
    </div>
  );
}
