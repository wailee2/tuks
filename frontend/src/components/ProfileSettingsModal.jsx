// components/ProfileSettingsModal.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToasts } from '../context/ToastContext';

export default function ProfileSettingsModal({ onClose, onRequestDelete }) {
  const { logout } = useContext(AuthContext);
  const { addToast } = useToasts();

  const handleLogout = () => {
    logout();
    addToast('Logged out', 'success');
    onClose();
  };

  const handleDelete = () => {
    // show confirmation (simple)
    if (confirm('Are you sure you want to request account deletion? This will schedule your account to be deleted after 30 days.')) {
      onRequestDelete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg p-6 z-60 max-w-sm w-full shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Settings</h3>
        <div className="space-y-3">
          <button onClick={handleLogout} className="w-full px-3 py-2 bg-gray-100 rounded">Logout</button>
          <button onClick={() => alert('Change password flow not implemented here — use your existing flow')} className="w-full px-3 py-2 bg-gray-100 rounded">Change password</button>
          <button onClick={handleDelete} className="w-full px-3 py-2 bg-red-600 text-white rounded">Request account deletion</button>
          <div className="mt-2 text-sm text-gray-500">Requesting deletion will immediately disable your account and hide it from other users. Data will be permanently removed after 30 days.</div>
          <div className="flex justify-end mt-3">
            <button onClick={onClose} className="px-3 py-1 border rounded">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
