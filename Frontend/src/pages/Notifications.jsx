import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    // Fetch fresh data when filter changes
    let params = {};
    if (filter === 'unread') params.isRead = false;
    if (filter === 'read') params.isRead = true;
    fetchNotifications(params);
  }, [filter, fetchNotifications]);

  const filteredNotifications = notifications; // Already filtered by API

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
      notification.isRead = true; // Update locally
    }
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this notification?')) {
      await deleteNotification(id);
      showToast('Notification deleted', 'success');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    showToast('All notifications marked as read', 'success');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <Reveal>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-display mb-2">
                Notifications
              </h1>
              <p className="text-gray-400">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notifications`
                  : 'All caught up!'}
              </p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex gap-4">
              <Button variant="glass" onClick={handleMarkAllRead}>
                Mark All Read
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Filter Tabs */}
        <Reveal delay={400}>
          <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'read', label: 'Read', count: notifications.filter(n => n.isRead).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`
                  px-6 py-3 rounded-full text-sm font-medium
                  transition-all duration-300 flex items-center gap-2
                  ${filter === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span>{tab.label}</span>
                {tab.id !== 'all' && tab.count > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Notifications List */}
        <Reveal>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">{error}</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No notifications found
              </div>
            ) : (
              filteredNotifications.map((notification) => (
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
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={(e) => handleDelete(notification._id, e)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Reveal>

        {/* Detail Modal */}
        {showDetailModal && selectedNotification && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">

    <div className="bg-[#1a1a22] w-full max-w-md mx-4 rounded-2xl shadow-2xl border border-white/10 animate-scaleIn">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Notification Details</h2>
        <button 
          onClick={() => setShowDetailModal(false)}
          className="text-gray-400 hover:text-white text-lg"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="p-4 space-y-3 text-sm">

        <div>
          <p className="text-gray-400">Name</p>
          <p className="font-medium">{selectedNotification.name}</p>
        </div>

        <div>
          <p className="text-gray-400">Email</p>
          <p>{selectedNotification.email}</p>
        </div>

        <div>
          <p className="text-gray-400">Phone</p>
          <p>{selectedNotification.phone}</p>
        </div>

        <div>
          <p className="text-gray-400">Company</p>
          <p>{selectedNotification.company}</p>
        </div>

        <div>
          <p className="text-gray-400">Service</p>
          <p>{selectedNotification.service}</p>
        </div>

        <div>
          <p className="text-gray-400">Budget</p>
          <p>{selectedNotification.budget}</p>
        </div>

        <div>
          <p className="text-gray-400">Message</p>
          <p className="text-gray-300">{selectedNotification.message}</p>
        </div>

        <div>
          <p className="text-gray-400">Date</p>
          <p>{new Date(selectedNotification.createdAt).toLocaleString()}</p>
        </div>

      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-2 p-4 border-t border-white/10">
        <Button 
          variant="glass"
          onClick={() => setShowDetailModal(false)}
        >
          Close
        </Button>

        {!selectedNotification.isRead && (
          <Button
            onClick={() => {
              markAsRead(selectedNotification._id);
              setShowDetailModal(false);
            }}
          >
            Mark Read
          </Button>
        )}
      </div>

    </div>
  </div>
)}
      </div>
    </div>
  );
}