// components/EditProfileModal.jsx
import { useEffect, useState } from 'react';
import { updateProfile, uploadAvatar, checkUsername } from '../services/profile';
import { useToasts } from '../context/ToastContext';

export default function EditProfileModal({ onClose, user, token }) {
  const { addToast } = useToasts();

  const [form, setForm] = useState({
    username: user.username,
    name: user.name || '',
    bio: user.bio || '',
    website: user.website || '',
    dob: user.dob || '',
    dob_visible: user.dob_visible || false,
    email: user.email || '',
    email_visible: user.email_visible || false,
    location: user.location || '',
    location_visible: user.location_visible || false,
    profile_pic: user.profile_pic || ''
  });

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(f => ({ ...f, username: user.username, name: user.name || '' }));
    // eslint-disable-next-line
  }, [user]);

  const handleUsernameBlur = async () => {
    const username = (form.username || '').trim();
    if (!username || username.toLowerCase() === user.username.toLowerCase()) {
      setAvailable(true);
      return;
    }
    setChecking(true);
    try {
      const res = await checkUsername(token, username);
      setAvailable(!!res.available);
    } catch (err) {
      addToast('Failed to check username', 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    // preview will be handled by file input and we will upload on save
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // if avatar file uploaded -> upload first
      if (avatarFile) {
        const up = await uploadAvatar(token, avatarFile);
        if (up && up.profile_pic) setForm(f => ({ ...f, profile_pic: up.profile_pic }));
      }

      // Build payload
      const payload = {
        username: form.username,
        name: form.name,
        bio: form.bio,
        website: form.website,
        dob: form.dob || null,
        dob_visible: !!form.dob_visible,
        email: form.email,
        email_visible: !!form.email_visible,
        location: form.location,
        location_visible: !!form.location_visible,
        profile_pic: form.profile_pic
      };

      const res = await updateProfile(token, payload);
      addToast('Profile updated', 'success');
      onClose();
    } catch (err) {
      console.error('save profile', err);
      addToast(err?.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg p-6 z-60 max-w-lg w-full shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Edit profile</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm">Username</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} onBlur={handleUsernameBlur} className="w-full border px-2 py-1 rounded" />
            {checking && <div className="text-xs text-gray-500">Checking...</div>}
            {available === false && <div className="text-xs text-red-600">Username taken</div>}
            {available === true && <div className="text-xs text-green-600">Available</div>}
          </div>

          <div>
            <label className="text-sm">Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border px-2 py-1 rounded" />
          </div>

          <div>
            <label className="text-sm">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className="w-full border px-2 py-1 rounded" rows={3} />
          </div>

          <div>
            <label className="text-sm">Website</label>
            <input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full border px-2 py-1 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Date of birth</label>
              <input type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} className="w-full border px-2 py-1 rounded" />
              <label className="inline-flex items-center gap-2 text-xs mt-1"><input type="checkbox" checked={form.dob_visible} onChange={e => setForm({ ...form, dob_visible: e.target.checked })} /> Make DOB visible</label>
            </div>
            <div>
              <label className="text-sm">Location</label>
              <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full border px-2 py-1 rounded" />
              <label className="inline-flex items-center gap-2 text-xs mt-1"><input type="checkbox" checked={form.location_visible} onChange={e => setForm({ ...form, location_visible: e.target.checked })} /> Show location</label>
            </div>
          </div>

          <div>
            <label className="text-sm">Email</label>
            <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border px-2 py-1 rounded" />
            <label className="inline-flex items-center gap-2 text-xs mt-1"><input type="checkbox" checked={form.email_visible} onChange={e => setForm({ ...form, email_visible: e.target.checked })} /> Show email</label>
          </div>

          <div>
            <label className="text-sm">Profile picture</label>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
            {form.profile_pic && <img src={form.profile_pic} alt="preview" className="w-20 h-20 rounded-full mt-2 object-cover" />}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
            <button onClick={handleSave} disabled={saving || checking || available === false} className="px-4 py-1 bg-indigo-600 text-white rounded">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
