// pages/CustomerSupport.jsx
import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { createTicket, getTickets as fetchTicketsApi, getTicket as fetchTicketApi, postComment as postCommentApi } from '../services/support';
import { Link, useLocation } from 'react-router-dom';

export default function CustomerSupport() {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();

  // Banner state (for disabled-login redirect)
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('appeal');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // my tickets
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketComments, setTicketComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);

  // ref to the create ticket form for scrolling from banner CTA
  const formRef = useRef(null);

  // On mount: if navigated from a disabled login, show the banner
  useEffect(() => {
    if (location?.state?.from === 'disabled-login') {
      // prefer the provided message, fallback to general
      const msg = location.state?.message || 'Your account has been disabled. You may submit an appeal below.';
      setBannerMessage(msg);
      setBannerVisible(true);

      // if user is present and disabled, also fetch their tickets
      if (token) {
        fetchMyTickets();
      }
    } else {
      // normal load: if logged-in, fetch user's tickets
      if (token) fetchMyTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state, token]);

  const fetchMyTickets = async () => {
    try {
      setLoadingTickets(true);
      const data = await fetchTicketsApi(token, { mine: true, limit: 50 });
      setTickets(data);
    } catch (err) {
      console.error('fetchMyTickets', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!subject || !description) {
      setError('Subject and description are required.');
      return;
    }
    try {
      setSending(true);
      await createTicket(token, { subject, description, category, priority, is_public: true });
      setSuccess('Ticket created. Support will contact you shortly.');
      setSubject('');
      setDescription('');
      setCategory('appeal');
      setPriority('MEDIUM');
      fetchMyTickets();
      // auto-scroll to tickets list or selected ticket could be added
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSending(false);
    }
  };

  const openTicket = async (ticketId) => {
    try {
      setLoadingTicketDetail(true);
      const { ticket, comments } = await fetchTicketApi(token, ticketId);
      setSelectedTicket(ticket);
      setTicketComments(comments || []);
    } catch (err) {
      console.error('openTicket', err);
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedTicket) return;
    try {
      await postCommentApi(token, selectedTicket.id, commentText.trim());
      setCommentText('');
      const { comments } = await fetchTicketApi(token, selectedTicket.id);
      setTicketComments(comments || []);
    } catch (err) {
      console.error('handleAddComment', err);
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  // Banner CTA scroll-to-form helper
  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // optionally focus the subject input inside the form
      const el = formRef.current.querySelector('input, textarea, select');
      if (el) el.focus();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top banner (if redirected from disabled-login) */}
      {bannerVisible && (
        <div className="col-span-1 lg:col-span-3">
          <div className="flex items-start justify-between gap-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm">
            <div>
              <div className="font-semibold text-yellow-800">Account disabled</div>
              <div className="text-sm text-yellow-700 mt-1">{bannerMessage}</div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={scrollToForm} className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                  Open appeal form
                </button>
                <Link to="/help" className="text-sm text-yellow-800 underline">Help center</Link>
              </div>
            </div>
            <div>
              <button
                onClick={() => setBannerVisible(false)}
                className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
                aria-label="Dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT: Create ticket */}
      <div className="col-span-1 bg-white rounded-lg shadow p-6" ref={formRef}>
        <h2 className="text-lg font-semibold mb-2">Contact Support</h2>
        <p className="text-sm text-gray-500 mb-4">
          Submit an appeal or report an issue. You can attach context and links in the description.
        </p>

        {/* If user is disabled, show small explanation */}
        {user?.disabled && (
          <div className="mb-3 text-sm text-gray-700 bg-gray-100 p-2 rounded">
            Note: your account is currently <strong>disabled</strong>. This support channel is monitored by our support team — submitting an appeal will create a ticket for review.
          </div>
        )}

        {error && <div className="mb-3 text-sm text-red-700 bg-red-100 p-2 rounded">{error}</div>}
        {success && <div className="mb-3 text-sm text-green-700 bg-green-100 p-2 rounded">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full mt-1 border px-3 py-2 rounded" placeholder="Short summary (e.g. 'Account disabled appeal')" />
          </div>

          <div>
            <label className="block text-sm font-medium">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 border px-3 py-2 rounded">
              <option value="appeal">Account Appeal</option>
              <option value="report">Report Abuse / User</option>
              <option value="payment">Payment / Billing</option>
              <option value="bug">Bug Report</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full mt-1 border px-3 py-2 rounded">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full mt-1 border px-3 py-2 rounded" placeholder="Provide details, links, and any context. Paste screenshots if helpful." />
          </div>

          <div className="flex items-center gap-3">
            <button disabled={sending} className="px-4 py-2 bg-blue-600 text-white rounded">
              {sending ? 'Sending...' : 'Send to Support'}
            </button>
            <Link to="/help" className="text-sm text-gray-600 hover:underline">Help center</Link>
          </div>
        </form>
      </div>

      {/* MIDDLE: my tickets list */}
      <div className="col-span-1 lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">My Support Tickets</h3>
            <div className="flex items-center gap-2">
              <button onClick={fetchMyTickets} className="text-sm text-gray-600 hover:underline">Refresh</button>
            </div>
          </div>

          {loadingTickets ? (
            <p>Loading...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-gray-500">You have no support requests. Use the form to create one.</p>
          ) : (
            <div className="divide-y">
              {tickets.map(t => (
                <div key={t.id} className="py-3 flex items-start justify-between">
                  <div className="flex-1">
                    <button onClick={() => openTicket(t.id)} className="text-left w-full">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">{t.subject}</div>
                        <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.priority}</div>
                        <div className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">{t.status}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{t.category} • submitted {new Date(t.created_at).toLocaleString()}</div>
                    </button>
                  </div>
                  <div className="ml-4 text-sm text-gray-500">{t.assigned_to_name || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ticket detail */}
        {selectedTicket && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-semibold">{selectedTicket.subject}</h4>
                <div className="text-sm text-gray-500">Status: <span className="font-medium">{selectedTicket.status}</span> • Priority: <span className="font-medium">{selectedTicket.priority}</span></div>
              </div>
              <div className="text-sm text-gray-500">Assigned: {selectedTicket.assigned_to_name || 'Unassigned'}</div>
            </div>

            <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</div>

            <div className="mt-4">
              <h5 className="font-medium mb-2">Conversation</h5>
              <div className="space-y-3 max-h-64 overflow-auto p-2 bg-gray-50 rounded">
                {ticketComments.map(c => (
                  <div key={c.id} className="bg-white p-2 rounded shadow-sm">
                    <div className="text-xs text-gray-600">{c.author_name || 'Support'} • {new Date(c.created_at).toLocaleString()}</div>
                    <div className="text-sm mt-1">{c.message}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a reply..." className="flex-1 border px-3 py-2 rounded" />
                <button onClick={handleAddComment} className="px-4 py-2 bg-blue-600 text-white rounded">Reply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
