// pages/CustomerSupport.jsx
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import supportService from '../services/support';

export default function CustomerSupport() {
  const { user, token } = useContext(AuthContext);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSuccess('');
    setError('');
    try {
      await supportService.sendAppeal(token, {
        userId: user?.id,
        subject,
        message
      });
      setSuccess('Appeal submitted. Support will contact you.');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send appeal');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Support — Account Appeal</h1>
      <p className="mb-4">If your account has been disabled you can submit an appeal here. Provide details and our support team will review it.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow p-4 rounded">
        <div>
          <label className="block font-medium">Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full border px-3 py-2 rounded" placeholder="Brief subject" />
        </div>

        <div>
          <label className="block font-medium">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required className="w-full border px-3 py-2 rounded" rows={6} placeholder="Explain why your account should be reinstated" />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" disabled={sending} className="px-4 py-2 bg-blue-600 text-white rounded">
            {sending ? 'Sending...' : 'Submit Appeal'}
          </button>
        </div>

        {success && <p className="text-green-600">{success}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
}
