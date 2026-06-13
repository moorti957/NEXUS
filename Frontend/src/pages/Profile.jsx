import { useState, useEffect, useCallback } from 'react';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  User, MapPin, Briefcase, Clock, DollarSign, Star, TrendingUp, Users, FolderKanban,
  CheckCircle, Award, Globe, Github, Linkedin, Instagram, Facebook, Dribbble,
  Edit3, Save, X, Camera, Calendar, Activity, ThumbsUp, Zap, Shield, Target, Smartphone,
  Mail, Phone, Globe as GlobeIcon, Plus, BookOpen, Code, Layers, TrendingDown, MessageCircle, FileText, UserCheck
} from 'lucide-react';
import { FaBehance } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import api from '../services/api';
import Button from '../components/common/Button';
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';

// ---------------------- Helper Components ----------------------
const CountUp = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count.toLocaleString()}</span>;
};

const StatRow = ({ icon, label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-2 text-gray-400">{icon} {label}</div>
    <div className="font-semibold">{typeof value === 'number' ? <CountUp end={value} /> : value}</div>
  </div>
);

const SocialIcon = ({ href, icon, label }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-indigo-500/20 transition-colors">
    {icon}
  </a>
);

const AchievementBadge = ({ icon, label }) => (
  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm">
    {icon} {label}
  </div>
);

const InputField = ({ label, name, value, onChange, type = 'text', textarea = false, rows = 1 }) => (
  <div>
    <label className="text-sm text-gray-400">{label}</label>
    {textarea ? (
      <textarea name={name} value={value} onChange={onChange} rows={rows} className="w-full mt-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none" />
    ) : (
      <input type={type} name={name} value={value} onChange={onChange} className="w-full mt-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none" />
    )}
  </div>
);

const ProfileSkeleton = () => (
  <SkeletonTheme baseColor="#111827" highlightColor="#1f2937">
    <div className="min-h-screen pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Skeleton height={40} width={300} className="mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3"><Skeleton height={400} /></div>
          <div className="lg:col-span-6 space-y-6"><Skeleton height={200} /><Skeleton height={200} /><Skeleton height={200} /></div>
          <div className="lg:col-span-3 space-y-6"><Skeleton height={200} /><Skeleton height={200} /></div>
        </div>
      </div>
    </div>
  </SkeletonTheme>
);

// ---------------------- Blog Components ----------------------
const PostCard = ({ post, onLike, onDelete, onEdit, showManage = false }) => {
  const navigate = useNavigate();
  const isLiked = post.likes?.includes?.(post.author?._id) || false;

  return (
    <div className="group relative rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all duration-500 overflow-hidden">
      <div onClick={() => navigate(`/posts/${post._id}`)} className="block p-6 cursor-pointer">
        <div className="text-3xl mb-4">{post.image || '📝'}</div>
        <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">
          {post.category}
        </span>
        <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-gray-400 text-sm mb-6 line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">
              {post.author?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium">{post.author?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <button onClick={(e) => { e.stopPropagation(); onLike(post._id); }} className="flex items-center gap-1 hover:text-red-400 transition-colors">
              <FiHeart className="w-4 h-4" /> {post.likes?.length || 0}
            </button>
            <span className="flex items-center gap-1"><FiMessageCircle className="w-4 h-4" /> {post.comments?.length || 0}</span>
          </div>
        </div>
      </div>
      {showManage && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(post); }} className="p-2 rounded-full bg-black/50 hover:bg-indigo-500/50 transition">
            <FiEdit2 size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(post._id); }} className="p-2 rounded-full bg-black/50 hover:bg-red-500/50 transition">
            <FiTrash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

const CreatePostModal = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: '', excerpt: '', content: '', category: 'technology', image: '📝'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/posts', form);
      onCreated(data);
      showToast('Post created!', 'success');
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-[#1a1a24] to-[#13131a] border border-white/10 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold gradient-text">Create New Post</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10" required />
          <textarea placeholder="Excerpt (short summary)" rows={2} value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10" required />
          <textarea placeholder="Full content" rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10" required />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <option>technology</option><option>design</option><option>development</option><option>business</option><option>tutorials</option>
          </select>
          <input type="text" placeholder="Icon (emoji)" value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10" />
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} fullWidth>{loading ? 'Publishing...' : 'Publish Post'}</Button>
            <Button type="button" variant="glass" onClick={onClose} fullWidth>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserPostsTab = () => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchMyPosts = async () => {
    try {
      const { data } = await api.get('/posts/my-posts');
      setPosts(data);
    } catch {
      showToast('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyPosts(); }, []);

  const handleLike = async (postId) => {
    try {
      const { data } = await api.put(`/posts/like/${postId}`);
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: data.likes } : p));
    } catch { showToast('Like failed', 'error'); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      showToast('Post deleted', 'success');
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleEdit = (post) => {
    showToast('Edit feature coming soon', 'info');
  };

  const handleCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  if (loading) return <div className="text-center py-10"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowCreateModal(true)} iconLeft={<Plus size={16} />}>Create Post</Button>
      </div>
      {posts.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-400 mb-6">You haven't published any posts. Share your expertise!</p>
          <Button onClick={() => setShowCreateModal(true)}>Create your first post</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map(post => (
            <PostCard key={post._id} post={post} onLike={handleLike} onDelete={handleDelete} onEdit={handleEdit} showManage={true} />
          ))}
        </div>
      )}
      {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />}
    </div>
  );
};

