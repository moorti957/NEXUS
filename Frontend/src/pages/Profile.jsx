import { useState, useEffect } from 'react';

import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile as updateProfileService } from '../services/profileService';
import {
  Camera,
  Save,
  Key,
  Moon,
  Sun,
  LogOut,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  getProfile,
 
  uploadAvatar,
  deleteAvatar,
  changePassword,
  getActivity,
  getStats,
  deleteAccount,
} from '../services/profileService';

// Custom hook for form validation (simplified)
const useProfileForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    const validationErrors = validate(values);
    setErrors(validationErrors);
  };

  return { values, errors, touched, handleChange, handleBlur, setValues };
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isDark, setIsDark] = useState(
    localStorage.getItem('theme') !== 'light'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
   const BASE_URL = import.meta.env.VITE_API_URL;

const [avatarPreview, setAvatarPreview] = useState(
  user?.avatar ? `${BASE_URL}${user.avatar}` : ''
);

  // Stats & Activity state
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Form validation rules
  const validateProfile = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(values.email))
      errors.email = 'Email is invalid';
    return errors;
  };

  const {
    values: profile,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValues,
  } = useProfileForm(
    {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      position: user?.position || '',
      location: user?.location || '',
      bio: user?.bio || '',
    },
    validateProfile
  );

  // Fetch profile data on mount
  useEffect(() => {
  let mounted = true;

  const fetchProfile = async () => {
    try {
      const data = await getProfile();

      if (!mounted) return;

      const userData = data.data.profile;

      setValues({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        company: userData.company || '',
        position: userData.position || '',
        location: userData.location || '',
        bio: userData.bio || '',
      });

   setAvatarPreview(
  userData.avatar ? `${BASE_URL}${userData.avatar}` : ''
);
      updateProfile(userData);

    } catch (error) {
      console.log(error);
    }
  };

  fetchProfile();

  return () => {
    mounted = false;
  };
}, []);

  // Fetch stats when component mounts or user changes
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const data = await getStats();
        setStats(data.data);
      } catch (error) {
        toast.error('Failed to load stats');
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch activity when activity tab becomes active
  useEffect(() => {
    if (activeTab === 'activity') {
      const fetchActivity = async () => {
        setIsLoadingActivity(true);
        try {
          const data = await getActivity();
          setActivities(data.data || []);
        } catch (error) {
          toast.error('Failed to load activity');
        } finally {
          setIsLoadingActivity(false);
        }
      };
      fetchActivity();
    }
  }, [activeTab]);

  // Avatar upload handler
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: validate file type & size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const data = await uploadAvatar(file);

setAvatarPreview(`${BASE_URL}${data.data.avatar}`);

updateProfile({ ...user, avatar: data.data.avatar });
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Avatar upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await deleteAvatar();
      setAvatarPreview('');
      updateProfile({ ...user, avatar: '' });
      toast.success('Avatar removed');
    } catch (error) {
      toast.error('Failed to remove avatar');
    }
  };

  // Profile save handler
