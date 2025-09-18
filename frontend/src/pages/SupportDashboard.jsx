// pages/SupportDashboard.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getTickets, getTicket, updateTicket, postComment, claimTicket } from '../services/support';
import { getUsersByRole } from '../services/users';
import { useToasts } from '../context/ToastContext';
import LoadingSpinner from "../components/LoadingSpinner";

export default function SupportDashboard() {
  const { user, token } = useContext(AuthContext);
  const { addToast } = useToasts();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [assignUsername, setAssignUsername] = useState('');
  const [agents, setAgents] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAllTickets();
      fetchAgents();
    }
  }, [token]);

  const fetchAgents = async () => {
    try {
      const list = await getUsersByRole(token, 'SUPPORT');
      setAgents(list || []);
    } catch (err) {
      console.error('fetchAgents', err);
      addToast('Failed to load support agents', 'error');
    }
  };

  const fetchAllTickets = async () => {
    try {
      setLoading(true);
      const data = await getTickets(token, { limit: 100 });
      setTickets(data);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (id) => {
    try {
      const { ticket, comments } = await getTicket(token, id);
      setSelected(ticket);
      setComments(comments || []);
      setAssignUsername(ticket.assigned_to_username || '');
    } catch (err) {
      console.error(err);
      addToast('Failed to load ticket', 'error');
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const data = await getTickets(token, params);
      setTickets(data);
    } catch (err) {
      console.error(err);
      addToast('Failed to apply filters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (changes) => {
    if (!selected) return;
    try {
      setUpdating(true);
      const updated = await updateTicket(token, selected.id, changes);
      setSelected(updated);
      fetchAllTickets();
      addToast('Ticket updated', 'success');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to update ticket', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // "Assign to me" (claims ticket) - SUPPORT or ADMIN can call; SUPPORT only claims if unassigned
  const handleAssignToMe = async () => {
    if (!selected) return addToast('Select a ticket first', 'error');
    try {
      setUpdating(true);
      const updated = await claimTicket(token, selected.id);
      setSelected(updated);
      fetchAllTickets();
      addToast('You are now handling this ticket', 'success');
    } catch (err) {
      console.error('claim error', err);
      if (err?.response?.status === 409) addToast('Ticket already assigned', 'error');
      else addToast(err.response?.data?.message || 'Failed to claim ticket', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Admin assign via dropdown (agents list) — Admin can override
  const handleAssignAgent = async (agentId) => {
    if (!selected) return addToast('Select a ticket first', 'error');
    if (!agentId) return addToast('Select an agent', 'error');
    try {
      setUpdating(true);
      const updated = await updateTicket(token, selected.id, { assigned_to: agentId });
      setSelected(updated);
      fetchAllTickets();
      addToast('Ticket assigned', 'success');
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to assign', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!selected || !commentText.trim()) return;
    try {
      await postComment(token, selected.id, commentText.trim());
      setCommentText('');
      const { comments } = await getTicket(token, selected.id);
      setComments(comments || []);
      addToast('Comment added', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to add comment', 'error');
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="col-span-1 lg:col-span-1 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Tickets</h3>

        <div className="space-y-2 mb-3">
          <input placeholder="Search subject/description" value={filters.search} onChange={(e) => setFilters(s => ({ ...s, search: e.target.value }))} className="w-full border px-3 py-2 rounded" />
          <div className="flex gap-2">
            <select value={filters.status} onChange={(e) => setFilters(s => ({ ...s, status: e.target.value }))} className="flex-1 border px-3 py-2 rounded">
              <option value="">Any status</option>
              <option>OPEN</option>
              <option>ASSIGNED</option>
              <option>RESOLVED</option>
              <option>CLOSED</option>
            </select>
            <select value={filters.priority} onChange={(e) => setFilters(s => ({ ...s, priority: e.target.value }))} className="flex-1 border px-3 py-2 rounded">
              <option value="">Any priority</option>
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>URGENT</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={applyFilters} className="px-3 py-2 bg-indigo-600 text-white rounded">Apply</button>
            <button onClick={fetchAllTickets} className="px-3 py-2 bg-gray-200 rounded">Reset</button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto divide-y">
          {loading ? <LoadingSpinner message="." />: tickets.map(t => (
            <div key={t.id} className="py-2 cursor-pointer hover:bg-gray-50" onClick={() => openTicket(t.id)}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{t.subject}</div>
                  <div className="text-xs text-gray-500">{t.category} • {t.created_by_name}</div>
                </div>
                <div className="text-right text-xs">
                  <div>{t.priority}</div>
                  <div className="text-gray-500">{t.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-1 lg:col-span-3 bg-white p-4 rounded shadow">
        {selected ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selected.subject}</h2>
                <div className="text-sm text-gray-500">By {selected.created_by_name} • {new Date(selected.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-500">Ticket #{selected.id}</div>
            </div>

            <div className="mt-4">
              <div className="text-sm">{selected.description}</div>
              <div className="mt-4 flex gap-2 items-center">
                <label className="text-sm">Status</label>
                <select value={selected.status} onChange={(e) => handleUpdate({ status: e.target.value })} className="border px-2 py-1 rounded">
                  <option>OPEN</option>
                  <option>ASSIGNED</option>
                  <option>RESOLVED</option>
                  <option>CLOSED</option>
                </select>

                <label className="text-sm">Priority</label>
                <select value={selected.priority} onChange={(e) => handleUpdate({ priority: e.target.value })} className="border px-2 py-1 rounded">
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                  <option>URGENT</option>
                </select>

                {/* Assign controls */}
                <div className="ml-4 flex items-center gap-2">
                  {/* Assign to me (SUPPORT & ADMIN) */}
                  <button onClick={handleAssignToMe} disabled={updating} className="px-3 py-1 bg-green-600 text-white rounded">
                    Assign to me
                  </button>

                  {/* Admin-only agent dropdown */}
                  {user.role === 'ADMIN' && (
                    <>
                      <select value={assignUsername} onChange={(e) => setAssignUsername(e.target.value)} className="border px-2 py-1 rounded">
                        <option value="">Select agent</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.username} — {a.name}</option>
                        ))}
                      </select>
                      <button onClick={() => handleAssignAgent(assignUsername)} disabled={updating || !assignUsername} className="px-3 py-1 bg-indigo-600 text-white rounded">
                        Assign
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-2">Conversation</h4>
              <div className="space-y-3 max-h-56 overflow-auto p-2 bg-gray-50 rounded">
                {comments.map(c => (
                  <div key={c.id} className="bg-white p-2 rounded shadow-sm">
                    <div className="text-xs text-gray-600">{c.author_name} • {new Date(c.created_at).toLocaleString()}</div>
                    <div className="text-sm mt-1">{c.message}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a reply..." className="flex-1 border px-3 py-2 rounded" />
                <button onClick={handleAddComment} className="px-4 py-2 bg-blue-600 text-white rounded">Add Comment</button>
              </div>
            </div>

            {/* show who is handling the ticket */}
            <div className="mt-4 text-sm text-gray-600">
              Handling: {selected.assigned_to_name ? `${selected.assigned_to_name} (${selected.assigned_to_username})` : 'Unassigned'}
            </div>
          </>
        ) : (
          <div className="text-gray-500">Select a ticket to view details</div>
        )}
      </div>
    </div>
  );
}
