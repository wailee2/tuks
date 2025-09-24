// components/AvatarModal
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
// AvatarModal
// Props:
// - src: image URL
// - alt: alt text
// - open: boolean
// - onClose: () => void
// - download: boolean (show download link)
export default function AvatarModal({ src, alt = 'Profile picture', open = false, onClose = () => {}, download = true }) {
  const lastFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    // save focus and lock scroll
    lastFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      try { lastFocused.current?.focus?.(); } catch (err) { /* ignore */ }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-60 p-4 bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Profile picture preview"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-full max-h-full rounded-full shadow-lg overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-40 bg-white bg-opacity-90 rounded-full py-2 px-4 shadow hover:opacity-90"
          aria-label="Close image preview"
        >
          ✕
        </button>

        <img
          src={src || '/default-avatar.png'}
          alt={alt}
          className="block max-w-[90vw] max-h-[90vh] object-contain bg-white"
          loading="eager"
        />
      </motion.div>
    </motion.div>
  );
}
