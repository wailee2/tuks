// pages/ManageUsers.jsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllUsers, updateUserRole, disableUser } from '../services/admin.js';
import SearchBar from '../components/SearchBar.jsx';
import { paginate } from '../utils/pagination.js';
import { useToasts } from '../context/ToastContext';
import LoadingSpinner from "../components/LoadingSpinner";
import { EllipsisVertical } from "lucide-react";

const roleColors = {
  USER: 'bg-gray-200 text-gray-800',
  MODERATOR: 'bg-blue-200 text-blue-800',
  SUPPORT: 'bg-purple-200 text-purple-800',
  ANALYST: 'bg-yellow-200 text-yellow-800',
  ADMIN: 'bg-red-200 text-red-800'
};

export default function ManageUsers() {
  const { user, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToasts();
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState("Users");

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
            (u.name || '').toLowerCase().includes(term) ||
            (u.email || '').toLowerCase().includes(term) ||
            (u.role || '').toLowerCase().includes(term) ||
            (u.username || '').toLowerCase().includes(term)
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
      //setError(err.response?.data?.message || 'Failed to fetch users');
      addToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(token, userId, newRole);
      fetchUsers();
    } catch (err) {
      //alert(err.response?.data?.message || 'Failed to update role');
      addToast('Failed to update role', 'error');
    }
  };

  const handleDisableToggle = async (targetUserId, disableFlag) => {
    try {
      await disableUser(token, targetUserId, disableFlag);
      fetchUsers();
    } catch (err) {
      //alert(err.response?.data?.message || 'Failed to update disabled status');
      addToast('Failed to update disabled status', 'error');
    }
  };

  // only ADMIN may access this page
  if (!user || (user.role !== 'ADMIN'))
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-bold">Access Denied</p>
      </div>
    );

  const paginatedUsers = paginate(filteredUsers, currentPage, pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-6 overflow-x-hidden">
        <h1 className="text-3xl font-bold mb-4">Admin User Management</h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username, email, or role"
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
          <LoadingSpinner message="." />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className='overflow-x-hidden bg-red-700 relative'>
            <div className="overflow-x-scroll bg-white shadow rounded-lg p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Profile</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Website</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">DOB</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map(u => (
                    <tr key={u.id}>
                      <td className="px-4 py-2">{u.id}</td>
                      <td className="px-4 py-2">
                        {u.profile_pic ? (
                          <img
                            src={u.profile_pic}
                            alt={`${u.name || u.username}'s avatar`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 italic">No pic</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${roleColors[u.role] || 'bg-gray-200 text-gray-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {u.disabled ? (
                          <span className="text-sm px-2 py-1 rounded bg-gray-800 text-white">Disabled</span>
                        ) : (
                          <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-2 flex items-center gap-2">
                        {/* Role change - only ADMIN can change roles */}
                        {user.role === 'ADMIN' && u.id !== user.id && (
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

                        {/* Disable / Enable controls */}
                        {u.id !== user.id && (
                          <>
                            {/* Moderators cannot disable admins */}
                            {user.role === 'MODERATOR' && u.role === 'ADMIN' ? (
                              <span className="text-xs italic text-gray-500">Cannot modify admin</span>
                            ) : (
                              <>
                                {!u.disabled ? (
                                  <button
                                    onClick={() => handleDisableToggle(u.id, true)}
                                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                  >
                                    Disable
                                  </button>
                                ) : (
                                  // Only ADMIN can enable a disabled user (moderator cannot re-enable)
                                  user.role === 'ADMIN' ? (
                                    <button
                                      onClick={() => handleDisableToggle(u.id, false)}
                                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                                    >
                                      Enable
                                    </button>
                                  ) : (
                                    <span className="text-xs italic text-gray-500">Disabled</span>
                                  )
                                )}
                              </>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {u.website ? (
                          <a href={u.website} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                            {u.website}
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{u.dob || '—'}</td>
                      <td className="px-4 py-2">{u.location || '—'}</td>
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
          </div>
        )}
      </main>
    </div>
  );
}
