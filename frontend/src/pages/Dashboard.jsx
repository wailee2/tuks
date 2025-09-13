import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
//import Navbar from '../components/Navbar';
//import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar 
      <Sidebar role={user.role} />*/}

      <div className="flex-1 flex flex-col">
        {/* Navbar 
        <Navbar user={user} onLogout={logout} />*/}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-3xl font-bold mb-4">Welcome, {user.name}!</h1>

          {/* Dashboard widgets (placeholder) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Inventory</h2>
              <p>Manage your products and stock levels.</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Orders</h2>
              <p>Track orders, history, and delivery status.</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Analytics</h2>
              <p>View sales trends and inventory insights.</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Feed</h2>
              <p>See posts, comments, and likes from users.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
