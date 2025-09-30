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
import ProfileSettingsModal from '../components/profile/ProfileSettingsModal';
import { useToasts } from '../context/ToastContext';
import AvatarModal from '../components/profile/AvatarModal';
import NotFoundPlaceholder from "../components/profile/NotFoundPlaceholder";
import LoadingSpinner from "../components/LoadingSpinner";
import { AnimatePresence, motion } from 'framer-motion';
import { FaEllipsis } from "react-icons/fa6";
import { IoMdSettings } from "react-icons/io";
import { IoBalloonOutline, IoLink, IoLocationOutline } from "react-icons/io5";
import { MdOutlineMail } from "react-icons/md";


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

  const [actionsOpen, setActionsOpen] = useState(false);

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

    // --- format helpers (add these after isVisible) ---
  const stripProtocol = (val) => {
    if (!val) return '';
    // remove mailto:, http(s)://, www., trailing slashes
    return String(val)
      .replace(/^mailto:/i, '')
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/+$/i, '');
  };

  const ordinal = (n) => {
    const num = Number(n);
    if (!num) return n;
    const j = num % 10, k = num % 100;
    if (k >= 11 && k <= 13) return `${num}th`;
    if (j === 1) return `${num}st`;
    if (j === 2) return `${num}nd`;
    if (j === 3) return `${num}rd`;
    return `${num}th`;
  };

  const formatDOB = (dobString) => {
    if (!dobString) return '';
    // handle "YYYY-MM-DD" or ISO datetime like "YYYY-MM-DDT..."
    const datePart = String(dobString).split('T')[0];
    const parts = datePart.split('-');
    if (parts.length < 3) return dobString;
    const monthIndex = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    if (Number.isNaN(monthIndex) || Number.isNaN(day)) return dobString;
    // create a date to get month name (year arbitrary)
    const d = new Date(2000, monthIndex, day);
    const monthName = d.toLocaleString('en-US', { month: 'long' });
    return `${monthName} ${ordinal(day)}`; // "January 5th"
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
    <div className=" max-w-4xl mx-auto p-2 md:p-6">
      <div className=" p-2 md:p-6 flex flex-col md:flex-row  gap-6 md:gap-20">
        {/* clickable avatar */}
        {profile.profile_pic ? (
          <motion.img
            src={profile.profile_pic}
            alt={`${profile.name || profile.username}'s avatar`}
            className="w-22 h-22 md:w-40 md:h-40 rounded-full object-cover cursor-pointer"
            onClick={openImageModal}
            role="button"
            aria-label="Open profile picture"
            whileHover={{ scale: 1.05, opacity: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        ) : (
          <div
            className="w-22 h-22 md:w-40 md:h-40 flex items-center justify-center rounded-full 
                      bg-gray-300 text-gray-700 text-3xl font-semibold select-none"
            aria-label="Default profile picture"
          >
            {(profile.name || profile.username || "U").charAt(0).toUpperCase()}
          </div>
        )}


        <div className="flex-1">
          <div className="flex items-center justify-between gap-4.5">
            <div>
              <div className="text-xl font-semibold">{profile.name}</div>
            </div>
            {isOwner ? (
              <div className='flex gap-2'>
                <button
                  onClick={() => navigate(`/settings/edit-profile`)}
                  className=" profilebut  bg-green-700 text-white">
                    Edit profile
                </button>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="cursor-pointer">
                    <IoMdSettings className='text-3xl'/>
                </button>
              </div>
            ) : (
              <div className='flex gap-2'>
                {!profile.is_following ? (
                  <button onClick={handleFollow} className=" followbutton bg-green-700 text-white">Follow</button>
                ) : (
                  <button onClick={handleUnfollow} className="followbutton buttondark text-white ">Unfollow</button>
                )}

                <button onClick={handleMessage} className="followbutton buttondark text-white">Message</button>

                {/* ellipsis / more actions button */}
                <button
                  onClick={() => setActionsOpen(true)}
                  aria-label="More options"
                  className="cursor-pointer"
                  title="More"
                >
                  {/* simple ellipsis icon (SVG) */}
                  <FaEllipsis className='text-3xl'/>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">@{profile.username}</div>

              <div className="mt-4 text-sm max-w-xl md:max-w-md text-gray-500">{profile.bio}</div>
        
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                {profile.website && (
                  <div className='flex items-center gap-2'>
                    <IoLink className='text-lg -rotate-45'/>
                    <a
                      href={(profile.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-700 font-semibold"
                    >
                      {stripProtocol(profile.website)}
                    </a>
                  </div>
                )}


                {profile.email && isVisible('email') && (
                  <div className='flex items-center gap-2'>
                    <span><MdOutlineMail className='text-lg'/></span>
                    {profile.email}
                  </div>
                )}
                
                {profile.location && isVisible('location') && (
                  <div className='flex items-center gap-2'>
                    <span><IoLocationOutline className='text-lg'/></span>
                    {profile.location}
                  </div>
                )}

                {profile.dob && isVisible('dob') && (
                  <div className='flex items-center gap-2'>
                    <span><IoBalloonOutline className='text-lg'/></span>
                    <span>Born {formatDOB(profile.dob)}</span>
                  </div>
                )}

              </div>

              <div className="mt-4 text-sm text-gray-600 flex gap-10">
                <div>
                  <span className='font-bold text-black'>{profile.posts_count} </span>
                  <span>posts</span>
                </div>
                <div>
                  <span className='font-bold text-black'>{profile.followers_count} </span>
                  <span>followers</span>
                </div>
                <div>
                  <span className='font-bold text-black'>{profile.following_count} </span>
                  <span>following</span>
                </div>
              </div>
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
      <AnimatePresence>
        {settingsOpen && (
          <ProfileSettingsModal
            onClose={() => setSettingsOpen(false)}
            onRequestDelete={handleDeleteRequest}
          />
        )}
      </AnimatePresence>

      {/* Actions modal opened by the "..." button */}
      <AnimatePresence>
        {actionsOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActionsOpen(false)}
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
              <h3 className="text-lg font-semibold mb-3 text-white">More</h3>

              <div className="space-y-3">
                {/* BLOCK / UNBLOCK moved here */}
                <div className="flex gap-2">
                  {profile.is_blocked_by_viewer ? (
                    <button
                      onClick={() => { setActionsOpen(false); handleUnblock(); }}
                      className="w-full px-3 py-2 bg-white/10 hover:bg-white/5 text-white rounded hover:scale-[1.02] transition cursor-pointer"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => { setActionsOpen(false); handleBlock(); }}
                      disabled={blocking}
                      className="profilebutton profilebuttonred"
                    >
                      Block
                    </button>
                  )}
                </div>
                <div className="flex flex-col  gap-2 mt-1">
                  <button
                    onClick={() => { setActionsOpen(false); handleReport(); }}
                    className="profilebutton"
                  >
                    Report
                  </button>
                  <button
                    onClick={() => { setActionsOpen(false); handleShare(); }}
                    className="profilebutton"
                  >
                    Share
                  </button>
                </div>

                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => setActionsOpen(false)}
                    className="profilebutclose"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
