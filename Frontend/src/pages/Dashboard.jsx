import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../socket/context/SocketContext';
import { useNotifications } from "../context/NotificationContext";
import ChatModal from '../components/chat/ChatModal';

import api from '../services/api';



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

  const [chatUser, setChatUser] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  
  const [activityData, setActivityData] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

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

  const getInitials = (name) => {
  if (!name) return "U";

  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
    }
  }, [user]);

  // Socket real-time connections
  useEffect(() => {
    if (!user || !socket || !isConnected) return;

    // 🔥 USER JOIN (ONLINE)
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
  };

  // ==================== FIX: Handler for new project creation ====================
  const handleNewProject = (project) => {
    // Prepend the new project to the list
    setRecentProjects(prev => [project, ...prev]);
    // Update stats (optional)
    setStats(prev => ({
      ...prev,
      totalProjects: (prev.totalProjects || 0) + 1,
      activeProjects: (prev.activeProjects || 0) + 1
    }));
    showToast(`New project created: ${project.name}`, 'success');
  };
  // ================================================================================

  // Setup socket listeners
  const setupSocketListeners = () => {
    if (!socket) return;

    // ===============================
    // PROJECT EVENTS
    // ===============================

    onProjectUpdated((data) => {
      handleProjectUpdate(data);
    });

    onProjectStatusUpdated((data) => {
      handleProjectStatusUpdate(data);
    });

    onTaskAdded((data) => {
      handleTaskAdded(data);
    });

    onTaskCompleted((data) => {
      handleTaskCompleted(data);
    });

    onProjectError((data) => {
      showToast(data.message || "Project error occurred", "error");
    });

    // 🆕 New Project Created
    socket.on("project:created", (data) => {
      handleNewProject(data);
    });

    // ===============================
    // USER PRESENCE EVENTS
    // ===============================

    socket.on("user:online", (data) => {
      handleUserOnline(data);
    });

    socket.on("user:offline", (data) => {
      handleUserOffline(data);
    });

    socket.on("user:status-change", (data) => {
      handleUserStatusChange(data);
    });

    // ===============================
    // TYPING INDICATOR
    // ===============================

    socket.on("user:typing", (data) => {
      handleTypingIndicator(data);
    });
  };

  // Remove socket listeners
  const removeSocketListeners = () => {
    if (!socket) return;

    socket.off("project:created");
    socket.off("user:online");
    socket.off("user:offline");
    socket.off("user:status-change");
    socket.off("user:typing");
  };

  // Handle real-time updates
  const handleProjectUpdate = (data) => {
    setRecentProjects(prev => 
      prev.map(p => p._id === data.projectId ? { ...p, ...data.updates } : p)
    );
    
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
    setRecentProjects(prev => 
      prev.map(p => p._id === data.projectId ? { ...p, status: data.newStatus } : p)
    );
    
    showToast(`Project ${data.projectName || ''} status: ${data.oldStatus} → ${data.newStatus}`, 'info');
  };

  const handleTaskAdded = (data) => {
    showToast(`New task assigned: ${data.task.title}`, 'info');
    fetchDashboardData(); // Refresh data
  };

  const handleTaskCompleted = (data) => {
    showToast(`Task completed by ${data.completedBy}`, 'success');
    fetchDashboardData();
  };

  const handleUserOnline = (data) => {
    console.log("USER ONLINE:", data);
    setOnlineUsers(prev => {
      if (prev.includes(data.userId)) return prev;
      return [...prev, data.userId];
    });
  };

  const handleUserOffline = (data) => {
    console.log("USER OFFLINE:", data);
    setOnlineUsers(prev =>
      prev.filter(id => id !== data.userId)
    );
  };

  const handleUserStatusChange = (data) => {
    setTeamMembers(prev => 
      prev.map(m => m._id === data.userId ? { ...m, status: data.newStatus } : m)
    );
  };

  const handleTypingIndicator = (data) => {
    setTypingUsers(prev => ({
      ...prev,
      [data.userId]: data.isTyping ? data.name : null
    }));
  };

  // Fetch dashboard data from backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/dashboard");
      
      if (response.data.success) {
        const data = response.data.data;
        setDashboardData(data);
        setStats(data.stats || {});
        setRecentProjects(data.recentProjects || []);
        setActivityData(data.activityData || [40, 65, 80, 55, 70, 85, 60]);
        
        // Update profile data with real data
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

  // Fetch analytics data
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

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      const response = await api.get('/team');
      if (response.data.success) {
        const members = response.data.data.members.map(m => ({
          ...m,
          status: m.status || "offline"
        }));
        setTeamMembers(members);
        
        // Get online status for team members
        const onlineIds = response.data.data.members
          .filter(m => m.status === 'online')
          .map(m => m._id);
        setOnlineUsers(onlineIds);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Handle logout
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

  // Handle profile update with backend
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log("Profile Data:", profileData);

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

        socket.emit('auth:profile-updated', {
          updates: {
            name: profileData.name,
            avatar: profileData.avatar
          }
        });
      }
    } catch (error) {
      console.log("Backend Error:", error.response?.data);
      console.error('Profile update error:', error);
      showToast(error.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle notification toggle with backend
  const handleNotificationToggle = async (key) => {
    try {
      const newValue = !profileData.notifications[key];
      
      const response = await api.put('/profile/notifications', {
        ...profileData.notifications,
        [key]: newValue
      });

      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            [key]: newValue
          }
        }));
        showToast('Notification settings updated', 'success');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      showToast('Failed to update settings', 'error');
    }
  };

  // Handle mark all notifications as read (uses context)
  const handleMarkAllReadLocal = async () => {
    await markAllAsRead();
    showToast('All notifications marked as read', 'success');
  };

  // Handle create new project
  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  // Handle view project
  const handleViewProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  // Handle message team member
  const handleMessageMember = (memberId) => {
    navigate(`/messages?user=${memberId}`);
  };

  // Handle notification click: mark as read and optionally navigate to detail
  const handleNotificationClick = async (notification) => {
  if (!notification.isRead) {
    await markAsRead(notification._id);
  }

  // ✅ ये ADD करो
  navigate('/notifications');
};

  if (!user) {
    return null; // Will redirect
  }

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header with online status */}
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
              <p className="text-gray-400">
                {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </Reveal>
          </div>
          
          <Reveal delay={400}>
            <div className="flex gap-4">
              <Button
                variant="glass"
                onClick={() => setActiveTab('profile')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Button>
              <Button
                variant="danger"
                onClick={handleLogout}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Navigation Tabs */}
        <Reveal delay={600}>
          <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'projects', label: 'Projects', icon: '📁' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'team', label: 'Team', icon: '👥' },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-6 py-3 rounded-full text-sm font-medium
                  transition-all duration-300 flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
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
                  { label: 'Total Projects', value: stats.totalProjects || 0, icon: '📁', change: stats.projectsGrowth || '+0%', gradient: 'from-indigo-500 to-purple-600' },
                  { label: 'Active Projects', value: stats.activeProjects || 0, icon: '⚡', change: stats.activeGrowth || '+0%', gradient: 'from-purple-500 to-pink-600' },
                  { label: 'Completed', value: stats.completedProjects || 0, icon: '✅', change: stats.completedGrowth || '+0%', gradient: 'from-pink-500 to-orange-600' },
                  { label: 'Pending Tasks', value: stats.pendingTasks || 0, icon: '⏳', change: stats.pendingChange || '0', gradient: 'from-orange-500 to-yellow-600' },
                ].map((stat, index) => (
                  <Reveal key={stat.label} delay={index * 100} type="scale">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">{stat.icon}</span>
                        <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Activity Chart & Recent Projects */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Activity Chart */}
                <Reveal type="left">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold mb-6">Weekly Activity</h3>
                    <div className="h-48 flex items-end justify-between gap-2">
                      {activityData.map((value, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="relative w-full">
                            <div 
                              className="w-full bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-lg transition-all group-hover:from-purple-500 group-hover:to-pink-600"
                              style={{ height: `${value * 1.5}px` }}
                            >
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/10 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                {value} tasks
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">Day {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>

                {/* Recent Projects */}
                <Reveal type="right">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold">Recent Projects</h3>
                      <button 
                        onClick={() => setActiveTab('projects')}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {recentProjects.slice(0, 4).map((project) => (
                        <div 
                          key={project._id} 
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                          onClick={() => handleViewProject(project._id)}
                        >
                          <div>
                            <h4 className="font-medium mb-1">{project.name}</h4>
                            <p className="text-xs text-gray-500">Due: {new Date(project.deadline).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className={`
                              inline-block px-2 py-1 rounded-full text-xs mb-2
                              ${project.status === 'Completed' ? 'bg-green-500/20 text-green-400' : ''}
                              ${project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : ''}
                              ${project.status === 'Review' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                              ${project.status === 'Planning' ? 'bg-purple-500/20 text-purple-400' : ''}
                            `}>
                              {project.status}
                            </span>
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Team & Notifications */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Team Members with Online Status */}
                <Reveal type="left">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold">Team Members</h3>
                      <button 
                        onClick={() => setActiveTab('team')}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        Manage Team
                      </button>
                    </div>
                    <div className="space-y-4">
                      {teamMembers.slice(0, 4).map((member) => (
                        <div key={member._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="
                                w-10 h-10 rounded-full
                                bg-gradient-to-br from-indigo-500 to-purple-600
                                flex items-center justify-center text-sm font-bold
                                overflow-hidden
                              ">
                          {member.avatar ? (
  <img
   src={getAvatarUrlFixed(member.avatar, member.name)}
    alt={member.name}
    className="w-full h-full object-cover rounded-full"
    onError={(e) => {
      e.target.style.display = "none";
      e.target.parentNode.innerHTML = `
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          height:100%;
          color:white;
          font-weight:bold;
        ">
          ${getInitials(member.name)}
        </div>
      `;
    }}
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
    {getInitials(member.name)}
  </div>
)}
                              </div>
                              <span
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#13131a] ${
                                  onlineUsers.includes(member._id)
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-gray-500"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-gray-500">{member.role}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => openChat(member)}
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                          >
                            Message
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Typing indicators */}
                    {Object.values(typingUsers).filter(Boolean).length > 0 && (
                      <div className="mt-4 text-xs text-gray-400 italic">
                        {Object.values(typingUsers).filter(Boolean).join(', ')} typing...
                      </div>
                    )}
                  </div>
                </Reveal>

                {/* Real Notifications */}
                <Reveal type="right">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold">Recent Notifications</h3>
                      <button 
                        onClick={handleMarkAllReadLocal}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="space-y-4">
                      {notifications.slice(0, 4).map((notification) => (
                        <div 
                          key={notification._id} 
                          className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                            notification.isRead ? 'bg-white/5' : 'bg-indigo-500/10'
                          } hover:bg-white/10 cursor-pointer`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${notification.type === 'contact' ? 'bg-green-500/20 text-green-400' : ''}
                            ${notification.type === 'message' ? 'bg-blue-500/20 text-blue-400' : ''}
                            ${notification.type === 'system' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                            ${notification.type === 'project' ? 'bg-purple-500/20 text-purple-400' : ''}
                          `}>
                            {notification.type === 'contact' && '📧'}
                            {notification.type === 'message' && '💬'}
                            {notification.type === 'system' && '⚙️'}
                            {notification.type === 'project' && '📁'}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {notification.sender?.name || 'System'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notification.message.length > 60
                                ? `${notification.message.substring(0, 60)}...`
                                : notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                          )}
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <p className="text-gray-400 text-center py-4">No notifications</p>
                      )}
                      {notifications.length > 0 && (
                        <div className="text-center mt-4">
                          <button
                            onClick={() => setActiveTab('notifications')}
                            className="text-sm text-indigo-400 hover:text-indigo-300"
                          >
                            View All Notifications
                          </button>
                        </div>
                      )}
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
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">All Projects</h2>
                  <Button onClick={handleCreateProject}>New Project</Button>
                </div>
                
                <div className="grid gap-4">
                  {recentProjects.length === 0 ? (
                    <p className="text-gray-400">No projects found</p>
                  ) : (
                    recentProjects.map((project) => (
                      <div 
                        key={project._id} 
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all cursor-pointer"
                        onClick={() => handleViewProject(project._id)}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                            <p className="text-sm text-gray-400">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500 mt-1">Client: {project.client?.name || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className={`
                                inline-block px-3 py-1 rounded-full text-sm mb-2
                                ${project.status === 'Completed' ? 'bg-green-500/20 text-green-400' : ''}
                                ${project.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' : ''}
                                ${project.status === 'Review' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                ${project.status === 'Planning' ? 'bg-purple-500/20 text-purple-400' : ''}
                                ${project.status === 'On Hold' ? 'bg-orange-500/20 text-orange-400' : ''}
                                ${project.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' : ''}
                              `}>
                                {project.status}
                              </span>
                            </div>
                            <div className="w-32">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{project.progress}%</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                            </div>
                            <Button variant="glass" size="sm">View</Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <Reveal>
              <div className="space-y-8">
                <h2 className="text-2xl font-bold">Analytics Overview</h2>
                
                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { label: 'Total Revenue', value: `$${analytics.revenue?.total?.toLocaleString() || '0'}`, change: analytics.revenue?.growth || '+0%', icon: '💰' },
                    { label: 'Active Users', value: analytics.traffic?.uniqueVisitors?.toLocaleString() || '0', change: analytics.traffic?.growth || '+0%', icon: '👥' },
                    { label: 'Conversion Rate', value: `${analytics.conversions?.rate || '0'}%`, change: analytics.conversions?.growth || '+0%', icon: '📊' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">{stat.icon}</span>
                        <span className="text-sm text-green-400">{stat.change}</span>
                      </div>
                      <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">Traffic Sources</h3>
                    <div className="space-y-4">
                      {analytics.traffic?.sources?.map((source, i) => (
                        <div key={source.source}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{source.source}</span>
                            <span>{Math.round(source.percentage)}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                              style={{ width: `${source.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-lg font-bold mb-4">Project Categories</h3>
                    <div className="space-y-4">
                      {analytics.projects?.byCategory?.map((cat, i) => (
                        <div key={cat._id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{cat._id}</span>
                            <span>{cat.count} projects</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"
                              style={{ width: `${(cat.count / analytics.projects.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <Reveal>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Team Members</h2>
                  <Button>Invite Member</Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teamMembers.map((member) => (
                    <div key={member._id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative">
                          <div className="
                            w-10 h-10 rounded-full
                            bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center text-sm font-bold
                            overflow-hidden
                          ">
                           {member.avatar ? (
  <img
    src={getAvatarUrlFixed(member.avatar, member.name)}
    alt={member.name}
    className="w-full h-full object-cover rounded-full"
    onError={(e) => {
      e.target.style.display = "none";
      e.target.parentNode.innerHTML = `
        <div style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          height:100%;
          color:white;
          font-weight:bold;
        ">
          ${getInitials(member.name)}
        </div>
      `;
    }}
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
    {getInitials(member.name)}
  </div>
)}
                          </div>
                          <span
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#13131a] ${
                              onlineUsers.includes(member._id)
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{member.name}</h3>
                          <p className="text-sm text-gray-400">{member.role}</p>
                          <p className="text-xs text-gray-500 mt-1">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="glass" 
                          size="sm" 
                          fullWidth
                          onClick={() => openChat(member)}
                        >
                          Message
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          fullWidth
                          onClick={() => openMemberProfile(member._id)}
                        >
                          Profile
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Reveal>
              <div className="max-w-3xl mx-auto">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  {/* Profile Header */}
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden relative">
                      <img
                        src={
  profileData.avatar
    ? `${BASE_URL}${profileData.avatar}`
    : getAvatarUrl(profileData.name)
}
                        alt={profileData.name}
                        className="w-full h-full object-cover"
                      />
                      {isConnected && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#13131a]" />
                      )}
                    </div>
                    <h2 className="text-2xl font-bold">{profileData.name}</h2>
                    <p className="text-gray-400">{profileData.position}</p>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">Full Name</label>
                          <input
                            type="text"
                            name="name"
                            value={profileData.name}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Company</label>
                          <input
                            type="text"
                            name="company"
                            value={profileData.company}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Position</label>
                          <input
                            type="text"
                            name="position"
                            value={profileData.position}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Phone</label>
                          <input
                            type="text"
                            name="phone"
                            value={profileData.phone}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Location</label>
                          <input
                            type="text"
                            name="location"
                            value={profileData.location}
                            onChange={handleProfileChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Bio</label>
                        <textarea
                          name="bio"
                          value={profileData.bio}
                          onChange={handleProfileChange}
                          rows="4"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition-all"
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button type="submit" loading={loading}>
                          Save Changes
                        </Button>
                        <Button 
                          type="button" 
                          variant="glass"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Email</p>
                          <p className="font-medium">{profileData.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Company</p>
                          <p className="font-medium">{profileData.company || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Phone</p>
                          <p className="font-medium">{profileData.phone || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Location</p>
                          <p className="font-medium">{profileData.location || 'Not specified'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Bio</p>
                        <p className="text-gray-300">{profileData.bio || 'No bio provided'}</p>
                      </div>

                      <div className="flex gap-4">
                        <Button onClick={() => setIsEditing(true)}>
                          Edit Profile
                        </Button>
                        <Button variant="glass" onClick={() => navigate('/profile/change-password')}>
                          Change Password
                        </Button>
                      </div>
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
                {/* Notification Settings */}
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-bold mb-6">Notification Settings</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Email Notifications', description: 'Receive email updates about your projects' },
                      { key: 'push', label: 'Push Notifications', description: 'Get push notifications in your browser' },
                      { key: 'marketing', label: 'Marketing Emails', description: 'Receive newsletters and promotional offers' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                        <div>
                          <h4 className="font-medium mb-1">{item.label}</h4>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.notifications[item.key]}
                            onChange={() => handleNotificationToggle(item.key)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security Settings */}
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-bold mb-6">Security</h3>
                  <div className="space-y-4">
                    <Button 
                      variant="glass" 
                      fullWidth
                      onClick={() => navigate('/profile/change-password')}
                    >
                      Change Password
                    </Button>
                    <Button variant="glass" fullWidth>
                      Enable Two-Factor Authentication
                    </Button>
                    <Button variant="glass" fullWidth>
                      View Login History
                    </Button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20">
                  <h3 className="text-xl font-bold text-red-400 mb-6">Danger Zone</h3>
                  <div className="space-y-4">
                    <Button variant="danger" fullWidth>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Reveal>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">All Notifications</h2>
                  <Button variant="glass" onClick={handleMarkAllReadLocal}>
                    Mark All Read
                  </Button>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      No notifications found
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          p-6 rounded-2xl bg-white/5 border border-white/10 
                          hover:border-indigo-500/30 transition-all cursor-pointer
                          ${!notification.isRead ? 'bg-indigo-500/5' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`
                                w-8 h-8 rounded-full flex items-center justify-center
                                ${notification.type === 'contact' ? 'bg-green-500/20 text-green-400' : ''}
                                ${notification.type === 'message' ? 'bg-blue-500/20 text-blue-400' : ''}
                                ${notification.type === 'system' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                                ${notification.type === 'project' ? 'bg-purple-500/20 text-purple-400' : ''}
                              `}>
                                {notification.type === 'contact' && '📧'}
                                {notification.type === 'message' && '💬'}
                                {notification.type === 'system' && '⚙️'}
                                {notification.type === 'project' && '📁'}
                              </span>
                              <h3 className="text-lg font-bold">
                                {notification.name || 'System'}
                              </h3>
                              {!notification.isRead && (
                                <span className="px-2 py-1 text-xs bg-indigo-500/20 text-indigo-400 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{new Date(notification.createdAt).toLocaleString()}</span>
                              {notification.sender?.email && (
                                <span>{notification.sender.email}</span>
                              )}
                              {notification.sender?.phone && (
                                <span>{notification.sender.phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Reveal>
          )}

          {/* Member Profile Modal */}
          {showMemberProfile && selectedMember && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="w-full max-w-xl bg-[#1a1a22] rounded-2xl p-8">
                <div className="flex justify-between mb-6">
                  <h2 className="text-xl font-bold">Team Member</h2>
                  <button
                    onClick={() => setShowMemberProfile(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                 <img
  src={getAvatarUrlFixed(selectedMember.avatar, selectedMember.name)}
  className="w-16 h-16 rounded-full object-cover"
  alt={selectedMember.name}
/>
                  <div>
                    <h3 className="text-lg font-bold">{selectedMember.name}</h3>
                    <p className="text-sm text-gray-400">{selectedMember.role}</p>
                    <p className="text-xs text-gray-500">{selectedMember.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Phone</p>
                    <p>{selectedMember.phone || "Not available"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Location</p>
                    <p>{selectedMember.location || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Projects</p>
                    <p>{selectedMember.projects?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tasks</p>
                    <p>{selectedMember.tasksCompleted || 0}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    fullWidth
                    onClick={() => {
                      setShowMemberProfile(false);
                      openChat(selectedMember);
                    }}
                  >
                    Message
                  </Button>
                  <Button
                    variant="glass"
                    fullWidth
                    onClick={() => navigate(`/team/${selectedMember._id}`)}
                  >
                    Full Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Modal */}
          {showChatModal && chatUser && (
            <ChatModal
              user={chatUser}
              onClose={() => setShowChatModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}