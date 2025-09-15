// src/components/messages/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import Conversations from './Conversations';

/**
 * Sidebar with searchbar and convo list
 * Props:
 * - onSelectUser(user)
 * - searchRef - forwarded ref to search input (so other parts can focus it)
 * - convos - recent conversations array
 * - fetchUserSearch(query) - fn to call server search
 */
export default function Sidebar({ onSelectUser, searchRef, convos = [], fetchUserSearch, onStartChatFocus }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // debounce search
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetchUserSearch(query);
        if (mounted) setResults(r.users || r);
      } catch (err) {
        console.error('search error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 250);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [query, fetchUserSearch]);

  return (
    <aside className="w-96 border-r bg-white">
      <div className="p-4 border-b">
        <SearchBar
          value={query}
          onChange={setQuery}
          searchRef={searchRef}
          placeholder="Search users by name or username"
        />
        <div className="mt-2">
          <button
            className="text-sm text-blue-600"
            onClick={() => {
              // focus and open search
              searchRef.current?.focus?.();
              onStartChatFocus && onStartChatFocus();
            }}
          >
            Send a message
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {/* search results */}
        {query ? (
          <div>
            <h4 className="text-xs text-gray-500 mb-2">Search results</h4>
            {loading && <div className="text-sm text-gray-400">Searching...</div>}
            {results.length === 0 && !loading && <div className="text-sm text-gray-400">No users found</div>}
            {results.map((u) => (
              <div
                key={u.id}
                className="p-2 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => onSelectUser(u)}
              >
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-gray-500">@{u.username}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h4 className="text-xs text-gray-500 mb-2">Recent</h4>
            <Conversations convos={convos} onSelectUser={onSelectUser} />
          </div>
        )}
      </div>
    </aside>
  );
}
