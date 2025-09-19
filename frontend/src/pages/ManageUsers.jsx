// pages/ManageUsers.jsx
import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllUsers, updateUserRole, disableUser } from '../services/admin.js';
import SearchBar from '../components/SearchBar.jsx';
import { paginate } from '../utils/pagination.js';
import { useToasts } from '../context/ToastContext';
import LoadingSpinner from "../components/LoadingSpinner";
import {
  EllipsisVertical,
  CheckCircle,
  XCircle,
  Power,
  PowerOff,
  User,
  ShieldCheck,
  Headphones,
  BarChart2,
  Crown
} from "lucide-react";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";


const roleColors = {
  USER: 'bg-gray-200 text-gray-800',
  MODERATOR: 'bg-blue-200 text-blue-800',
  SUPPORT: 'bg-purple-200 text-purple-800',
  ANALYST: 'bg-yellow-200 text-yellow-800',
  ADMIN: 'bg-red-200 text-red-800'
};
const roleIconMap = {
  USER: User,
  MODERATOR: ShieldCheck,
  SUPPORT: Headphones,
  ANALYST: BarChart2,
  ADMIN: Crown,
};



// Convert field keys like "profile_pic" or "dob" into nice labels
// Format header labels: only acronyms fully uppercase, normal words capitalize first letter
const formatHeaderLabel = (field) => {
  const acronyms = ["ID", "DOB"]; // Add more if needed
  const words = field.split("_");
  return words
    .map(word => (acronyms.includes(word.toUpperCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
};



export default function ManageUsers() {
  const { user, token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToasts();
  const [error, setError] = useState('');
  
  const [dropdownOpen, setDropdownOpen] = useState(false); // ✅ add this
  const [visibleFields, setVisibleFields] = useState(["id", "name", "username", "profile_pic", "status", "role"]); // example
  const allFields = ["id", "profile_pic","username", "name",  "email", "role", "status", "website", "dob", "location"];

  // For role modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const openUserModal = (u) => {
    setSelectedUser(u);
    setRoleModalOpen(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setRoleModalOpen(false);
  };


  const dropdownRef = useRef(null);

  useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


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
    <div className="flex min-h-screen bg-gray-50 ">
      <main className="flex-1 p-6 overflow-x-hidden">
        
        <div className="flex items-center justify-between ">
          <h1 className="text-3xl font-bold mb-4">Admin User Management</h1>
          {/* Table selector */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-3 py-1.5 rounded-lg border bg-white shadow-sm hover:bg-gray-50"
            >
              Select Fields
            </button>

            {dropdownOpen && (
              <div className="absolute mt-2 w-56 rounded-lg bg-white shadow-lg border p-2 z-50">
                {/* ✅ Select/Deselect All Toggle */}
                <button
                  onClick={() => {
                    if (visibleFields.length === allFields.length) {
                      setVisibleFields([]); // deselect all
                    } else {
                      setVisibleFields(allFields); // select all
                    }
                  }}
                  className="w-full text-sm font-medium mb-2 px-3 py-1.5 rounded-md 
                            bg-green-100 text-green-700 hover:bg-green-200 transition"
                >
                  {visibleFields.length === allFields.length ? "Deselect All" : "Select All"}
                </button>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {allFields.map((f) => (
                    <label key={f} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded-md cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleFields.includes(f)}
                        onChange={() =>
                          setVisibleFields((prev) =>
                            prev.includes(f) ? prev.filter((v) => v !== f) : [...prev, f]
                          )
                        }
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

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
        </div>

        {loading ? (
          <LoadingSpinner message="." />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className='overflow-x-hidden '>
            <div className="overflow-x-scroll bg-white shadow rounded-lg border-gray-200 border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {allFields
                      .filter(field => visibleFields.includes(field))
                      .map(field => (
                        <th
                          key={field}
                          className="px-6 py-2 text-left text-[13px] font-medium text-gray-500"
                        >
                          {formatHeaderLabel(field)}
                        </th>
                      ))}
                  </tr>
                </thead>


                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map(u => (
                    <tr key={u.id} className='text-[14px] text-gray-600'>
                      {visibleFields.includes("id") && <td className="text-center py-4 w-1 border-r-1 border-gray-200">{u.id}</td>}
                      {visibleFields.includes("profile_pic") && (
                        <td className="w-30">
                          <Link to={`/${u.username}`} className="flex items-center justify-center">
                            {u.profile_pic ? (
                              <motion.img
                                src={u.profile_pic}
                                alt={`${u.name || u.username}'s avatar`}
                                className="h-12 w-12 rounded-full object-cover 
                                          backdrop-blur-md bg-white/20 border border-white/30 shadow-xl
                                          cursor-pointer "
                                whileHover={{ scale: 1.2, opacity: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              />
                            ) : (
                              <div
                                className="h-12 w-12 flex items-center justify-center rounded-full 
                                          bg-gray-300 text-gray-700 font-semibold shadow-inner 
                                          cursor-pointer select-none"
                              >
                                {(u.name || u.username || "U").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </Link>
                        </td>
                      )}
                      {visibleFields.includes("username") && (
                        <td className="px-6 py-4 text-[14.5px] text-gray-900 font-semibold">
                          <span title={u.username} className="cursor-default">
                            {u.username && u.username.length > 10 ? u.username.slice(0, 10) + '…' : u.username}
                          </span>
                        </td>
                      )}
                      {visibleFields.includes("name") && (
                        <td className="px-6 py-4">
                          <span title={u.name} className="cursor-default">
                            {u.name && u.name.length > 10 ? u.name.slice(0, 10) + '…' : u.name}
                          </span>
                        </td>
                      )}
                      {visibleFields.includes("email") && (
                        <td className="px-6 py-4">
                          <span
                            className="cursor-default"
                            title={u.email}
                          >
                            {u.email.length > 15 ? u.email.slice(0, 15) + '…' : u.email}
                          </span>
                        </td>
                      )}
                      {visibleFields.includes("role") && (
                        <td
                          className="px-6 py-4 cursor-pointer"
                          onClick={() => openUserModal(u)}
                          title={`${u.role}${u.disabled ? " (Disabled)" : ""}`}
                          aria-label={`Role: ${u.role}`}
                        >
                          {/* Icon badge — uses the roleColors for bg/text so icon inherits color */}
                          <div
                            className={`inline-flex items-center justify-center h-9 w-9 rounded-full ${roleColors[u.role] || 'bg-gray-200 text-gray-800'}`}
                          >
                            {(() => {
                              const RoleIcon = roleIconMap[u.role] || User;
                              return <RoleIcon className="h-5 w-5" />;
                            })()}
                          </div>
                        </td>
                      )}

                      {visibleFields.includes("status") && (
                        <td className="px-6 py-4 flex items-center gap-2">
                          {u.id !== user.id && user.role === "ADMIN" && (
                            <>
                              {!u.disabled ? (
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  whileHover={{ scale: 1.1 }}
                                  onClick={() => handleDisableToggle(u.id, true)}
                                  className="flex items-center gap-1 px-3 py-1 text-green-500 hover:text-green-600 transition"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                  <span className="text-sm">Active</span>
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  whileHover={{ scale: 1.1 }}
                                  onClick={() => handleDisableToggle(u.id, false)}
                                  className="flex items-center gap-1 px-3 py-1 text-red-500 hover:text-red-600 transition"
                                >
                                  <XCircle className="h-5 w-5" />
                                  <span className="text-sm">Disabled</span>
                                </motion.button>
                              )}
                            </>
                          )}
                        </td>
                      )}
                      {visibleFields.includes("website") && (
                        <td className="px-6 py-5">
                          {u.website ? (
                            <a
                              href={u.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500"
                              title={u.website} // show full website on hover
                            >
                              {u.website.length > 20 ? u.website.slice(0, 20) + '…' : u.website}
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">—</span>
                          )}
                        </td>
                      )}
                      {visibleFields.includes("dob") && (
                        <td className="px-2 py-4 text-center">
                          {u.dob ? (
                            <span
                              title={new Date(u.dob).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              className="cursor-default"
                            >
                              {new Date(u.dob).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).slice(0, 10) + (new Date(u.dob).toLocaleDateString().length > 10 ? '…' : '')}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">—</span>
                          )}
                        </td>
                      )}
                      {visibleFields.includes("location") && (
                        <td className="px-6 py-4">
                          <span title={u.location || '—'} className="cursor-default">
                            {u.location && u.location.length > 20 ? u.location.slice(0, 20) + '…' : (u.location || '—')}
                          </span>
                        </td>
                      )}
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

      {/* Role Selection Modal */}
      {roleModalOpen && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={closeUserModal}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl p-6 w-80 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              {/* current role icon + username */}
              {(() => {
                const CurrentIcon = roleIconMap[selectedUser.role] || User;
                return (
                  <div className={`inline-flex items-center justify-center h-9 w-9 rounded-full ${roleColors[selectedUser.role] || 'bg-gray-200 text-gray-800'}`}>
                    <CurrentIcon className="h-5 w-5" />
                  </div>
                );
              })()}

              <h2 className="text-lg font-semibold text-white drop-shadow">
                Change Role for {selectedUser.username}
              </h2>
            </div>

            <div className="grid gap-2">
              {['USER', 'MODERATOR', 'SUPPORT', 'ANALYST', 'ADMIN'].map((r) => {
                const RoleIcon = roleIconMap[r] || User;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      handleRoleChange(selectedUser.id, r);
                      closeUserModal();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-3
                                ${roleColors[r] || 'bg-gray-200 text-gray-800'} hover:scale-105`}
                  >
                    <div className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${roleColors[r] || 'bg-gray-200 text-gray-800'}`}>
                      <RoleIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold">{r}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={closeUserModal}
              className="mt-4 px-4 py-2 bg-gray-800/70 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}


    </div>
  );
}
