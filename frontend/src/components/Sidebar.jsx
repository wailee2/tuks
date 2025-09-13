import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useContext(AuthContext);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Orders', path: '/orders' },
    { name: 'Feed', path: '/feed' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Marketplace', path: '/marketplace' },
    // Only visible to admins
    ...(user?.role === 'ADMIN'
      ? [{ name: 'Admin Users', path: '/admin/users' }]
      : [])
  ];

  return (
    <aside className="w-64 bg-gray-100 h-screen p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-6">Tuks</h2>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded hover:bg-green-200 transition ${
                isActive ? 'bg-green-500 text-white' : 'text-gray-700'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
