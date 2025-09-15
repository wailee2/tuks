// components/ReportIssue.jsx
import { useState } from 'react';
import { createTicket } from '../services/support';

export default function ReportIssue({ token, onReported }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!description.trim()) return setError('Please describe the issue');
    try {
      setSending(true);
      await createTicket(token, {
        subject: 'User report',
        description,
        category: 'report',
        priority: 'MEDIUM',
        is_public: true
      });
      setDescription('');
      setOpen(false);
      onReported?.();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to report');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-1 bg-red-500 text-white rounded">Report</button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-30" onClick={() => setOpen(false)} />
          <div className="bg-white p-6 rounded shadow max-w-lg w-full z-50">
            <h3 className="text-lg font-medium mb-2">Report an issue</h3>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full border p-2 rounded" />
            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={submit} disabled={sending} className="px-3 py-2 bg-red-600 text-white rounded">
                {sending ? 'Reporting...' : 'Submit report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
