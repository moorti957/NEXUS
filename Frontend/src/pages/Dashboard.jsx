import api from '../services/api';
import ServiceManagerTab from '../pages/Servicemanagertab';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../socket/context/SocketContext';
import { useNotifications } from "../context/NotificationContext";
import ChatModal from '../components/chat/ChatModal';
import { InviteFreelancersModal } from '../components/InviteFreelancersModal';

import {
  FiHome,
  FiFolder,
  FiBarChart2,
  FiUsers,
  FiUser,
  FiSettings,
  FiBell,
  FiGrid,
  FiZap,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiMoreVertical,
  FiStar,
  FiHeart,
  FiMessageCircle,
  FiUserCheck,
  FiFolderPlus,
  FiBellOff,
  FiUserX,
  FiTrash2,
  FiX
  
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";


// Import socket events
import {
  emitJoinProject,
  emitLeaveProject,
  onProjectUpdated,
  onProjectStatusUpdated,
  onTaskAdded,
  onTaskCompleted,
  onProjectError
} from '../socket/events/projectEvents';

import {
  onUserOnline,
  onUserOffline,
  onUserStatusChange,
  onTypingIndicator
} from '../socket/events/presenceEvents';

const getAvatarUrl = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { socket, isConnected } = useSocket();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // State management
  const [activeTab, setActiveTab] = useState('overview');

  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState({});
  const [recentProjects, setRecentProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [freelancers, setFreelancers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [showMuteMenuFor, setShowMuteMenuFor] = useState(null);
  const menuRef = useRef(null);

  const [chatUser, setChatUser] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);

  const [activityData, setActivityData] = useState([]);
  const [invitedIds, setInvitedIds] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [freelancersLoading, setFreelancersLoading] = useState(false);
  const [allProjects, setAllProjects] = useState([]);

  const fetchedRef = useRef(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: '',
    position: '',
    phone: '',
    location: '',
    bio: '',
    avatar: user?.avatar || getAvatarUrl(user?.name || 'User'),
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
  });

  // New states for advanced team management
  const [pinnedMembers, setPinnedMembers] = useState(() => {
    const saved = localStorage.getItem('pinnedMembers');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteMembers, setFavoriteMembers] = useState(() => {
    const saved = localStorage.getItem('favoriteMembers');
    return saved ? JSON.parse(saved) : [];
  });
  const [mutedMembers, setMutedMembers] = useState(() => {
    const saved = localStorage.getItem('mutedMembers');
    return saved ? JSON.parse(saved) : {};
  });
  const [blockedMembers, setBlockedMembers] = useState(() => {
    const saved = localStorage.getItem('blockedMembers');
    return saved ? JSON.parse(saved) : [];
  });
  const [memberUnreadCounts, setMemberUnreadCounts] = useState(() => {
    const saved = localStorage.getItem('memberUnreadCounts');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeMenuFor, setActiveMenuFor] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [assignProjectLoading, setAssignProjectLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Persist advanced states
  useEffect(() => {
    localStorage.setItem('pinnedMembers', JSON.stringify(pinnedMembers));
  }, [pinnedMembers]);
  useEffect(() => {
    localStorage.setItem('favoriteMembers', JSON.stringify(favoriteMembers));
  }, [favoriteMembers]);
  useEffect(() => {
    localStorage.setItem('mutedMembers', JSON.stringify(mutedMembers));
  }, [mutedMembers]);
  useEffect(() => {
    localStorage.setItem('blockedMembers', JSON.stringify(blockedMembers));
  }, [blockedMembers]);
  useEffect(() => {
    localStorage.setItem('memberUnreadCounts', JSON.stringify(memberUnreadCounts));
  }, [memberUnreadCounts]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchFreelancers = async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    try {
      setFreelancersLoading(true);
      const res = await api.get('/team/freelancers', { timeout: 60000 });
      if (res.data.success) {
        setFreelancers(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      fetchedRef.current = false;
    } finally {
      setFreelancersLoading(false);
    }
  };

  const handleSendInvite = async (id) => {
    console.log("👉 SENDING ID:", id);
    try {
      const res = await api.post('/team/invite', { memberId: id });
      console.log("✅ INVITE SUCCESS:", res.data);
      showToast('Invite sent successfully', 'success');
    } catch (err) {
      console.log("❌ INVITE ERROR FULL:", err.response?.data);
      showToast('Failed to send invite', 'error');
    }
  };

  const fetchPendingInvites = async () => {
    const res = await api.get('/team/invitations/pending');
    setPendingInvites(res.data.data);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch dashboard data from backend
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchAnalyticsData();
      fetchTeamMembers();
      fetchPendingInvites();
      fetchAllProjects();
    }
  }, [user]);

  // Socket real-time connections
  useEffect(() => {
    if (!user || !socket || !isConnected) return;
    socket.emit("join-user", user._id);
    if (recentProjects.length > 0) {
      recentProjects.forEach(project => {
        emitJoinProject(project._id);
      });
    }
    setupSocketListeners();
    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });
    return () => {
      removeSocketListeners();
      if (recentProjects.length > 0) {
        recentProjects.forEach(project => {
          emitLeaveProject(project._id);
        });
      }
    };
  }, [user, socket, isConnected, recentProjects]);

  const openChat = (member) => {
    setChatUser(member);
    setShowChatModal(true);
    // Mark messages as read for this member
    if (memberUnreadCounts[member._id]) {
      setMemberUnreadCounts(prev => ({
        ...prev,
        [member._id]: 0
      }));
    }
  };

  const handleNewProject = (project) => {
    setRecentProjects(prev => [project, ...prev]);
    setStats(prev => ({
      ...prev,
      totalProjects: (prev.totalProjects || 0) + 1,
      activeProjects: (prev.activeProjects || 0) + 1
    }));
    showToast(`New project created: ${project.name}`, 'success');
  };

  const setupSocketListeners = () => {
    if (!socket) return;
    onProjectUpdated((data) => { handleProjectUpdate(data); });
    onProjectStatusUpdated((data) => { handleProjectStatusUpdate(data); });
    onTaskAdded((data) => { handleTaskAdded(data); });
    onTaskCompleted((data) => { handleTaskCompleted(data); });
    onProjectError((data) => { showToast(data.message || "Project error occurred", "error"); });
    socket.on("project:created", (data) => { handleNewProject(data); });
    socket.on("user:online", (data) => { handleUserOnline(data); });
    socket.on("user:offline", (data) => { handleUserOffline(data); });
    socket.on("user:status-change", (data) => { handleUserStatusChange(data); });
    socket.on("user:typing", (data) => { handleTypingIndicator(data); });
  };

  const removeSocketListeners = () => {
    if (!socket) return;
    socket.off("project:created");
    socket.off("user:online");
    socket.off("user:offline");
    socket.off("user:status-change");
    socket.off("user:typing");
  };

  const handleProjectUpdate = (data) => {
    setRecentProjects(prev => prev.map(p => p._id === data.projectId ? { ...p, ...data.updates } : p));
    if (data.updates.progress) {
      showToast(`Project progress updated to ${data.updates.progress}%`, 'info');
    }
  };

  const getAvatarUrlFixed = (avatar, name) => {
    if (!avatar) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    }
    if (avatar.startsWith("http")) {
      return avatar;
    }
    return `${BASE_URL}${avatar}`;
  };

  const handleProjectStatusUpdate = (data) => {
    setRecentProjects(prev => prev.map(p => p._id === data.projectId ? { ...p, status: data.newStatus } : p));
    showToast(`Project ${data.projectName || ''} status: ${data.oldStatus} → ${data.newStatus}`, 'info');
  };

  const handleTaskAdded = (data) => {
    showToast(`New task assigned: ${data.task.title}`, 'info');
    fetchDashboardData();
  };

  const handleTaskCompleted = (data) => {
    showToast(`Task completed by ${data.completedBy}`, 'success');
    fetchDashboardData();
  };

  const handleUserOnline = (data) => {
    console.log("USER ONLINE:", data);
    setOnlineUsers(prev => prev.includes(data.userId) ? prev : [...prev, data.userId]);
  };

  const handleUserOffline = (data) => {
    console.log("USER OFFLINE:", data);
    setOnlineUsers(prev => prev.filter(id => id !== data.userId));
  };

  const handleUserStatusChange = (data) => {
    setTeamMembers(prev => prev.map(m => m._id === data.userId ? { ...m, status: data.newStatus } : m));
  };

  const handleTypingIndicator = (data) => {
    setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping ? data.name : null }));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/projects/my-dashboard");
      if (response.data.success) {
        const data = response.data.data;
        setDashboardData(data);
        setStats(data.stats || {});
        setRecentProjects(data.recentProjects || []);
        setActivityData(data.activityData || [40, 65, 80, 55, 70, 85, 60]);
        setProfileData(prev => ({
          ...prev,
          name: data.user?.name || prev.name,
          email: data.user?.email || prev.email,
          company: data.user?.company || prev.company,
          position: data.user?.position || prev.position,
          phone: data.user?.phone || prev.phone,
          location: data.user?.location || prev.location,
          bio: data.user?.bio || prev.bio,
          avatar: data.user?.avatar || prev.avatar,
          notifications: data.user?.notificationPreferences || prev.notifications
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get('/analytics/dashboard?period=month');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/team/my-team');
      console.log("TEAM MEMBERS =", response.data.data);
      if (response.data.success) {
        const membersData = response.data.data || [];
        const members = membersData.map(m => ({
          ...m,
          status: m.status || "offline"
        }));
        setTeamMembers(members);
        const onlineIds = membersData.filter(m => m.status === 'online').map(m => m._id);
        setOnlineUsers(onlineIds);
        // Initialize unread counts for new members if needed
        const newUnreadCounts = { ...memberUnreadCounts };
        members.forEach(member => {
          if (newUnreadCounts[member._id] === undefined) {
            newUnreadCounts[member._id] = Math.floor(Math.random() * 3); // demo random unread counts
          }
        });
        setMemberUnreadCounts(newUnreadCounts);
      }
    } catch (error) {
      console.error('❌ Error fetching team members:', error);
    }
  };

  const fetchAllProjects = async () => {
    try {
      const response = await api.get('/projects/my-projects');
      if (response.data.success) {
        setAllProjects(response.data.data || []);
      } else {
        setAllProjects(recentProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setAllProjects(recentProjects);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      showToast('Logged out successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Error logging out', 'error');
    }
  };

  const openMemberProfile = async (memberId) => {
    try {
      const res = await api.get(`/team/${memberId}`);
      if (res.data.success) {
        setSelectedMember(res.data.data.member);
        setShowMemberProfile(true);
      }
    } catch (err) {
      showToast("Failed to load profile", "error");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put('/profile', {
        name: profileData.name,
        email: profileData.email,
        company: profileData.company,
        position: profileData.position,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio
      });
      if (response.data.success) {
        updateProfile(response.data.data.user);
        setIsEditing(false);
        showToast('Profile updated successfully', 'success');
        socket.emit('auth:profile-updated', { updates: { name: profileData.name, avatar: profileData.avatar } });
      }
    } catch (error) {
      console.log("Backend Error:", error.response?.data);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = async (key) => {
    try {
      const newValue = !profileData.notifications[key];
      const response = await api.put('/profile/notifications', { ...profileData.notifications, [key]: newValue });
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: newValue } }));
        showToast('Notification settings updated', 'success');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      showToast('Failed to update settings', 'error');
    }
  };

  const handleMarkAllReadLocal = async () => {
    await markAllAsRead();
    showToast('All notifications marked as read', 'success');
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleMessageMember = (memberId) => {
    navigate(`/messages?user=${memberId}`);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    navigate('/notifications');
  };

  // Advanced team management actions
  const togglePinMember = (memberId) => {
    setPinnedMembers(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
    showToast(pinnedMembers.includes(memberId) ? 'Member unpinned' : 'Member pinned', 'success');
  };

  const toggleFavoriteMember = (memberId) => {
    setFavoriteMembers(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
    showToast(favoriteMembers.includes(memberId) ? 'Removed from favorites' : 'Added to favorites', 'success');
  };

  const muteMember = (memberId, duration) => {
    let mutedUntil;
    if (duration === 'forever') {
      mutedUntil = 'forever';
    } else {
      const now = Date.now();
      const durationMap = { hour: 60 * 60 * 1000, day: 24 * 60 * 60 * 1000 };
      mutedUntil = now + (duration === 'hour' ? durationMap.hour : duration === 'day' ? durationMap.day : durationMap.hour * 8);
    }
    setMutedMembers(prev => ({ ...prev, [memberId]: mutedUntil }));
    showToast('Notifications muted for this member', 'success');
    setActiveMenuFor(null);
  };

  const isMemberMuted = (memberId) => {
    const muteData = mutedMembers[memberId];
    if (!muteData) return false;
    if (muteData === 'forever') return true;
    if (Date.now() > muteData) {
      // Expired, clean up
      setMutedMembers(prev => {
        const newMuted = { ...prev };
        delete newMuted[memberId];
        return newMuted;
      });
      return false;
    }
    return true;
  };

  const removeMemberFromTeam = async (memberId) => {
    try {
      await api.delete(`/team/members/${memberId}`);
      showToast('Member removed from team', 'success');
      fetchTeamMembers();
    } catch (error) {
      console.error('Remove member error:', error);
      showToast('Failed to remove member', 'error');
    }
    setShowRemoveConfirm(null);
  };

  const blockMember = (memberId) => {
    setBlockedMembers(prev => [...prev, memberId]);
    showToast('Member blocked', 'info');
    setShowBlockConfirm(null);
  };

  const assignProjectToMember = async (memberId, projectId) => {
    if (!projectId) {
      showToast('Please select a project', 'error');
      return;
    }
    setAssignProjectLoading(true);
    try {
      await api.post(`/team/assign-project`, { memberId, projectId });
      showToast('Project assigned successfully', 'success');
      setShowAssignModal(null);
      setSelectedProjectId('');
    } catch (error) {
      console.error('Assign project error:', error);
      showToast('Failed to assign project', 'error');
    } finally {
      setAssignProjectLoading(false);
    }
  };

  // Filter and sort team members
  const getFilteredAndSortedMembers = () => {
    let filtered = teamMembers.filter(member => !blockedMembers.includes(member._id));
    const isOnline = (member) => onlineUsers.includes(member._id);
    const isPinned = (member) => pinnedMembers.includes(member._id);
    const isFavorite = (member) => favoriteMembers.includes(member._id);
    const getStatusOrder = (member) => {
      if (isOnline(member)) return 0;
      return 1;
    };
    return filtered.sort((a, b) => {
      if (isPinned(a) !== isPinned(b)) return isPinned(a) ? -1 : 1;
      if (isFavorite(a) !== isFavorite(b)) return isFavorite(a) ? -1 : 1;
      const statusDiff = getStatusOrder(a) - getStatusOrder(b);
      if (statusDiff !== 0) return statusDiff;
      return 0;
    });
  };

  const favoriteMembersList = getFilteredAndSortedMembers().filter(m => favoriteMembers.includes(m._id));
  const normalMembersList = getFilteredAndSortedMembers().filter(m => !favoriteMembers.includes(m._id));

  if (!user) return null;

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Team Member Card Component
 

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Reveal>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold font-display">
                  Welcome back, <span className="gradient-text">{profileData.name}</span>
                </h1>
                <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              </div>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-gray-400">{unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}</p>
            </Reveal>
          </div>
          <Reveal delay={400}>
            <div className="flex gap-4">
              <Button variant="glass" onClick={() => setActiveTab('profile')}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Profile
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Logout
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Navigation Tabs */}
        <Reveal delay={600}>
          <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
            {[
              { id: 'overview', label: 'Overview', icon: <FiHome /> },
              { id: 'services', label: 'Services', icon: <FiGrid /> },
              { id: 'projects', label: 'Projects', icon: <FiFolder /> },
              { id: 'analytics', label: 'Analytics', icon: <FiBarChart2 /> },
              { id: 'team', label: 'Team', icon: <FiUsers /> },
              { id: 'profile', label: 'Profile', icon: <FiUser /> },
              { id: 'settings', label: 'Settings', icon: <FiSettings /> },
              { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <span>{tab.icon}</span><span>{tab.label}</span>
                {tab.id === 'notifications' && unreadCount > 0 && <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 rounded-full">{unreadCount}</span>}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Projects', value: stats.totalProjects || 0, icon: <FiFolder />, change: stats.projectsGrowth || '+0%', gradient: 'from-indigo-500 to-purple-600' },
                  { label: 'Active Projects', value: stats.activeProjects || 0, icon: <FiZap />, change: stats.activeGrowth || '+0%', gradient: 'from-purple-500 to-pink-600' },
                  { label: 'Completed', value: stats.completedProjects || 0, icon: <FiCheckCircle />, change: stats.completedGrowth || '+0%', gradient: 'from-pink-500 to-orange-600' },
                  { label: 'Pending Tasks', value: stats.pendingTasks || 0, icon: <FiClock />, change: stats.pendingChange || '0', gradient: 'from-orange-500 to-yellow-600' },
                ].map((stat, index) => (
                  <Reveal key={stat.label} delay={index * 100} type="scale">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center justify-between mb-4"><span className="text-3xl text-white">{stat.icon}</span><span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stat.change}</span></div>
                      <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Activity Chart & Recent Projects */}
              <div className="grid lg:grid-cols-2 gap-8">
                <Reveal type="left">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold mb-6">Weekly Activity</h3>
                    <div className="h-48 flex items-end justify-between gap-2">
                      {activityData.map((value, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="relative w-full"><div className="w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-lg transition-all group-hover:from-purple-500 group-hover:to-pink-600" style={{ height: `${value * 1.5}px` }}><div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/10 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">{value} tasks</div></div></div>
                          <span className="text-xs text-gray-500">Day {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
                <Reveal type="right">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold">Recent Projects</h3><button onClick={() => setActiveTab('projects')} className="text-sm text-indigo-400 hover:text-indigo-300">View All</button></div>
                    <div className="space-y-4">
                      {recentProjects.slice(0, 4).map((project) => (
                        <div key={project._id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer" onClick={() => handleViewProject(project._id)}>
                          <div><h4 className="font-medium mb-1">{project.name}</h4><p className="text-xs text-gray-500">Due: {new Date(project.deadline).toLocaleDateString()}</p></div>
                          <div className="text-right"><span className={`inline-block px-2 py-1 rounded-full text-xs mb-2 ${project.status === 'Completed' ? 'bg-green-500/20 text-green-400' : ''}${project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : ''}${project.status === 'Review' ? 'bg-yellow-500/20 text-yellow-400' : ''}${project.status === 'Planning' ? 'bg-purple-500/20 text-purple-400' : ''}`}>{project.status}</span><div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: `${project.progress}%` }} /></div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Team & Notifications */}
              <div className="grid lg:grid-cols-2 gap-8">
                <Reveal type="left">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold">Team Members</h3><button onClick={() => setActiveTab('team')} className="text-sm text-indigo-400 hover:text-indigo-300">Manage Team</button></div>
                    <div className="space-y-4">
                      {teamMembers.slice(0, 4).map((member) => (
                        <div key={member._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold overflow-hidden">{member.avatar ? <img src={getAvatarUrlFixed(member.avatar, member.name)} alt={member.name} className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:white;font-weight:bold;">${getInitials(member.name)}</div>`; }} /> : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{getInitials(member.name)}</div>}</div><span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#13131a] ${onlineUsers.includes(member._id) ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} /></div>
                            <div><div className="font-medium">{member.name}</div><div className="text-xs text-gray-500">{member.role}</div></div>
                          </div>
                          <button onClick={() => openChat(member)} className="text-sm text-indigo-400 hover:text-indigo-300">Message {memberUnreadCounts[member._id] > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 rounded-full">{memberUnreadCounts[member._id]}</span>}</button>
                        </div>
                      ))}
                    </div>
                    {Object.values(typingUsers).filter(Boolean).length > 0 && (<div className="mt-4 text-xs text-gray-400 italic">{Object.values(typingUsers).filter(Boolean).join(', ')} typing...</div>)}
                  </div>
                </Reveal>
                <Reveal type="right">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold">Recent Notifications</h3><button onClick={handleMarkAllReadLocal} className="text-sm text-indigo-400 hover:text-indigo-300">Mark all read</button></div>
                    <div className="space-y-4">
                      {notifications.slice(0, 4).map((notification) => (
                        <div key={notification._id} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${notification.isRead ? 'bg-white/5' : 'bg-indigo-500/10'} hover:bg-white/10 cursor-pointer`} onClick={() => handleNotificationClick(notification)}>
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'contact' ? 'bg-green-500/20 text-green-400' : ''}${notification.type === 'message' ? 'bg-blue-500/20 text-blue-400' : ''}${notification.type === 'system' ? 'bg-yellow-500/20 text-yellow-400' : ''}${notification.type === 'project' ? 'bg-purple-500/20 text-purple-400' : ''}`}>{notification.type === 'contact' && '📧'}{notification.type === 'message' && '💬'}{notification.type === 'system' && '⚙️'}{notification.type === 'project' && '📁'}</span>
                          <div className="flex-1"><p className="text-sm font-medium">{notification.sender?.name || 'System'}</p><p className="text-xs text-gray-400 mt-1">{notification.message.length > 60 ? `${notification.message.substring(0, 60)}...` : notification.message}</p><p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleString()}</p></div>
                          {!notification.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
                        </div>
                      ))}
                      {notifications.length === 0 && <p className="text-gray-400 text-center py-4">No notifications</p>}
                      {notifications.length > 0 && (<div className="text-center mt-4"><button onClick={() => setActiveTab('notifications')} className="text-sm text-indigo-400 hover:text-indigo-300">View All Notifications</button></div>)}
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <Reveal>
              <div className="space-y-6">
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">All Projects</h2><Button onClick={handleCreateProject}>New Project</Button></div>
                <div className="grid gap-4">
                  {recentProjects.length === 0 ? <p className="text-gray-400">No projects found</p> : recentProjects.map((project) => (
                    <div key={project._id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer" onClick={() => handleViewProject(project._id)}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div><h3 className="text-xl font-bold mb-2">{project.name}</h3><p className="text-sm text-gray-400">Deadline: {new Date(project.deadline).toLocaleDateString()}</p><p className="text-xs text-gray-500 mt-1">Client: {project.client?.name || 'N/A'}</p></div>
                        <div className="flex items-center gap-6"><div className="text-right"><span className={`inline-block px-3 py-1 rounded-full text-sm mb-2 ${project.status === 'Completed' ? 'bg-green-500/20 text-green-400' : ''}${project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : ''}${project.status === 'Review' ? 'bg-yellow-500/20 text-yellow-400' : ''}${project.status === 'Planning' ? 'bg-purple-500/20 text-purple-400' : ''}${project.status === 'On Hold' ? 'bg-orange-500/20 text-orange-400' : ''}${project.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' : ''}`}>{project.status}</span></div><div className="w-32"><div className="flex justify-between text-sm mb-1"><span>Progress</span><span>{project.progress}%</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: `${project.progress}%` }} /></div></div><Button variant="glass" size="sm">View</Button></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {activeTab === 'services' && <ServiceManagerTab />}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Reveal>
              <div className="space-y-8">
                <h2 className="text-2xl font-bold">Analytics Overview</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { label: 'Total Revenue', value: `$${analytics.revenue?.total?.toLocaleString() || '0'}`, change: analytics.revenue?.growth || '+0%', icon: <FiDollarSign /> },
                    { label: 'Active Users', value: analytics.traffic?.uniqueVisitors?.toLocaleString() || '0', change: analytics.traffic?.growth || '+0%', icon: <FiUsers /> },
                    { label: 'Conversion Rate', value: `${analytics.conversions?.rate || '0'}%`, change: analytics.conversions?.growth || '+0%', icon: <FiBarChart2 /> },
                  ].map((stat) => (
                    <div key={stat.label} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-4"><span className="text-2xl">{stat.icon}</span><span className="text-sm text-green-400">{stat.change}</span></div>
                      <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10"><h3 className="text-lg font-bold mb-4">Traffic Sources</h3><div className="space-y-4">{analytics.traffic?.sources?.map((source, i) => (<div key={source.source}><div className="flex justify-between text-sm mb-1"><span>{source.source}</span><span>{Math.round(source.percentage)}%</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style={{ width: `${source.percentage}%` }} /></div></div>))}</div></div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10"><h3 className="text-lg font-bold mb-4">Project Categories</h3><div className="space-y-4">{analytics.projects?.byCategory?.map((cat, i) => (<div key={cat._id}><div className="flex justify-between text-sm mb-1"><span>{cat._id}</span><span>{cat.count} projects</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" style={{ width: `${(cat.count / analytics.projects.total) * 100}%` }} /></div></div>))}</div></div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Team Tab - Enhanced */}
          {activeTab === 'team' && (
            <Reveal>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Team Management</h2>
                  <Button onClick={() => { setInviteModalOpen(true); fetchFreelancers(); }}>Invite Member</Button>
                </div>

                {/* Favorite Members Section */}
                {favoriteMembersList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <FiHeart className="text-red-400" />
                      <h3 className="text-lg font-semibold"> Favorite Members</h3>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteMembersList.map((member) => (
                        <TeamMemberCard
    key={member._id}
    member={member}
    onlineUsers={onlineUsers}
    pinnedMembers={pinnedMembers}
    favoriteMembers={favoriteMembers}
    memberUnreadCounts={memberUnreadCounts}
    activeMenuFor={activeMenuFor}
    showMuteMenuFor={showMuteMenuFor}
    isMemberMuted={isMemberMuted}
    setActiveMenuFor={setActiveMenuFor}
    setShowMuteMenuFor={setShowMuteMenuFor}
    togglePinMember={togglePinMember}
    toggleFavoriteMember={toggleFavoriteMember}
    muteMember={muteMember}
    setShowAssignModal={setShowAssignModal}
    setShowBlockConfirm={setShowBlockConfirm}
    setShowRemoveConfirm={setShowRemoveConfirm}
    openChat={openChat}
    openMemberProfile={openMemberProfile}
    getAvatarUrlFixed={getAvatarUrlFixed}
    getInitials={getInitials}
/>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Members Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FiUsers />
                    <h3 className="text-lg font-semibold">All Team Members</h3>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {normalMembersList.map((member) => (
    <TeamMemberCard
        key={member._id}
        member={member}
        onlineUsers={onlineUsers}
        pinnedMembers={pinnedMembers}
        favoriteMembers={favoriteMembers}
        memberUnreadCounts={memberUnreadCounts}
        activeMenuFor={activeMenuFor}
        showMuteMenuFor={showMuteMenuFor}
        isMemberMuted={isMemberMuted}
        setActiveMenuFor={setActiveMenuFor}
        setShowMuteMenuFor={setShowMuteMenuFor}
        togglePinMember={togglePinMember}
        toggleFavoriteMember={toggleFavoriteMember}
        muteMember={muteMember}
        setShowAssignModal={setShowAssignModal}
        setShowBlockConfirm={setShowBlockConfirm}
        setShowRemoveConfirm={setShowRemoveConfirm}
        openChat={openChat}
        openMemberProfile={openMemberProfile}
        getAvatarUrlFixed={getAvatarUrlFixed}
        getInitials={getInitials}
    />
))}
                  </div>
                </div>

                {getFilteredAndSortedMembers().length === 0 && (
                  <div className="text-center py-12 text-gray-400">No team members found</div>
                )}
              </div>
            </Reveal>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Reveal>
              <div className="max-w-3xl mx-auto">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden relative">
                      <img src={getAvatarUrlFixed(profileData.avatar, profileData.name)} alt={profileData.name} className="w-full h-full object-cover" />
                      {isConnected && <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#13131a]" />}
                    </div>
                    <h2 className="text-2xl font-bold">{profileData.name}</h2>
                    <p className="text-gray-400">{profileData.position}</p>
                  </div>
                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium mb-2">Full Name</label><input type="text" name="name" value={profileData.name} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all" required /></div>
                        <div><label className="block text-sm font-medium mb-2">Email</label><input type="email" name="email" value={profileData.email} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all" required /></div>
                        <div><label className="block text-sm font-medium mb-2">Company</label><input type="text" name="company" value={profileData.company} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all" /></div>
                        <div><label className="block text-sm font-medium mb-2">Position</label><input type="text" name="position" value={profileData.position} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all" /></div>
                        <div><label className="block text-sm font-medium mb-2">Phone</label><input type="text" name="phone" value={profileData.phone} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all" /></div>
                        <div><label className="block text-sm font-medium mb-2">Location</label><input type="text" name="location" value={profileData.location} onChange={handleProfileChange} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all" /></div>
                      </div>
                      <div><label className="block text-sm font-medium mb-2">Bio</label><textarea name="bio" value={profileData.bio} onChange={handleProfileChange} rows="4" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all" /></div>
                      <div className="flex gap-4"><Button type="submit" loading={loading}>Save Changes</Button><Button type="button" variant="glass" onClick={() => setIsEditing(false)}>Cancel</Button></div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6"><div><p className="text-sm text-gray-400 mb-1">Email</p><p className="font-medium">{profileData.email}</p></div><div><p className="text-sm text-gray-400 mb-1">Company</p><p className="font-medium">{profileData.company || 'Not specified'}</p></div><div><p className="text-sm text-gray-400 mb-1">Phone</p><p className="font-medium">{profileData.phone || 'Not specified'}</p></div><div><p className="text-sm text-gray-400 mb-1">Location</p><p className="font-medium">{profileData.location || 'Not specified'}</p></div></div>
                      <div><p className="text-sm text-gray-400 mb-1">Bio</p><p className="text-gray-300">{profileData.bio || 'No bio provided'}</p></div>
                      <div className="flex gap-4"><Button onClick={() => setIsEditing(true)}>Edit Profile</Button><Button variant="glass" onClick={() => navigate('/profile/change-password')}>Change Password</Button></div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Reveal>
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10"><h3 className="text-xl font-bold mb-6">Notification Settings</h3><div className="space-y-4">{[
                  { key: 'email', label: 'Email Notifications', description: 'Receive email updates about your projects' },
                  { key: 'push', label: 'Push Notifications', description: 'Get push notifications in your browser' },
                  { key: 'marketing', label: 'Marketing Emails', description: 'Receive newsletters and promotional offers' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5"><div><h4 className="font-medium mb-1">{item.label}</h4><p className="text-sm text-gray-400">{item.description}</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={profileData.notifications[item.key]} onChange={() => handleNotificationToggle(item.key)} className="sr-only peer" /><div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-600"></div></label></div>
                ))}</div></div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10"><h3 className="text-xl font-bold mb-6">Security</h3><div className="space-y-4"><Button variant="glass" fullWidth onClick={() => navigate('/profile/change-password')}>Change Password</Button><Button variant="glass" fullWidth>Enable Two-Factor Authentication</Button><Button variant="glass" fullWidth>View Login History</Button></div></div>
                <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20"><h3 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h3><div className="space-y-4"><Button variant="danger" fullWidth>Delete Account</Button></div></div>
              </div>
            </Reveal>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Reveal>
              <div className="space-y-6">
                <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">All Notifications</h2><Button variant="glass" onClick={handleMarkAllReadLocal}>Mark All Read</Button></div>
                <div className="space-y-4">
                  {loading ? <div className="text-center py-12"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div></div> : notifications.length === 0 ? <div className="text-center py-12 text-gray-400">No notifications found</div> : notifications.map((notification) => (
                    <div key={notification._id} onClick={() => handleNotificationClick(notification)} className={`p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer ${!notification.isRead ? 'bg-indigo-500/5' : ''}`}>
                      <div className="flex items-start justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><span className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'contact' ? 'bg-green-500/20 text-green-400' : ''}${notification.type === 'message' ? 'bg-blue-500/20 text-blue-400' : ''}${notification.type === 'system' ? 'bg-yellow-500/20 text-yellow-400' : ''}${notification.type === 'project' ? 'bg-purple-500/20 text-purple-400' : ''}`}>{notification.type === 'contact' && '📧'}{notification.type === 'message' && '💬'}{notification.type === 'system' && '⚙️'}{notification.type === 'project' && '📁'}</span><h3 className="text-lg font-bold">{notification.name || 'System'}</h3>{!notification.isRead && <span className="px-2 py-1 text-xs bg-indigo-500/20 text-indigo-400 rounded-full">New</span>}</div><p className="text-gray-300 mb-2">{notification.message}</p><div className="flex items-center gap-4 text-xs text-gray-500"><span>{new Date(notification.createdAt).toLocaleString()}</span>{notification.sender?.email && <span>{notification.sender.email}</span>}{notification.sender?.phone && <span>{notification.sender.phone}</span>}</div></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Member Profile Modal */}
          {showMemberProfile && selectedMember && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="w-full max-w-xl bg-[#1a1a22] rounded-2xl p-8">
                <div className="flex justify-between mb-6"><h2 className="text-xl font-bold">Team Member</h2><button onClick={() => setShowMemberProfile(false)} className="text-gray-400 hover:text-white">✕</button></div>
                <div className="flex items-center gap-4 mb-6"><img src={getAvatarUrlFixed(selectedMember.avatar, selectedMember.name)} className="w-16 h-16 rounded-full object-cover" alt={selectedMember.name} /><div><h3 className="text-lg font-bold">{selectedMember.name}</h3><p className="text-sm text-gray-400">{selectedMember.role}</p><p className="text-xs text-gray-500">{selectedMember.email}</p></div></div>
                <div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-gray-400">Phone</p><p>{selectedMember.phone || "Not available"}</p></div><div><p className="text-gray-400">Location</p><p>{selectedMember.location || "Unknown"}</p></div><div><p className="text-gray-400">Projects</p><p>{selectedMember.projects?.length || 0}</p></div><div><p className="text-gray-400">Tasks</p><p>{selectedMember.tasksCompleted || 0}</p></div></div>
                <div className="flex gap-4 mt-6"><Button fullWidth onClick={() => { setShowMemberProfile(false); openChat(selectedMember); }}>Message</Button><Button variant="glass" fullWidth onClick={() => navigate(`/team/${selectedMember._id}`)}>Full Profile</Button></div>
              </div>
            </div>
          )}

          {/* Chat Modal */}
          {showChatModal && chatUser && <ChatModal user={chatUser} onClose={() => setShowChatModal(false)} />}

          {/* Invite Modal */}
          <InviteFreelancersModal inviteModalOpen={inviteModalOpen} setInviteModalOpen={setInviteModalOpen} freelancers={freelancers} invitedIds={invitedIds} handleSendInvite={handleSendInvite} loading={freelancersLoading} refreshFreelancers={() => { }} />

          {/* Remove Member Confirmation Modal */}
          {showRemoveConfirm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="w-full max-w-md bg-[#1a1a22] rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Remove Member</h3>
                <p className="text-gray-300 mb-6">Are you sure you want to remove <strong>{showRemoveConfirm.name}</strong> from your team?</p>
                <div className="flex gap-4"><Button variant="danger" onClick={() => removeMemberFromTeam(showRemoveConfirm._id)}>Remove</Button><Button variant="glass" onClick={() => setShowRemoveConfirm(null)}>Cancel</Button></div>
              </div>
            </div>
          )}

          {/* Block Member Confirmation Modal */}
          {showBlockConfirm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="w-full max-w-md bg-[#1a1a22] rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Block Member</h3>
                <p className="text-gray-300 mb-6">Are you sure you want to block <strong>{showBlockConfirm.name}</strong>? They will not be able to message you or see your projects.</p>
                <div className="flex gap-4"><Button variant="danger" onClick={() => blockMember(showBlockConfirm._id)}>Block</Button><Button variant="glass" onClick={() => setShowBlockConfirm(null)}>Cancel</Button></div>
              </div>
            </div>
          )}

          {/* Assign Project Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="w-full max-w-md bg-[#1a1a22] rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Assign Project to {showAssignModal.name}</h3><button onClick={() => { setShowAssignModal(null); setSelectedProjectId(''); }} className="text-gray-400 hover:text-white"><FiX /></button></div>
                <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none mb-6">
                  <option value="">Select a project</option>
                  {allProjects.map(proj => (<option key={proj._id} value={proj._id}>{proj.name}</option>))}
                </select>
                <div className="flex gap-4"><Button onClick={() => assignProjectToMember(showAssignModal._id, selectedProjectId)} loading={assignProjectLoading}>Assign</Button><Button variant="glass" onClick={() => { setShowAssignModal(null); setSelectedProjectId(''); }}>Cancel</Button></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const TeamMemberCard = React.memo(({
    member,
    onlineUsers,
    pinnedMembers,
    favoriteMembers,
    memberUnreadCounts,
    activeMenuFor,
    showMuteMenuFor,
    isMemberMuted,
    setActiveMenuFor,
    setShowMuteMenuFor,
    togglePinMember,
    toggleFavoriteMember,
    muteMember,
    setShowAssignModal,
    setShowBlockConfirm,
    setShowRemoveConfirm,
    openChat,
    openMemberProfile,
    getAvatarUrlFixed,
    getInitials
}) => {

    const isOnline = onlineUsers.includes(member._id);
    const isPinned = pinnedMembers.includes(member._id);
    const isFavorite = favoriteMembers.includes(member._id);
    const isMuted = isMemberMuted(member._id);
    const unreadMsgCount = memberUnreadCounts[member._id] || 0;
    const menuRef = useRef(null);
useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.target)
    ) {
      setActiveMenuFor(null);
      setShowMuteMenuFor(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [setActiveMenuFor, setShowMuteMenuFor]);
    

    return (
      <div className="group relative p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40  duration-300 backdrop-blur-sm">
        {member.isLeader && (
  <div
  className="
    absolute
    top-0
    right-0
    px-2
    py-0
    bg-gradient-to-r
    from-yellow-400
    to-orange-500
    rounded-bl-xl
    rounded-tr-2xl
    text-black
    text-xs
    font-bold
    shadow-lg
    flex
    items-center
    gap-1
  "
>
  
  <span>LEADER</span>
</div>
)}
        {/* Three-dot menu */}
      <div
    className="absolute top-4 right-4 z-50"
>
          <button
            onClick={() => setActiveMenuFor(activeMenuFor === member._id ? null : member._id)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <FiMoreVertical className="text-gray-400" />
          </button>
          {activeMenuFor === member._id && (
             <div
    ref={menuRef}
    className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1f1f2e]
    border border-white/10 shadow-2xl backdrop-blur-xl z-[999999]"
  >
              <div className="py-1">
                <button onClick={() => togglePinMember(member._id)} className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3">
                  <FiStar className={isPinned ? "text-yellow-400" : "text-gray-400"} /> {isPinned ? "Unpin Member" : "Pin Member"}
                </button>
                <button onClick={() => toggleFavoriteMember(member._id)} className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3">
                  <FiHeart className={isFavorite ? "text-red-400" : "text-gray-400"} /> {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </button>
                <div className="border-t border-white/10 my-1"></div>
                {member.canAssignProject && (
<button
onClick={() => setShowAssignModal(member)}
className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3"
>
   <FiFolderPlus className="text-gray-400"/>
   Assign Project
</button>
)}
 <div
  className="relative"
  onMouseEnter={() => setShowMuteMenuFor(member._id)}
  onMouseLeave={() => setShowMuteMenuFor(null)}
>
  <button className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3">
    <FiBellOff className="text-gray-400" />
    Mute Notifications
  </button>

  {showMuteMenuFor === member._id && (
    <div className="absolute top-full left-0 mt-2 w-40 rounded-xl bg-[#1f1f2e]
border border-white/10 shadow-2xl z-[999999]">
      <button
        onClick={() => muteMember(member._id, 'hour')}
        className="block w-full px-4 py-2 text-sm hover:bg-white/10"
      >
        Mute 1 hour
      </button>

      <button
        onClick={() => muteMember(member._id, '8hours')}
        className="block w-full px-4 py-2 text-sm hover:bg-white/10"
      >
        Mute 8 hours
      </button>

      <button
        onClick={() => muteMember(member._id, 'day')}
        className="block w-full px-4 py-2 text-sm hover:bg-white/10"
      >
        Mute 1 day
      </button>

      <button
        onClick={() => muteMember(member._id, 'forever')}
        className="block w-full px-4 py-2 text-sm hover:bg-white/10"
      >
        Mute forever
      </button>
    </div>
  )}
</div>
                <div className="border-t border-white/10 my-1"></div>
                <button onClick={() => setShowBlockConfirm(member)} className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3 text-red-400">
                  <FiUserX /> Block Member
                </button>
                <button onClick={() => setShowRemoveConfirm(member)} className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-3 text-red-400">
                  <FiTrash2 /> Remove From Team
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar and basic info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {member.isLeader && (
 <div className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-[#13131a] shadow-lg">
    <FaCrown className="text-white text-sm" />
</div>
)}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold overflow-hidden">
              {member.avatar ? (
                <img src={getAvatarUrlFixed(member.avatar, member.name)} alt={member.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{getInitials(member.name)}</div>
              )}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#13131a] ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">{member.name}</h3>
              {isPinned && <FiStar className="text-yellow-400 text-sm" />}
              {isFavorite && <FiHeart className="text-red-400 text-sm" />}
              {isMuted && <FiBellOff className="text-gray-400 text-xs" />}
            </div>
            <p className="text-sm text-gray-400">{member.role || 'Team Member'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>
          </div>
        </div>

        {/* Status badge with last seen mock */}
        <div className="mb-4">
          {isOnline ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Working Now
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/10 text-gray-400 text-xs">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Offline
            </span>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => openChat(member)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all text-sm font-medium"
          >
            <FiMessageCircle size={14} /> Message {unreadMsgCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 rounded-full">{unreadMsgCount}</span>}
          </button>
          <button
            onClick={() => openMemberProfile(member._id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
          >
            <FiUserCheck size={14} /> Profile
          </button>
         {member.canAssignProject && (
<button
onClick={() => setShowAssignModal(member)}
className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all text-sm font-medium"
>
   <FiFolderPlus size={14}/>
   Assign
</button>
)}
        </div>

        {/* Muted Badge if muted */}
        {isMuted && (
          <div className="mt-3 text-center text-xs text-gray-500 bg-white/5 rounded-lg py-1 flex items-center justify-center gap-1">
            <FiBellOff size={12} /> Notifications Muted
          </div>
        )}
      </div>
    );
  });