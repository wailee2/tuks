import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllUsers, updateUserRole } from '../services/admin.js';
import Sidebar from '../components/Sidebar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { paginate } from '../utils/pagination.js';

const roleColors = {
  USER: 'bg-gray-200 text-gray-800',
  MODERATOR: 'bg-blue-200 text-blue-800',
  SUPPORT: 'bg-purple-200 text-purple-800',
  ANALYST: 'bg-yellow-200 text-yellow-800',
  ADMIN: 'bg-red-200 text-red-800'
};

export default function AdminUsers() {
  const { user, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Dynamic page size

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchUsers();
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          u =>
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            u.role.toLowerCase().includes(term)
        )
      );
    }
    setCurrentPage(1); // reset to first page on search
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers(token);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(token, userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (!user || user.role !== 'ADMIN')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-bold">Access Denied</p>
      </div>
    );

  const paginatedUsers = paginate(filteredUsers, currentPage, pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-4">Admin User Management</h1>

        {/* Search + Page Size SELECT * FROM products; */} 
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <SearchBar 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or role"
          />
          <div className="flex items-center gap-2">
            <label className="font-medium">Users per page:</label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border px-2 py-1 rounded"
            >
              {[1, 5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map(u => (
                    <tr key={u.id}>
                      <td className="px-4 py-2">{u.id}</td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${roleColors[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {u.id !== user.id && (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="border px-2 py-1 rounded text-sm"
                          >
                            {['USER', 'MODERATOR', 'SUPPORT', 'ANALYST', 'ADMIN'].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 items-center gap-2 flex-wrap">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
