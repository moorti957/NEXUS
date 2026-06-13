import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../socket/context/SocketContext';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // ── Existing: contact notifications ─────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── NEW: blog notifications ──────────────────────────────────
  const [blogNotifications, setBlogNotifications] = useState([]);
  const [blogUnreadCount, setBlogUnreadCount] = useState(0);
  const [blogLoading, setBlogLoading] = useState(false);

  // ────────────────────────────────────────────────────────────
  // EXISTING: Fetch contact notifications
  // ────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await api.get('/contact-notifications', { params });
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.filter(n => !n.isRead).length);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // EXISTING: Mark single as read
  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  // EXISTING: Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  };

  // EXISTING: Delete notification
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const wasUnread = notifications.find(n => n._id === id)?.isRead === false;
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  // ────────────────────────────────────────────────────────────
  // NEW: Fetch blog notifications
  // ────────────────────────────────────────────────────────────
  const fetchBlogNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setBlogLoading(true);
      const response = await api.get('/notifications', { params: { limit: 50 } });
      if (response.data.success) {
        setBlogNotifications(response.data.data);
        setBlogUnreadCount(response.data.data.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Fetch blog notifications error:', err);
    } finally {
      setBlogLoading(false);
    }
  }, [user]);

  // NEW: Mark single blog notification as read
  const markBlogNotifRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setBlogNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setBlogUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark blog notif read error:', err);
    }
  };

  // NEW: Mark all blog notifications as read
  const markAllBlogNotifsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setBlogNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setBlogUnreadCount(0);
    } catch (err) {
      console.error('Mark all blog notifs read error:', err);
    }
  };

  // ────────────────────────────────────────────────────────────
  // EXISTING: Socket — contact notifications real-time
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket, isConnected, user]);

  // ────────────────────────────────────────────────────────────
  // NEW: Socket — blog notifications real-time
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNewBlogNotif = (notification) => {
      setBlogNotifications(prev => [notification, ...prev]);
      setBlogUnreadCount(prev => prev + 1);
    };

    socket.on('newBlogNotification', handleNewBlogNotif);

    return () => {
      socket.off('newBlogNotification', handleNewBlogNotif);
    };
  }, [socket, isConnected, user]);

  // ────────────────────────────────────────────────────────────
  // Initial fetch — both
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchNotifications({ limit: 10 });
      fetchBlogNotifications();
    }
  }, [user, fetchNotifications, fetchBlogNotifications]);

  // ────────────────────────────────────────────────────────────
  // Combined unread count (for a single bell badge if needed)
  // ────────────────────────────────────────────────────────────
  const totalUnreadCount = unreadCount + blogUnreadCount;

  const value = {
    // ── Existing (unchanged) ──────────────────────────────────
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // ── New: blog notifications ───────────────────────────────
    blogNotifications,
    blogUnreadCount,
    blogLoading,
    fetchBlogNotifications,
    markBlogNotifRead,
    markAllBlogNotifsRead,

    // ── Combined ──────────────────────────────────────────────
    totalUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};