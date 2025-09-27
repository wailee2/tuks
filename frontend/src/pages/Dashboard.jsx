import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Gritty from '@/components/Gritty'


export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return <p>Please login</p>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-6">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </header>
        <Gritty />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Role: {user.role}</h2>
          <p className="text-gray-600">
            This is your main dashboard. You can navigate using the sidebar.
          </p>

          {user.role === 'MODERATOR' && (
            <p className="text-blue-600 font-medium">
              You have moderator privileges.
            </p>
          )}
          {user.role === 'SUPPORT' && (
            <p className="text-purple-600 font-medium">
              You have support privileges.
            </p>
          )}
          {user.role === 'ANALYST' && (
            <p className="text-yellow-600 font-medium">
              You have analyst privileges.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
