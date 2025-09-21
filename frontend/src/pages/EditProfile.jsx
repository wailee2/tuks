// pages/EditProfile
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUsername as apiCheckUsername, getProfile, updateProfile, uploadAvatar } from '../services/profile';
import { AuthContext } from '../context/AuthContext';
import { useToasts } from '../context/ToastContext';

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,30}$/;
const MAX_BIO = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfilePage() {
  const { user, token, refreshUser, refreshProfile } = useContext(AuthContext);
  const { addToast } = useToasts();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    name: '',
    bio: '',
    website: '',
    dob: '',
    dob_visible: false,
    email: '',
    email_visible: false,
    location: '',
    location_visible: false,
    profile_pic: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // availability checks for username
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // username edit guard
  const [usernameEditable, setUsernameEditable] = useState(false);

  // avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // validation / server errors
  const [errors, setErrors] = useState({});

  // debounce refs
  const usernameTimer = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      addToast('You must be signed in to edit your profile', 'error');
      navigate('/login');
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const p = await getProfile(user.username, token);
        if (!mounted) return;
        setForm({
          username: p.username || user.username,
          name: p.name || user.name || '',
          bio: p.bio || '',
          website: p.website || '',
          dob: p.dob || '',
          dob_visible: !!p.dob_visible,
          email: p.email || user.email || '',
          email_visible: !!p.email_visible,
          location: p.location || '',
          location_visible: !!p.location_visible,
          profile_pic: p.profile_pic || ''
        });
      } catch (err) {
        console.error('loading profile for edit', err);
        addToast('Failed to load profile', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line
  }, [user?.username, token]);

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAvatarPreview(null);
    }
  }, [avatarFile]);

  // SVG spinner
  const Spinner = ({ label = '' }) => (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      {label}
    </div>
  );
  // small, accessible toggle switch (place above the component return or at top of file)
  const ToggleSwitch = ({ checked, onChange, label, ariaLabel, className = '' }) => (
    <label className={`inline-flex items-center gap-3 mt-1 cursor-pointer ${className}`}>
      <span className="text-xs">{label}</span>

      <div className="relative w-10 h-6">
        {/* the real clickable element: spans the whole toggle area, accessible */}
        <input
          type="checkbox"
          checked={!!checked}
          onChange={e => onChange(e.target.checked)}
          aria-label={ariaLabel}
          className="absolute inset-0 w-full h-full opacity-0 z-20"
        />

        {/* track */}
        <div className={`w-full h-full rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`} />

        {/* knob */}
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </div>
    </label>
  );


  // debounce username check
  const handleUsernameChange = (value) => {
    setForm(f => ({ ...f, username: value }));
    setUsernameAvailable(null);
    setErrors(e => ({ ...e, username: undefined }));

    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      const v = (value || '').trim();
      if (!v || v.toLowerCase() === user.username.toLowerCase() || !USERNAME_RE.test(v)) {
        setUsernameAvailable(v.toLowerCase() === user.username.toLowerCase() ? true : null);
        return;
      }
      setCheckingUsername(true);
      try {
        const res = await apiCheckUsername(token, v);
        setUsernameAvailable(!!res.available);
      } catch (err) {
        console.error('check username', err);
        addToast('Could not check username availability', 'error');
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
  };

  const handleAvatarSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg','image/png','image/webp'].includes(f.type)) {
      addToast('Only JPEG/PNG/WebP images allowed', 'error');
      return;
    }
    if (f.size > 1 * 1024 * 1024) {
      addToast('Image too large (max 1MB)', 'error');
      return;
    }
    setAvatarFile(f);
  };

  // client-side validation
  const validate = () => {
    const e = {};
    if (!form.username || !USERNAME_RE.test(form.username)) e.username = '3–30 chars: letters, numbers, ._-';
    if (form.website && !/^https?:\/\//i.test(form.website) && !/^$/.test(form.website)) {
      e.website = 'Website must start with http:// or https://';
    }
    if (form.bio && form.bio.length > MAX_BIO) e.bio = `Bio must be under ${MAX_BIO} characters`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    // client validation first
    if (!validate()) {
      addToast('Please fix validation errors', 'error');
      return;
    }

    if (usernameAvailable === false) {
      setErrors(prev => ({ ...prev, username: 'Username is taken' }));
      addToast('Username unavailable', 'error');
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // 1) Upload avatar if a file was selected (use avatarFile state)
      // We keep the uploaded URL in a local var so we don't rely on setForm sync.
      let uploadedProfilePic = null;
      if (avatarFile) {
        const upRes = await uploadAvatar(token, avatarFile);
        uploadedProfilePic = upRes?.profile_pic_busted || upRes?.profile_pic || null;

        // update UI state immediately
        if (uploadedProfilePic) {
          // add a cache-buster if server returned same filename (optional)
          const busted = uploadedProfilePic.includes('?') ? `${uploadedProfilePic}&v=${Date.now()}` : `${uploadedProfilePic}?v=${Date.now()}`;
          setForm(prev => ({ ...prev, profile_pic: busted }));
        }
        // clear selection after successful upload
        setAvatarFile(null);
        setAvatarPreview(null);

        // --- NEW: refresh global profile in AuthContext so Sidebar/Header update ---
        try {
          if (typeof refreshProfile === 'function') {
            await refreshProfile();
          }
        } catch (err) {
          console.warn('refreshProfile failed after avatar upload', err);
        }
      }


      // 2) Normalize website input
      const rawWebsite = (form.website || '').trim();
      const normalizedWebsite = rawWebsite
        ? (/^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`)
        : undefined;

      // 3) usernameToSend logic (only if user unlocked and changed it)
      const usernameToSend = (usernameEditable &&
        form.username &&
        form.username.trim().toLowerCase() !== (user.username || '').toLowerCase())
        ? form.username.trim()
        : undefined;

      // 4) Build payload - use uploadedProfilePic if present, otherwise current form.profile_pic
      const payloadRaw = {
        username: usernameToSend,
        name: form.name?.trim() || undefined,
        bio: form.bio?.trim() || undefined,
        website: typeof normalizedWebsite !== 'undefined' ? normalizedWebsite : undefined,
        dob: form.dob || undefined,
        dob_visible: typeof form.dob_visible === 'boolean' ? !!form.dob_visible : undefined,
        email_visible: typeof form.email_visible === 'boolean' ? !!form.email_visible : undefined,
        location: form.location?.trim() || undefined,
        location_visible: typeof form.location_visible === 'boolean' ? !!form.location_visible : undefined,
        profile_pic: uploadedProfilePic ?? (form.profile_pic && form.profile_pic.trim() !== '' ? form.profile_pic : undefined)
      };

      // 5) strip undefined keys and convert blank strings to null
      const payload = {};
      Object.entries(payloadRaw).forEach(([k, v]) => {
        if (typeof v === 'undefined') return;
        if (typeof v === 'string' && v.trim() === '') payload[k] = null;
        else payload[k] = v;
      });

      console.log('Profile update payload:', payload);

      // 6) Call update endpoint
      const res = await updateProfile(token, payload);
      console.log('updateProfile response', res);

      addToast('Profile updated', 'success');

      // refresh auth user data if available
      if (refreshUser) {
        await refreshUser();
      }

      // navigate to profile (use returned username if backend changed it)
      const newUsername = payload.username || form.username || user.username;
      navigate(`/${encodeURIComponent(newUsername)}`);
    } catch (err) {
      console.error('save profile - full error', err);
      console.error('err.response?.status', err?.response?.status);
      console.error('err.response?.data', err?.response?.data);

      const data = err?.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const map = {};
        data.errors.forEach(x => map[x.param || 'server'] = x.msg || x);
        setErrors(map);
        addToast('Fix the highlighted errors', 'error');
      } else if (data?.message) {
        addToast(data.message, 'error');
      } else {
        addToast('Failed to update profile', 'error');
      }
    } finally {
      setSaving(false);
    }
  };




  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600 flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              <img
                src={avatarPreview || form.profile_pic || '/default-anon.png'}
                alt="avatar"
                className="w-full h-full object-cover"
              />
              <label className="absolute bottom-2 right-2 bg-white bg-opacity-90 text-gray-700 px-2 py-1 text-xs rounded cursor-pointer shadow">
                Change
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </label>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Edit profile</h1>
            <p className="text-sm text-gray-500 mt-1">Update personal details. Changes to username will change your public profile URL.</p>
            <div className="mt-3 text-sm text-gray-600">
              <div className="font-medium">{user.name || user.username}</div>
              <div className="text-gray-400">@{user.username}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={`mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Your full name"
            />
            {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
          </div>

          {/* Username with guarded edit */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <button
                type="button"
                onClick={() => setUsernameEditable(s => !s)}
                className="text-sm text-indigo-600 hover:underline"
              >
                {usernameEditable ? 'Lock' : 'Edit'}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <input
                value={form.username}
                onChange={e => handleUsernameChange(e.target.value)}
                className={`flex-1 rounded-md border-gray-200 shadow-sm px-3 py-2 ${errors.username ? 'border-red-500' : ''}`}
                aria-invalid={!!errors.username}
                readOnly={!usernameEditable}
              />

              <div className="w-28">
                {checkingUsername ? (
                  <Spinner label="Checking..." />
                ) : usernameAvailable === true ? (
                  <div className="text-green-600 text-sm">Available</div>
                ) : usernameAvailable === false ? (
                  <div className="text-red-600 text-sm">Taken</div>
                ) : null}
              </div>
            </div>
            {errors.username && <div className="text-xs text-red-600 mt-1">{errors.username}</div>}
            <div className="text-xs mt-2">
              {!usernameEditable ? (
                <span className="text-gray-500">Username is locked to prevent accidental changes. Click <span className="text-indigo-600">Edit</span> to change it.</span>
              ) : (
                <span className="text-yellow-700">Warning: changing your username will change your profile URL and may break external links. Choose carefully.</span>
              )}
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              value={form.email}
              className={`mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 ${errors.email ? 'border-red-500' : ''}`}
              readOnly
              aria-readonly
            />
            <div className="text-xs text-gray-500 mt-1">Email is used for authentication and cannot be changed here. Contact support to update it.</div>
            {errors.email && <div className="text-xs text-red-600 mt-1">{errors.email}</div>}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className={`mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 ${errors.bio ? 'border-red-500' : ''}`}
              rows={4}
            />
            <div className="text-xs text-gray-500 mt-1">{(form.bio || '').length}/{MAX_BIO}</div>
            {errors.bio && <div className="text-xs text-red-600 mt-1">{errors.bio}</div>}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <input
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className={`mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2 ${errors.website ? 'border-red-500' : ''}`}
              placeholder="https://your-website.com"
            />
            {errors.website && <div className="text-xs text-red-600 mt-1">{errors.website}</div>}
          </div>

          {/* DOB & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* old DOB toggle block -> replace with: */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of birth</label>
              <input type="date" value={form.dob || ''} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2" />

              <ToggleSwitch
                checked={form.dob_visible}
                onChange={(val) => setForm(f => ({ ...f, dob_visible: val }))}
                label="Make DOB visible"
                ariaLabel="Make date of birth visible"
              />
            </div>


            {/* Location field */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-1 block w-full rounded-md border-gray-200 shadow-sm px-3 py-2" />

              <ToggleSwitch
                checked={form.location_visible}
                onChange={(val) => setForm(f => ({ ...f, location_visible: val }))}
                label="Show location"
                ariaLabel="Show location"
              />
            </div>

          </div>

          {/* Email visibility */}
          <div>
            <ToggleSwitch
              checked={form.email_visible}
              onChange={(val) => setForm(f => ({ ...f, email_visible: val }))}
              label="Make email visible to others"
              ariaLabel="Make email visible to others"
            />
          </div>


          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button onClick={() => navigate(`/${user.username}`)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button onClick={handleSave} disabled={saving || checkingUsername} className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-2 disabled:opacity-60">
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Saving...
                </>
              ) : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
