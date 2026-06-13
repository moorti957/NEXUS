import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  User, MapPin, Briefcase, Clock, DollarSign, Star, TrendingUp, Users, FolderKanban,
  CheckCircle, Award, Globe, Github, Linkedin, Instagram, Facebook, Dribbble,
  Edit3, Save, X, Camera, Calendar, Activity, ThumbsUp, Zap, Shield, Target, Smartphone,
  Mail, Phone, Globe as GlobeIcon, Plus, BookOpen, Code, Layers, TrendingDown, Building,
  Link as LinkIcon, FileText, CheckSquare, MessageCircle, Bell, UserCheck, Heart, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import api from '../services/api';
import Button from '../components/common/Button';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';

// ---------------------- Helper Components (existing) ----------------------
const CountUp = ({ end = 0, duration = 2 }) => {
  const finalValue = Number(end) || 0;

  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;

    const increment =
      finalValue / (duration * 60);

    const timer = setInterval(() => {
      start += increment;

      if (start >= finalValue) {
        setCount(finalValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [finalValue, duration]);

  return <span>{finalValue}</span>;
};

const StatRow = ({ icon, label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <div className="flex items-center gap-2 text-gray-400">{icon} {label}</div>
    <div className="font-semibold">{typeof value === 'number' ? <CountUp end={Number(value) || 0} /> : value}</div>
  </div>
);

const ProjectCard = ({ project, variant }) => {
  let statusColor = '';
  let statusText = '';
  if (variant === 'active') {
    statusColor = 'text-emerald-400';
    statusText = 'Active';
  } else if (variant === 'completed') {
    statusColor = 'text-blue-400';
    statusText = 'Completed';
  } else {
    statusColor = 'text-gray-400';
    statusText = 'Recent';
  }
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
      <div>
        <h4 className="font-semibold">{project.title}</h4>
        <p className="text-xs text-gray-400">Budget: ${project.budget} • Freelancer: {project.freelancerName || '—'}</p>
      </div>
      <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
    </div>
  );
};

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

const ClientProfileSkeleton = () => (
  <SkeletonTheme baseColor="#111827" highlightColor="#1f2937">
    <div className="min-h-screen pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Skeleton height={40} width={300} className="mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3"><Skeleton height={400} /></div>
          <div className="lg:col-span-6 space-y-6"><Skeleton height={200} /><Skeleton height={200} /><Skeleton height={200} /></div>
          <div className="lg:col-span-3"><Skeleton height={200} /></div>
        </div>
      </div>
    </div>
  </SkeletonTheme>
);

// ---------------------- Blog & Post Components ----------------------
const PostCard = ({ post, onLike, onDelete, onEdit, showManage = false }) => {
  const navigate = useNavigate();
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
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10" required />
          <textarea placeholder="Excerpt (short summary)" rows={2} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10" required />
          <textarea placeholder="Full content" rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10" required />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <option>technology</option><option>design</option><option>development</option><option>business</option><option>tutorials</option>
          </select>
          <input type="text" placeholder="Icon (emoji)" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10" />
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} fullWidth>{loading ? 'Publishing...' : 'Publish Post'}</Button>
            <Button type="button" variant="glass" onClick={onClose} fullWidth>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------- Tabs Components ----------------------
const UserPostsTab = ({ userId }) => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchMyPosts = async () => {
    try {
      console.log("POST API CALL =>", `/posts/user/${userId}`);

      const { data } = await api.get(`/posts/user/${userId}`);

      console.log("POST RESPONSE =>", data);

      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
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
          <h3 className="text-xl font-semibold mb-2">You haven't posted any projects yet</h3>
          <p className="text-gray-400 mb-6">Create your first project requirement to attract freelancers.</p>
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

const AcceptedFreelancersTab = () => {
  const { showToast } = useToast();
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollabs = async () => {
      try {
        const res = await api.get('/collaborations/mine');

        console.log("COLLAB RESPONSE =", res.data);

        setCollabs(
          Array.isArray(res.data)
            ? res.data
            : res.data.data || []
        );
      } catch (err) {
        showToast('Failed to load collaborations', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCollabs();
  }, []);

  const openChat = (freelancerId) => {
    window.location.href = `/chat?with=${freelancerId}`;
  };

  const removeCollaboration = async (collabId) => {
    if (!window.confirm('Remove this freelancer from accepted list?')) return;
    try {
      await api.delete(`/posts/collaboration/${collabId}`);
      setCollabs(prev => prev.filter(c => c._id !== collabId));
      showToast('Freelancer removed', 'success');
    } catch {
      showToast('Failed to remove', 'error');
    }
  };

  if (loading) return <div className="text-center py-10"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (collabs.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
        <div className="text-6xl mb-4">🤝</div>
        <h3 className="text-xl font-semibold mb-2">No freelancers accepted yet</h3>
        <p className="text-gray-400">When you accept a freelancer's proposal, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(collabs || []).map(collab => (
        <div key={collab._id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-lg font-bold">
              {collab.freelancer?.name?.charAt(0) || 'F'}
            </div>
            <div>
              <h3 className="font-semibold">{collab.freelancer?.name}</h3>
              <p className="text-sm text-gray-400">{collab.freelancer?.skills?.slice(0, 3).join(', ') || 'Freelancer'}</p>
              <p className="text-xs text-gray-500">Accepted: {new Date(collab.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="glass" onClick={() => openChat(collab.freelancer._id)} iconLeft={<MessageCircle size={14} />}>Chat</Button>
            <Button size="sm" variant="glass" as={Link} to={`/profile/${collab.freelancer._id}`}>View Profile</Button>
            <Button size="sm" variant="glass" onClick={() => removeCollaboration(collab._id)} iconLeft={<X size={14} />} className="text-red-400">Remove</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const NotificationsTab = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  if (loading) return <div className="text-center py-10"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
        <div className="text-6xl mb-4">🔔</div>
        <h3 className="text-xl font-semibold mb-2">No notifications</h3>
        <p className="text-gray-400">When freelancers comment or you accept proposals, notifications will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map(notif => (
        <div key={notif._id} className={`rounded-xl p-4 border transition-all ${notif.read ? 'bg-white/5 border-white/10' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
              {notif.sender?.avatar ? <img src={notif.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : <span className="text-sm font-bold">{notif.sender?.name?.charAt(0)}</span>}
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{notif.sender?.name}</span> {notif.message}
              </p>
              <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
              {notif.post && (
                <Link to={`/posts/${notif.post._id}`} onClick={() => markAsRead(notif._id)} className="text-xs text-indigo-400 hover:underline mt-2 inline-block">
                  View post →
                </Link>
              )}
            </div>
            {!notif.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------- Main ClientProfile Component ----------------------
export default function ClientProfile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeProjects, setActiveProjects] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);



  const hasFetched = useRef(false);

  const fetchClientProfile = useCallback(async () => {
    try {
      setLoading(true);

      const [profileRes, statsRes, projectsRes, notifRes] = await Promise.all([
        api.get('/profile'),
        api.get('/clients/stats'),
        api.get('/clients/projects'),
        api.get('/notifications/unread-count').catch(() => ({ data: 0 }))
      ]);

      console.log("PROFILE RESPONSE =", profileRes.data);

      setProfile(profileRes.data.data.profile);
      console.log(
  "UPDATED PROFILE DATA =",
  profileRes.data.data.profile
);
      setStats(profileRes.data.data.stats);

      setActiveProjects(projectsRes.data.data.active || []);
      setCompletedProjects(projectsRes.data.data.completed || []);
      setRecentProjects(projectsRes.data.data.recent || []);
      setUnreadCount(notifRes.data?.count || 0);

    } catch (error) {
      console.error("PROFILE ERROR:", error);
      showToast('Failed to load client profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (hasFetched.current) return;

    hasFetched.current = true;
    fetchClientProfile();
  }, [fetchClientProfile]);

  const handleEditOpen = () => {
    setFormData({
      name: profile?.name || '',
      username: profile?.username || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || '',
      companyName: profile?.companyName || '',
      companyWebsite: profile?.companyWebsite || '',
      industry: profile?.industry || '',
      city: profile?.city || '',
      country: profile?.country || '',
      shortBio: profile?.shortBio || '',
      aboutCompany: profile?.aboutCompany || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
  e.preventDefault();

  console.log("FORM DATA =", formData);

  setUpdating(true);

  try {
    const res = await api.put('/profile', formData);

    console.log("UPDATE RESPONSE =", res.data);

    showToast('Profile updated successfully', 'success');
    setEditModalOpen(false);
    fetchClientProfile();
  } catch (error) {
    console.log("UPDATE ERROR =", error.response?.data);
    showToast(error.response?.data?.message || 'Update failed', 'error');
  } finally {
    setUpdating(false);
  }
};

  if (loading) return <ClientProfileSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-indigo-950/40 pt-24 px-4 md:px-8 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Client Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage your projects and hired freelancers</p>
          </div>
          <Button onClick={handleEditOpen} variant="glass" className="flex items-center gap-2">
            <Edit3 size={18} /> Edit Profile
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-8 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Activity size={16} /> },
            { id: 'posts', label: 'My Posts', icon: <FileText size={16} /> },
            { id: 'freelancers', label: 'Accepted Freelancers', icon: <UserCheck size={16} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={16} />, badge: unreadCount }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR - Profile Card (always visible) */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold overflow-hidden">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    profile?.name?.charAt(0) || 'C'
                  )}
                </div>
                <h2 className="text-xl font-bold mt-4">{profile?.name|| 'Unknown User'}</h2>
                <p className="text-indigo-400">{profile?.email}</p>
                <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm">
                  <CheckCircle size={14} /> Verified Account
                </div>
                <div className="mt-4 w-full text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-gray-400">Company</span><span>{profile?.companyName || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Industry</span><span>{profile?.industry || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Location</span><span>{profile?.city}, {profile?.country}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Member since</span><span>{new Date(profile?.createdAt).getFullYear()}</span></div>
                </div>
              </div>
            </motion.div>

            {/* Business Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-5"
            >
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Business Stats</h3>
              <div className="space-y-3">
                <StatRow icon={<FolderKanban size={16} />} label="Projects Posted" value={stats?.totalProjects || 0} />
                <StatRow icon={<CheckSquare size={16} />} label="Active Projects" value={stats?.activeProjects || 0} />
                <StatRow icon={<CheckCircle size={16} />} label="Completed Projects" value={stats?.completedProjects || 0} />
                <StatRow icon={<Users size={16} />} label="Freelancers Hired" value={stats?.totalFreelancersHired || 0} />
              </div>
            </motion.div>
          </div>

          {/* CENTER CONTENT - dynamic based on activeTab */}
          <div className="lg:col-span-6 space-y-6">
            {activeTab === 'dashboard' && (
              <>
                {/* Hero Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{profile?.name}</h2>
                      <p className="text-indigo-400">{profile?.companyName}</p>
                      <p className="text-gray-300 mt-2">{profile?.shortBio}</p>
                      <div className="flex flex-wrap gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-400"><Mail size={14} /> {profile?.email || 'No Email'}</div>
                        <div className="flex items-center gap-1 text-gray-400"><MapPin size={14} /> {profile?.city}, {profile?.country}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-1">
                        <CheckCircle size={14} /> Verified Business
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h3 className="font-semibold mb-2">About Company</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{profile?.aboutCompany || 'No company description provided.'}</p>
                  </div>
                </motion.div>

                {/* Contact Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Phone size={18} /> Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-300"><Mail size={16} /> {profile?.email || 'No Email'}</div>
                    <div className="flex items-center gap-2 text-gray-300"><Phone size={16} /> {profile?.phone || 'Not provided'}</div>
                    {profile?.companyWebsite && (
                      <div className="flex items-center gap-2 text-gray-300 col-span-2">
                        <GlobeIcon size={16} />
                        <a href={profile.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                          {profile.companyWebsite}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-300 col-span-2"><MapPin size={16} /> {profile?.city}, {profile?.country}</div>
                  </div>
                </motion.div>

                {/* Active Projects */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold flex items-center gap-2"><Clock size={18} /> Active Projects</h3>
                    <button className="text-indigo-400 text-sm">View All →</button>
                  </div>
                  {activeProjects.length === 0 ? <p className="text-gray-400 text-sm">No active projects.</p> : (
                    <div className="space-y-3">{activeProjects.slice(0, 3).map(p => <ProjectCard key={p.id} project={p} variant="active" />)}</div>
                  )}
                </motion.div>

                {/* Completed Projects */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><CheckCircle size={18} /> Completed Projects</h3>
                  {completedProjects.length === 0 ? <p className="text-gray-400 text-sm">No completed projects.</p> : (
                    <div className="space-y-3">{completedProjects.slice(0, 3).map(p => <ProjectCard key={p.id} project={p} variant="completed" />)}</div>
                  )}
                </motion.div>

                {/* Recently Posted */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-6"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><FileText size={18} /> Recently Posted</h3>
                  {recentProjects.length === 0 ? <p className="text-gray-400 text-sm">No recently posted projects.</p> : (
                    <div className="space-y-3">{recentProjects.map(p => <ProjectCard key={p.id} project={p} variant="recent" />)}</div>
                  )}
                </motion.div>
              </>
            )}

            {activeTab === 'posts' && <UserPostsTab userId={user?._id} />}
            {activeTab === 'freelancers' && <AcceptedFreelancersTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
          </div>

          {/* RIGHT SIDEBAR - empty for layout balance */}
          <div className="lg:col-span-3"></div>
        </div>
      </div>

      {/* Edit Profile Modal (existing, unchanged) */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit Client Profile</h2>
                <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-full hover:bg-white/10"><X size={20} /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="Full Name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  <InputField label="Username" name="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                  <InputField label="Email" type="email" name="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  <InputField label="Phone" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  <InputField label="Company Name" name="companyName" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                  <InputField label="Company Website" name="companyWebsite" value={formData.companyWebsite} onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })} />
                  <InputField label="Industry" name="industry" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />
                  <InputField label="City" name="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  <InputField label="Country" name="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                </div>
                <InputField label="Short Bio" name="shortBio" value={formData.shortBio} onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })} textarea rows={2} />
                <InputField label="About Company" name="aboutCompany" value={formData.aboutCompany} onChange={(e) => setFormData({ ...formData, aboutCompany: e.target.value })} textarea rows={3} />
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