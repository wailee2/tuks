// components/AvatarModal
import React, { useEffect, useRef } from 'react';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Profile picture preview"
    >
      <div
        className="max-w-full max-h-full rounded-lg shadow-lg overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-40 bg-white bg-opacity-90 rounded-full p-2 shadow hover:opacity-90"
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
      </div>
    </div>
  );
}
