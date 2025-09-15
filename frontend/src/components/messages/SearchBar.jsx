// src/components/messages/SearchBar.jsx
import React from 'react';

/**
 * searchRef should be forwarded from parent (Messages.jsx)
 */
export default function SearchBar({ value, onChange, searchRef, placeholder = 'Search...' }) {
  return (
    <input
      ref={searchRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2 border rounded focus:outline-none focus:ring"
    />
  );
}
