// pages/ManageUsers.jsx
import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getAllUsers, updateUserRole, disableUser } from '../services/admin';
import { paginate } from '../utils/pagination';
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
  Crown,
  Search,
  ArrowLeft,
  ArrowRight,
  Filter,
  PlusIcon
} from "lucide-react";

import { FaUser } from "react-icons/fa";
import { BiSupport, BiSolidAnalyse } from "react-icons/bi";
import { GrUserAdmin } from "react-icons/gr";
import { GiCrownedHeart } from "react-icons/gi";
import { HiMiniUserCircle } from "react-icons/hi2";

import { motion } from "framer-motion";
import { Link } from "react-router-dom";


const roleColors = {
  USER: 'bg-gray-200 text-gray-800',
  MODERATOR: 'bg-blue-200 text-blue-800',
  SUPPORT: 'bg-purple-200 text-purple-800',
  ANALYST: 'bg-yellow-200 text-yellow-800',
  ADMIN: 'bg-red-200 text-red-800',
  OWNER: 'bg-green-200 text-green-800',
};
const roleIconMap = {
  USER: HiMiniUserCircle,
  MODERATOR: ShieldCheck,
  SUPPORT: BiSupport,
  ANALYST: BiSolidAnalyse,
  ADMIN: GrUserAdmin,
  OWNER: GiCrownedHeart,
};

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
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState(["id", "name", "username", "profile_pic", "status", "role"]); 
  const allFields = ["id", "profile_pic","username", "name",  "email", "role", "status", "website", "dob", "location"];

  // SEARCH / FILTER state (add here)
  const [searchFields, setSearchFields] = useState(['name', 'username']); // default search fields
  const [filterModalOpen, setFilterModalOpen] = useState(false); // opens the filter modal (same UI as role modal)


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
    if (user?.role === 'ADMIN' || user?.role === 'OWNER') fetchUsers();
  }, [user]);


  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase();

    setFilteredUsers(
      users.filter(u =>
        searchFields.some(field => {
          const val = (u[field] ?? '').toString().toLowerCase();
          return val.includes(term);
        })
      )
    );

    setCurrentPage(1);
  }, [searchTerm, users, searchFields]);


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

  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER'))
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500 font-bold">Access Denied</p>
    </div>
  );

  const paginatedUsers = paginate(filteredUsers, currentPage, pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  
  return (
    <div className="flex min-h-screen ">
      <main className="flex-1 p-7 overflow-x-hidden">
        <div className='mb-8'>
          <h1 className="text-2xl text-gray-800 font-semibold tracking-tight">User management</h1>
        </div>
        
        {/* Header*/}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
          {/* Search + Filter area */}
          <div className="flex items-center gap-3 w-full sm:w-1/2 md:w-md border border-gray-200 rounded-full shadow-sm px-4 py-2.5">
            <Search className="h-5 w-5 text-gray-400 "/>
            <input
              className="flex-1 outline-none text-[16px] text-gray-800 "
              placeholder={`Search`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search users"
            />
          </div>

          <div className='flex items-center justify-between gap-3'>
            {/* Table selector */}
            <div className="relative inline-block text-left" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="  text-gray-700 shadow-sm rounded-full border border-gray-300 text-sm px-4 py-2.5 flex items-center justify-between gap-3"
              >
                <PlusIcon className='w-3.5 h-3.5'/>
                <span>Add Fields</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg border p-2 z-50">
                  <button
                    onClick={() => {
                      if (visibleFields.length === allFields.length) {
                        setVisibleFields([]);
                      } else {
                        setVisibleFields(allFields);
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
            
            <div>
              <button
                onClick={() => setFilterModalOpen(true)}
                className="bg-green-700 text-white shadow-sm rounded-full text-sm px-4 py-2.5 flex items-center justify-between gap-3"
                aria-expanded={filterModalOpen}
                aria-controls="filter-modal"
              >
                <Filter className='w-3.5 h-3.5'/>
                <span>Filter</span>
              </button>

              {/* Active search fields chips 
              <div
                className="flex gap-2 items-center flex-wrap">
                {searchFields.map(f => (
                  <span key={f} className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-700 select-none">
                    {f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>*/}
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="." />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className='overflow-x-hidden rounded-lg border-gray-200 border-1 shadow'>
            <div className="overflow-x-scroll bg-white ">
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
                          onClick={() => {
                            if (u.role === "OWNER" && user.role !== "OWNER") return; // block editing owner
                            openUserModal(u);
                          }}
                          title={`${u.role}${u.disabled ? " (Disabled)" : ""}`}
                          aria-label={`Role: ${u.role}`}
                        >
                          {/* Icon badge — uses the roleColors for bg/text so icon inherits color */}
                          <motion.div
                            className={`inline-flex items-center justify-center h-9 w-9 rounded-full ${roleColors[u.role] || 'bg-gray-200 text-gray-800'}`}
                            whileHover={{ scale: 1.2, opacity: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            {(() => {
                              const RoleIcon = roleIconMap[u.role] || User;
                              return <RoleIcon className="h-5 w-5" />;
                            })()}
                          </motion.div>
                        </td>
                      )}
                      {visibleFields.includes("status") && (
                        <td className="px-6 py-4 flex items-center gap-2">
                          {u.id !== user.id && (user.role === "ADMIN" || user.role === "OWNER") && (
                            <>
                              {/* 🚨 Block non-owners from toggling OWNER accounts */}
                              {!(u.role === "OWNER" && user.role !== "OWNER") && (
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

            <div className='flex flex-wrap items-center justify-between py-4 px-6 space-y-3 border-t border-gray-200'>
              {/* Page size selector */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Rows per page</label>
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="
                      appearance-none
                      bg-white
                      border border-gray-300
                      rounded-lg
                      pl-3 pr-8 py-2
                      text-sm text-gray-700
                      shadow-sm
                      focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400
                      transition
                    "
                  >
                    {[5, 10, 20, 50].map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>

                  {/* dropdown chevron */}
                  <svg
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && ( 
                <div className="flex justify-between w-full sm:w-1/2">
                  
                  <div>
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3.5 py-1.5 mx-1 rounded text-sm ${
                          currentPage === page
                            ? 'bg-gray-200 text-gray-800 font-semibold'
                            : 'text-gray-500 hover:bg-gray-300 '
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <div className='flex gap-3'>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="disabled:opacity-50 flex items-center gap-2 text-gray-500 text-sm font-semibold"
                    >
                      <ArrowLeft className='w-5 h-5'/>Previous
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="disabled:opacity-50 flex items-center gap-2 text-gray-500 text-sm font-semibold"
                    >
                      Next<ArrowRight className='w-5 h-5'/>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            className="bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl p-6 text-center "
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['USER', 'MODERATOR', 'SUPPORT', 'ANALYST', 'ADMIN', ...(user.role === 'OWNER' ? ['OWNER'] : [])].map((r) => {
                const RoleIcon = roleIconMap[r] || User;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      handleRoleChange(selectedUser.id, r);
                      closeUserModal();
                    }}
                    className={`px-4 py-4 cursor-pointer rounded-lg text-sm font-medium transition flex items-center justify-center gap-3
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
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/5 text-white rounded-lg cursor-pointer hover:scale-105 transition"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}

      {filterModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setFilterModalOpen(false)}
        >
          <motion.div
            id="filter-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-2xl p-6 w-96 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Filter Search Fields</h2>

            <div
              className="
                grid gap-3 mb-4
                grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                p-2
                max-w-full
                max-h-[70vh] overflow-y-auto
              "
            >
              {allFields
                .filter((f) => f !== 'profile_pic') // <- removed profile_pic entries
                .map((f) => {
                  const selected = searchFields.includes(f);

                  return (
                    <motion.button
                      key={f}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setSearchFields(prev =>
                          prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                        )
                      }
                      whileTap={{ scale: 1.05}}
                      transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
                      className={
                        `w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-all duration-150 transform-gpu cursor-pointer ` +
                        (selected
                          ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700')
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm truncate">{f.replace(/_/g, '...')}</span>
                      </div>
                    </motion.button>
                  );
                })}
            </div>

            <div className="flex justify-between items-center gap-2">
              <motion.button
                onClick={() => setSearchFields(['name', 'username', 'role'])}
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                whileTap={{ scale: 1.05}}
                transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
              >
                Reset to Default
              </motion.button>

              <div className="flex gap-2">
                <motion.button
                  onClick={() => setFilterModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                  whileHover={{ scale: 1.05}}
                  transition={{ type: "tween", duration: 0.2, ease: "easeInOut" }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