const CollaborationsTab = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);

 

const fetchedRef = useRef(false);

useEffect(() => {
  if (fetchedRef.current) return;

  fetchedRef.current = true;

  const fetchCollabs = async () => {
    try {
      const { data } = await api.get('/posts/my-collaborations');
      setCollabs(data);
    } catch (err) {
      showToast('Failed to load collaborations', 'error');
    } finally {
      setLoading(false);
    }
  };

  fetchCollabs();
}, []);



  const openChat = (otherUserId) => {
    window.location.href = `/chat?with=${otherUserId}`;
  };

  if (loading) return <div className="text-center py-10"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (collabs.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
        <div className="text-6xl mb-4">🤝</div>
        <h3 className="text-xl font-semibold mb-2">No collaborations yet</h3>
        <p className="text-gray-400">When clients accept your proposals, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {collabs.map(collab => (
        <div key={collab._id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-lg font-bold">
              {collab.client?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h3 className="font-semibold">{collab.client?.name}</h3>
              <p className="text-sm text-gray-400">{collab.client?.companyName || 'Client'}</p>
              <p className="text-xs text-gray-500">Project: {collab.post?.title}</p>
              <p className="text-xs text-gray-500">Accepted: {new Date(collab.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="glass" onClick={() => openChat(collab.client._id)} iconLeft={<MessageCircle size={14} />}>Chat</Button>
            <Button size="sm" variant="glass" as={Link} to={`/profile/${collab.client._id}`}>View Profile</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------- Main Component ----------------------
export default function FreelancerProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [earningsData, setEarningsData] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

 

const hasFetched = useRef(false);

const fetchFullProfile = useCallback(async () => {
  try {
    setLoading(true);

    const [
      profileRes,
      statsRes,
      projectsRes,
      earningsRes,
      analyticsRes
    ] = await Promise.all([
      api.get('/freelancer-profile/full-profile'),
      api.get('/profile/stats'),
      api.get('/profile/projects'),
      api.get('/profile/earnings'),
      api.get('/profile/analytics')
    ]);

    setProfile(profileRes.data.data.profile);
    setStats(statsRes.data.data);
    setProjects(projectsRes.data.data);
    setEarningsData(earningsRes.data.data || []);
    setAnalytics(analyticsRes.data.data || {});
    setActivities(profileRes.data.data.recentActivity || []);

  } catch (error) {
    console.error('Profile Load Error:', error);
    showToast('Failed to load profile data', 'error');
  } finally {
    setLoading(false);
  }
}, [showToast]);

useEffect(() => {
  if (hasFetched.current) return;

  hasFetched.current = true;
  fetchFullProfile();
}, [fetchFullProfile]);

  const handleEditOpen = () => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      username: profile?.username || '',
      shortBio: profile?.shortBio || '',
      about: profile?.about || '',
      city: profile?.city || '',
      country: profile?.country || '',
      skills: profile?.skills?.join(', ') || '',
      languages: profile?.languages?.join(', ') || '',
      experienceLevel: profile?.experienceLevel || '',
      hourlyRate: profile?.hourlyRate || '',
      phone: profile?.phone || '',
      email: profile?.email || user?.email || '',
      socialLinks: profile?.socialLinks || {
        portfolio: '', instagram: '', facebook: '', linkedin: '', github: '', behance: '', dribbble: ''
      }
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()),
        languages: formData.languages.split(',').map(l => l.trim())
      };
      await api.put(
  '/freelancer-profile/update-profile',
  payload
);
      showToast('Profile updated successfully', 'success');
      setEditModalOpen(false);
      fetchFullProfile();
    } catch (error) {
      showToast(error.response?.data?.message || 'Update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const safeEarningsData = Array.isArray(earningsData) ? earningsData : [];
  const safeProjectsData = Array.isArray(analytics?.projectsByMonth) ? analytics.projectsByMonth : [];

  if (loading) return <ProfileSkeleton />;

  let completionScore = 0;
  if (profile) {
    if (profile.avatar) completionScore += 10;
    if (profile.shortBio?.length > 20) completionScore += 10;
    if (profile.skills?.length >= 3) completionScore += 15;
    if (profile.languages?.length >= 1) completionScore += 10;
    if (profile.socialLinks && Object.values(profile.socialLinks).some(v => v)) completionScore += 15;
    if (profile.portfolio) completionScore += 10;
    if (profile.experienceLevel) completionScore += 10;
    if (profile.phone || profile.email) completionScore += 10;
    if (profile.about?.length > 50) completionScore += 10;
  }

  const missingItems = [];
  if (!profile?.avatar) missingItems.push('Profile Photo');
  if (!profile?.shortBio) missingItems.push('Short Bio');
  if (profile?.skills?.length < 3) missingItems.push('Skills (min 3)');
  if (!profile?.languages?.length) missingItems.push('Languages');
  if (!profile?.socialLinks?.portfolio) missingItems.push('Portfolio Website');
  if (!profile?.socialLinks?.linkedin) missingItems.push('LinkedIn Profile');
  if (!profile?.about) missingItems.push('About Section');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-indigo-950/40 pt-24 px-4 md:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Freelancer Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage your professional profile and track your success</p>
          </div>
          <Button onClick={handleEditOpen} variant="glass" className="flex items-center gap-2">
            <Edit3 size={18} /> Edit Profile
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-8 overflow-x-auto">
          {['dashboard', 'posts', 'collaborations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
                activeTab === tab ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'dashboard' && <Activity size={16} />}
              {tab === 'posts' && <FileText size={16} />}
              {tab === 'collaborations' && <UserCheck size={16} />}
              <span className="capitalize">{tab}</span>
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR - always visible */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold overflow-hidden">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      profile?.name?.charAt(0) || 'F'
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold mt-4">{profile?.name}</h2>
                <p className="text-indigo-400">@{profile?.username || profile?.firstName}</p>
                <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                  <CheckCircle size={12} /> Freelancer
                </span>
                <div className="mt-4 space-y-2 w-full text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Experience</span><span className="capitalize">{profile?.experienceLevel}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Location</span><span>{profile?.city}, {profile?.country}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Verified</span></div>
                </div>

                <div className="w-full mt-6 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Profile Completion</span><span className="font-semibold">{completionScore}%</span></div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${completionScore}%` }} transition={{ duration: 0.8 }} />
                  </div>
                  <div className="mt-3 text-left">
                    <p className="text-xs text-gray-400 mb-1">Missing:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {missingItems.map((item, i) => (<li key={i} className="flex items-center gap-1"><Plus size={10} /> {item}</li>))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-5"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Freelancer Stats</h3>
              <div className="space-y-3">
                <StatRow icon={<FolderKanban size={16} />} label="Total Projects" value={stats?.totalProjects || 0} />
                <StatRow icon={<CheckCircle size={16} />} label="Completed" value={stats?.completedProjects || 0} />
                <StatRow icon={<Clock size={16} />} label="Active" value={stats?.activeProjects || 0} />
                <StatRow icon={<Users size={16} />} label="Total Clients" value={stats?.totalClients || 0} />
                <StatRow icon={<DollarSign size={16} />} label="Total Earnings" value={`$${(stats?.totalEarnings || 0).toLocaleString()}`} />
                <StatRow icon={<TrendingUp size={16} />} label="Monthly Earnings" value={`$${(stats?.monthlyEarnings || 0).toLocaleString()}`} />
                <StatRow icon={<Star size={16} />} label="Avg Rating" value={stats?.avgRating || 0} />
                <StatRow icon={<Users size={16} />} label="Repeat Clients" value={stats?.repeatClients || 0} />
              </div>
            </motion.div>
          </div>

          {/* CENTER CONTENT - changes based on activeTab */}
          <div className="lg:col-span-6 space-y-6">
            {activeTab === 'dashboard' && (
              <>
                {/* Hero Profile Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{profile?.name}</h2>
                      <p className="text-indigo-400">{profile?.email}</p>
                      <p className="text-gray-300 mt-2">{profile?.shortBio}</p>
                      <div className="flex flex-wrap gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-400"><Briefcase size={14} /> {profile?.experienceLevel}</div>
                        <div className="flex items-center gap-1 text-gray-400"><Calendar size={14} /> Member since {new Date(profile?.createdAt).getFullYear()}</div>
                        <div className="flex items-center gap-1 text-gray-400"><Activity size={14} /> Last active: {profile?.lastActive ? new Date(profile.lastActive).toLocaleDateString() : 'Today'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-1"><Zap size={14} /> Available for work</div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{profile?.about || 'No about section added yet.'}</p>
                  </div>
                </motion.div>

                {/* Professional Info */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Briefcase size={18} /> Professional Info</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="text-xs text-gray-400">Skills</label><div className="flex flex-wrap gap-2 mt-1">{profile?.skills?.map(skill => (<span key={skill} className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs">{skill}</span>))}</div></div>
                    <div><label className="text-xs text-gray-400">Languages</label><div className="flex flex-wrap gap-2 mt-1">{profile?.languages?.map(lang => (<span key={lang} className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs">{lang}</span>))}</div></div>
                    <div><label className="text-xs text-gray-400">Hourly Rate</label><p className="text-lg font-semibold text-emerald-400">${profile?.hourlyRate || 0}<span className="text-sm text-gray-400">/hr</span></p></div>
                    <div><label className="text-xs text-gray-400">Years of Experience</label><p>{profile?.yearsOfExperience || 0} years</p></div>
                  </div>
                </motion.div>

                {/* Social Links */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe size={18} /> Social & Portfolio</h3>
                  <div className="flex flex-wrap gap-3">
                    {profile?.socialLinks?.portfolio && <SocialIcon href={profile.socialLinks.portfolio} icon={<GlobeIcon />} label="Portfolio" />}
                    {profile?.socialLinks?.github && <SocialIcon href={profile.socialLinks.github} icon={<Github />} label="GitHub" />}
                    {profile?.socialLinks?.linkedin && <SocialIcon href={profile.socialLinks.linkedin} icon={<Linkedin />} label="LinkedIn" />}
                    {profile?.socialLinks?.instagram && <SocialIcon href={profile.socialLinks.instagram} icon={<Instagram />} label="Instagram" />}
                    {profile?.socialLinks?.facebook && <SocialIcon href={profile.socialLinks.facebook} icon={<Facebook />} label="Facebook" />}
                    {profile?.socialLinks?.behance && <SocialIcon href={profile.socialLinks.behance} icon={<FaBehance />} label="Behance" />}
                    {profile?.socialLinks?.dribbble && <SocialIcon href={profile.socialLinks.dribbble} icon={<Dribbble />} label="Dribbble" />}
                  </div>
                </motion.div>

                {/* Project Showcase */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-semibold flex items-center gap-2"><FolderKanban size={18} /> Project Showcase</h3><button className="text-indigo-400 text-sm">View All →</button></div>
                  {projects.length === 0 ? <p className="text-gray-400 text-sm">No projects yet.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.slice(0, 4).map(project => (
                        <div key={project.id} className="rounded-xl bg-white/5 p-3 border border-white/10">
                          <img src={project.thumbnail} alt={project.name} className="w-full h-32 object-cover rounded-lg mb-2" />
                          <h4 className="font-semibold">{project.name}</h4>
                          <p className="text-xs text-gray-400">{project.category}</p>
                          <div className="flex justify-between mt-2 text-xs"><span>Client: {project.clientName}</span><span className="text-emerald-400">${project.budget}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Recent Activity */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity size={18} /> Recent Activity</h3>
                  <div className="space-y-3">
                    {activities.map((act, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm border-b border-white/10 pb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center"><Clock size={14} /></div>
                        <div className="flex-1">{act.description}</div>
                        <div className="text-xs text-gray-400">{new Date(act.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Achievements */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Award size={18} /> Achievements</h3>
                  <div className="flex flex-wrap gap-3">
                    <AchievementBadge icon={<Star />} label="Top Rated" />
                    <AchievementBadge icon={<Zap />} label="Fast Delivery" />
                    <AchievementBadge icon={<TrendingUp />} label="Rising Talent" />
                    <AchievementBadge icon={<Shield />} label="Expert Freelancer" />
                    {stats?.totalProjects >= 100 && <AchievementBadge icon={<Award />} label="100 Projects" />}
                  </div>
                </motion.div>
              </>
            )}

            {activeTab === 'posts' && <UserPostsTab />}
            {activeTab === 'collaborations' && <CollaborationsTab />}
          </div>

          {/* RIGHT SIDEBAR - stats charts */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Monthly Earnings</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={safeEarningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1b2e', border: 'none' }} />
                  <Line type="monotone" dataKey="earnings" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Projects Completed</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={safeProjectsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-5">
              <div className="flex justify-between items-center mb-3"><h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Profile Views</h3><span className="text-2xl font-bold">{analytics?.profileViews || 0}</span></div>
              <div className="flex items-center gap-2 text-sm"><TrendingUp size={14} className="text-emerald-400" /><span className="text-emerald-400">+{analytics?.viewsGrowth || 0}%</span><span className="text-gray-400">from last month</span></div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setEditModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Edit Profile</h2><button onClick={() => setEditModalOpen(false)} className="p-1 rounded-full hover:bg-white/10"><X size={20} /></button></div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="First Name" name="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  <InputField label="Username" name="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                  <InputField label="Email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <InputField label="Phone" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  <InputField label="City" name="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  <InputField label="Country" name="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                  <select name="experienceLevel" value={formData.experienceLevel} onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <option value="">Experience Level</option><option value="entry">Entry Level</option><option value="intermediate">Intermediate</option><option value="expert">Expert</option>
                  </select>
                  <InputField label="Hourly Rate ($)" name="hourlyRate" type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} />
                </div>
                <InputField label="Short Bio" name="shortBio" value={formData.shortBio} onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })} textarea rows={2} />
                <InputField label="About" name="about" value={formData.about} onChange={(e) => setFormData({ ...formData, about: e.target.value })} textarea rows={3} />
                <InputField label="Skills (comma separated)" name="skills" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
                <InputField label="Languages (comma separated)" name="languages" value={formData.languages} onChange={(e) => setFormData({ ...formData, languages: e.target.value })} />
                <div className="border-t border-white/10 pt-4">
                  <p className="font-semibold mb-2">Social Links</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <InputField label="Portfolio URL" name="socialLinks.portfolio" value={formData.socialLinks?.portfolio} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, portfolio: e.target.value } })} />
                    <InputField label="GitHub" name="socialLinks.github" value={formData.socialLinks?.github} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, github: e.target.value } })} />
                    <InputField label="LinkedIn" name="socialLinks.linkedin" value={formData.socialLinks?.linkedin} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })} />
                    <InputField label="Instagram" name="socialLinks.instagram" value={formData.socialLinks?.instagram} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })} />
                    <InputField label="Facebook" name="socialLinks.facebook" value={formData.socialLinks?.facebook} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, facebook: e.target.value } })} />
                    <InputField label="Behance" name="socialLinks.behance" value={formData.socialLinks?.behance} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, behance: e.target.value } })} />
                    <InputField label="Dribbble" name="socialLinks.dribbble" value={formData.socialLinks?.dribbble} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, dribbble: e.target.value } })} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="glass" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updating} className="flex items-center gap-2">
                    {updating ? <><Save size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}