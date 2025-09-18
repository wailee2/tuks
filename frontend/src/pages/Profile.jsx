// pages/Profile.jsx
import { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  getProfile,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  requestDelete
} from '../services/profile';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import { useToasts } from '../context/ToastContext';
import AvatarModal from '../components/AvatarModal';
import NotFoundPlaceholder from "../components/NotFoundPlaceholder";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProfilePage() {
  const { username } = useParams();
  const { user, token, logout } = useContext(AuthContext);
  const { addToast } = useToasts();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // NEW: image modal state + focus restore ref
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const lastFocusedEl = useRef(null);

  const isOwner = user && user.username && user.username.toLowerCase() === (username || '').toLowerCase();

  const isVisible = (field) => {
    if (isOwner) return true;

    const fieldVal = profile?.[field];
    if (typeof fieldVal !== 'undefined' && fieldVal !== null && fieldVal !== '') return true;

    return !!(
      profile?.[`${field}_visible`] ||
      profile?.visibility?.[field] ||
      profile?.visibility?.[`${field}_visible`]
    );
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, token]);

  const fetch = async () => {
    try {
      setLoading(true);
      const data = await getProfile(username, token);
      setProfile(data);
      console.log('fetched profile', data);
    } catch (err) {
      console.error('fetch profile', err);
      addToast(err?.response?.data?.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Image modal helpers ---
  useEffect(() => {
    if (imageModalOpen) {
      // save focus and lock scroll
      lastFocusedEl.current = document.activeElement;
      document.body.style.overflow = 'hidden';

      const onKey = (e) => {
        if (e.key === 'Escape') setImageModalOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
        // restore focus
        try { lastFocusedEl.current?.focus?.(); } catch (err) { /* ignore */ }
      };
    }
  }, [imageModalOpen]);

  const openImageModal = () => setImageModalOpen(true);

  const handleFollow = async () => {
    try {
      await followUser(token, username);
      addToast('Followed', 'success');
      fetch();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to follow', 'error');
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(token, username);
      addToast('Unfollowed', 'success');
      fetch();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to unfollow', 'error');
    }
  };

  const handleBlock = async () => {
    try {
      setBlocking(true);
      await blockUser(token, username);
      addToast('User blocked', 'success');
      fetch();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to block', 'error');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async () => {
    try {
      setBlocking(true);
      await unblockUser(token, username);
      addToast('User unblocked', 'success');
      fetch();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to unblock', 'error');
    } finally {
      setBlocking(false);
    }
  };

  const handleMessage = () => {
    navigate(`/messages?with=${encodeURIComponent(username)}`);
  };

  const handleReport = () => {
    navigate('/support', { state: { from: 'report', reported: username, message: `Reporting user ${username}` } });
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: `${profile.name} on Tuks`, url: window.location.href });
    } catch (err) {
      await navigator.clipboard?.writeText(window.location.href);
      addToast('Profile link copied', 'success');
    }
  };

  const handleDeleteRequest = async () => {
    try {
      await requestDelete(token);
      addToast('Account deletion requested. You will be logged out.', 'success');
      logout();
      navigate('/login');
    } catch (err) {
      addToast('Failed to request deletion', 'error');
    }
  };

  if (loading) return <LoadingSpinner message="." />;
  if (!profile) {
    return (
      <NotFoundPlaceholder
        title="Profile Not Found"
        message={`"${username}" does not exist.`}
        actionLabel="Back to Home"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6 flex gap-6">
        {/* clickable avatar */}
        {profile.profile_pic ? (
          <img
            src={profile.profile_pic}
            alt={`${profile.name || profile.username}'s avatar`}
            className="w-28 h-28 rounded-full object-cover cursor-pointer"
            onClick={openImageModal}
            role="button"
            aria-label="Open profile picture"
          />
        ) : (
          <div
            className="w-28 h-28 flex items-center justify-center rounded-full 
                      bg-gray-300 text-gray-700 text-3xl font-semibold select-none"
            aria-label="Default profile picture"
          >
            {(profile.name || profile.username || "U").charAt(0).toUpperCase()}
          </div>
        )}


        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-semibold">{profile.name}</div>
              <div className="text-sm text-gray-500">@{profile.username}</div>
              <div className="mt-3 text-sm">{profile.bio}</div>
              <div className="mt-3 text-sm text-gray-600 flex gap-4">
                <div>Posts: {profile.posts_count}</div>
                <div>Followers: {profile.followers_count}</div>
                <div>Following: {profile.following_count}</div>
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-700">
                {profile.website && (
                  <div>🔗 <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{profile.website}</a></div>
                )}

                {profile.email && isVisible('email') && (
                  <div>✉️ {profile.email}</div>
                )}

                {profile.dob && isVisible('dob') && (
                  <div>🎂 {profile.dob}</div>
                )}

                {profile.location && isVisible('location') && (
                  <div>📍 {profile.location}</div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {isOwner ? (
                <>
                  <button onClick={() => navigate(`/settings/edit-profile`)} className="px-3 py-1 bg-indigo-600 text-white rounded">Edit profile</button>
                  <button onClick={() => setSettingsOpen(true)} className="text-gray-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none"> ... </svg>
                  </button>
                   <button onClick={() => setSettingsOpen(true)} className="text-gray-600">settings</button>
                </>
              ) : (
                <>
                  {!profile.is_following ? (
                    <button onClick={handleFollow} className="px-3 py-1 bg-green-600 text-white rounded">Follow</button>
                  ) : (
                    <button onClick={handleUnfollow} className="px-3 py-1 bg-gray-200 rounded">Unfollow</button>
                  )}

                  <button onClick={handleMessage} className="px-3 py-1 bg-blue-600 text-white rounded">Message</button>

                  {profile.is_blocked_by_viewer ? (
                    <button onClick={handleUnblock} className="px-3 py-1 bg-gray-200 rounded">Unblock</button>
                  ) : (
                    <button onClick={handleBlock} disabled={blocking} className="px-3 py-1 bg-red-600 text-white rounded">Block</button>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button onClick={handleReport} className="text-sm text-gray-600">Report</button>
                    <button onClick={handleShare} className="text-sm text-gray-600">Share</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image modal */}
      <AvatarModal
        src={profile.profile_pic}
        alt={`${profile.name || profile.username}'s avatar`}
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
      />


      {/* Settings modal */}
      {settingsOpen && <ProfileSettingsModal onClose={() => setSettingsOpen(false)} onRequestDelete={handleDeleteRequest} />}
    </div>
  );
}