const handleSaveProfile = async () => {
  const validationErrors = validateProfile(profile);

  if (Object.keys(validationErrors).length > 0) {
    toast.error('Please fix the errors before saving');
    return;
  }

  setIsSaving(true);

  try {
    // ✅ API call
    const data = await updateProfileService(profile);

    console.log("API RESPONSE:", data);

    // ✅ Context update (IMPORTANT FIX)
    if (typeof updateProfile === "function") {
      updateProfile(data?.data?.profile || data?.data || {});
    }

    toast.success(data?.message || 'Profile updated successfully!');

  } catch (error) {
    console.log("ERROR:", error.response || error);

    toast.error(
      error?.response?.data?.message || 'Something went wrong'
    );
  } finally {
    setIsSaving(false);
  }
};

  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password change failed');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Account deletion handler
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      toast.error('Password is required');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword, deleteConfirm);
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Account deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out');
  };

  // Theme toggle
  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  return (
    <div
      className={`min-h-screen pt-28 px-6 transition-colors duration-300 ${
        isDark ? 'bg-gray-1000 text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        {/* Header with theme toggle (optional, uncomment if needed) */}
        {/* <div className="flex justify-end mb-6">
          <Button variant="glass" onClick={toggleTheme} className="!p-2 rounded-full">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div> */}

        {/* Tabs Navigation */}
        <div className="flex space-x-1 mb-8 border-b border-white/10">
          {['profile', 'security', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-indigo-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT PROFILE CARD */}
            <div
              className={`rounded-2xl p-8 backdrop-blur-xl border ${
                isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/80 border-gray-200'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Camera size={16} />
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                  </label>
                  {avatarPreview && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute bottom-0 left-0 p-2 bg-red-600 rounded-full cursor-pointer hover:bg-red-700 transition"
                      title="Remove avatar"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <h2 className="text-2xl font-bold mt-4">{profile.name}</h2>
                <p className="text-gray-400 capitalize">{user?.role}</p>

                <div className="mt-8 space-y-4 w-full">
                  {isLoadingStats ? (
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Active Projects</span>
                        <span>{stats?.activeProjects ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Unread Messages</span>
                        <span>{stats?.unreadMessages ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Notifications</span>
                        <span>{stats?.unreadNotifications ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Profile Completion</span>
                        <span>{stats?.profileCompletion ?? 0}%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE PROFILE FORM */}
            <div
              className={`lg:col-span-2 rounded-2xl p-10 backdrop-blur-xl border ${
                isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/80 border-gray-200'
              }`}
            >
              <h2 className="text-2xl font-bold mb-8">Profile Information</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">Full Name</label>
                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border ${
                      touched.name && errors.name
                        ? 'border-red-500'
                        : 'border-white/10'
                    }`}
                  />
                  {touched.name && errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border ${
                      touched.email && errors.email
                        ? 'border-red-500'
                        : 'border-white/10'
                    }`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-400">Phone</label>
                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400">Company</label>
                  <input
                    name="company"
                    value={profile.company}
                    onChange={handleChange}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400">Position</label>
                  <input
                    name="position"
                    value={profile.position}
                    onChange={handleChange}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400">Location</label>
                  <input
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm text-gray-400">Bio</label>
                <textarea
                  name="bio"
                  rows="4"
                  value={profile.bio}
                  onChange={handleChange}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 mt-8">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </Button>

                <Button
                  variant="glass"
                  onClick={() => setActiveTab('security')}
                  className="flex items-center gap-2"
                >
                  <Key size={18} /> Change Password
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div
            className={`rounded-2xl p-10 backdrop-blur-xl border ${
              isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <h2 className="text-2xl font-bold mb-8">Security Settings</h2>

            <div className="space-y-6 max-w-xl">
              <form onSubmit={handlePasswordChange}>
                <div>
                  <label className="text-sm text-gray-400">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full mt-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="mt-4 flex items-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div
            className={`rounded-2xl p-10 backdrop-blur-xl border ${
              isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <h2 className="text-2xl font-bold mb-8">Recent Activity</h2>
            {isLoadingActivity ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-gray-400">No activity found.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div
                    key={act._id || act.id}
                    className="flex justify-between items-center py-3 border-b border-white/10"
                  >
                    <span>{act.action || act.description}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DANGER ZONE - Always visible at bottom */}
        <div className="mt-12 border border-red-500/30 rounded-2xl p-6 bg-red-500/5">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Logging out will end your current session. Deleting your account is
            permanent.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              <LogOut size={18} /> Logout
            </Button>

            {/* Delete account section */}
            <div className="flex-1">
              <div className="flex gap-2 items-center">
                <input
                  type="password"
                  placeholder="Your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm"
                />
                <input
                  type="text"
                  placeholder='Type "DELETE" to confirm'
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm"
                />
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  variant="glass"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} /> Delete Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}