import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../socket/context/SocketContext';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await api.get('/contact-notifications', { params });
      if (response.data.success) {
        setNotifications(response.data.data);
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

  // Mark a single notification as read
  const markAsRead = async (id) => {
    try {
      
     await api.put(`/notifications/read/${id}`);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  };

  // Delete notification
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

  // Real-time: listen for new notifications
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

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications({ limit: 10 });
    }
  }, [user, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};