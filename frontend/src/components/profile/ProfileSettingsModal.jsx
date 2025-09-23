// components/ProfileSettingsModal.jsx
import { useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { useToasts } from '../../context/ToastContext';

export default function ProfileSettingsModal({ onClose, onRequestDelete }) {
  const { logout } = useContext(AuthContext);
  const { addToast } = useToasts();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleLogout = () => {
    logout();
    addToast('Logged out', 'success');
    onClose();
  };

  const handleDelete = () => {
    // simple confirmation
    if (
      confirm(
        'Are you sure you want to request account deletion? This will schedule your account to be deleted after 30 days.'
      )
    ) {
      onRequestDelete();
      onClose();
    }
  };


  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >

      {/* panel */}
      <motion.div
        className="relative z-60 bg-white/20 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl p-6 w-full max-w-sm mx-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold mb-3 text-white">Settings</h3>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 bg-gray-800/60 text-white rounded hover:scale-[1.02] transition"
          >
            Logout
          </button>

          <button
            onClick={() => alert('Change password flow not implemented here — use your existing flow')}
            className="w-full px-3 py-2 bg-white/10 text-white rounded hover:scale-[1.02] transition"
          >
            Change password
          </button>

          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 bg-red-600 text-white rounded hover:opacity-90 transition"
          >
            Request account deletion
          </button>

          <div className="mt-2 text-sm text-white/70">
            Requesting deletion will immediately disable your account and hide it from other users.
            Data will be permanently removed after 30 days.
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={onClose}
              className="px-3 py-1 border rounded bg-white/5 text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
