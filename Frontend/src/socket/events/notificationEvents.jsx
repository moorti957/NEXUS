import React, { 
  useCallback,
  useEffect,
  createContext,
  useContext,
  useState
} from "react";

import { useToast } from "../../components/common/Toast";
import { useSocket } from "../context/SocketContext";

/**
 * Notification Events Handler
 * Manages all real-time notification events
 * @param {Object} socket - Socket instance
 * @param {Object} context - React context (auth, notifications, etc.)
 */
export const useNotificationEvents = (socket, context) => {
  const { showToast } = useToast();
  const { 
    notifications, 
    setNotifications, 
    unreadCount, 
    setUnreadCount,
    updateNotification,
    addNotification 
  } = context;

  // ===========================================
  // NEW NOTIFICATION HANDLER
  // ===========================================
  // useEffect(() => {
  //   if (!socket) return;

  //   // const handleNewNotification = (data) => {
  //   //   console.log('🔔 New notification received:', data);

  //   //   const { notification, timestamp } = data;

  //   //   // Add to notifications list
  //   //   if (addNotification) {
  //   //     addNotification(notification);
  //   //   } else {
  //   //     setNotifications(prev => [notification, ...prev]);
  //   //   }

  //   //   // Increment unread count
  //   //   setUnreadCount(prev => prev + 1);

  //   //   // Show toast based on notification type
  //   //   const toastType = notification.type === 'success' ? 'success' :
  //   //                    notification.type === 'warning' ? 'warning' :
  //   //                    notification.type === 'error' ? 'error' : 'info';

  //   //   // Play sound based on priority
  //   //   if (notification.priority === 'high' || notification.priority === 'critical') {
  //   //     playNotificationSound('urgent');
  //   //   } else {
  //   //     playNotificationSound('default');
  //   //   }

  //   //   // Show browser notification if permitted
  //   //   if (Notification.permission === 'granted') {
  //   //     showBrowserNotification(notification);
  //   //   }

  //   //   // Show toast
  //   //   showToast(notification.message || notification.title, toastType, {
  //   //     duration: notification.priority === 'high' ? 8000 : 5000,
  //   //     onClose: () => {
  //   //       // Optional callback when toast closes
  //   //     }
  //   //   });

  //   //   // Trigger custom event for UI
  //   //   window.dispatchEvent(new CustomEvent('notification:new', {
  //   //     detail: notification
  //   //   }));
  //   // };

  //   socket.on('notification:new', handleNewNotification);

  //   return () => {
  //     socket.off('notification:new', handleNewNotification);
  //   };
  // }, [socket, setNotifications, setUnreadCount, showToast, addNotification]);

  // ===========================================
  // NOTIFICATION READ HANDLER
  // ===========================================
  // useEffect(() => {
  //   if (!socket) return;

  //   // const handleNotificationRead = (data) => {
  //   //   const { notificationId } = data;

  //   //   console.log('📖 Notification marked as read:', notificationId);

  //   //   // Update notification in state
  //   //   if (updateNotification) {
  //   //     updateNotification(notificationId, { isRead: true });
  //   //   } else {
  //   //     setNotifications(prev => 
  //   //       prev.map(n => 
  //   //         n._id === notificationId ? { ...n, isRead: true } : n
  //   //       )
  //   //     );
  //   //   }

  //   //   // Decrement unread count
  //   //   setUnreadCount(prev => Math.max(0, prev - 1));

  //   //   // Trigger custom event
  //   //   window.dispatchEvent(new CustomEvent('notification:read', {
  //   //     detail: { notificationId }
  //   //   }));
  //   // };

  //   socket.on('notification:read', handleNotificationRead);

  //   return () => {
  //     socket.off('notification:read', handleNotificationRead);
  //   };
  // }, [socket, setNotifications, setUnreadCount, updateNotification]);

  // ===========================================
  // ALL NOTIFICATIONS READ HANDLER
  // ===========================================
  useEffect(() => {
    if (!socket) return;

    const handleAllNotificationsRead = () => {
      console.log('📚 All notifications marked as read');

      // Mark all as read
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );

      // Reset unread count
      setUnreadCount(0);

      // Show success message
      showToast('All notifications marked as read', 'success');

      // Trigger custom event
      window.dispatchEvent(new CustomEvent('notification:all-read'));
    };

    socket.on('notification:all-read', handleAllNotificationsRead);

    return () => {
      socket.off('notification:all-read', handleAllNotificationsRead);
    };
  }, [socket, setNotifications, setUnreadCount, showToast]);

  // ===========================================
  // UNREAD COUNT HANDLER
  // ===========================================
  useEffect(() => {
    if (!socket) return;

    const handleUnreadCount = (data) => {
      const { count } = data;
      console.log('🔢 Unread count updated:', count);
      setUnreadCount(count);
    };

    socket.on('notification:unread-count', handleUnreadCount);

    return () => {
      socket.off('notification:unread-count', handleUnreadCount);
    };
  }, [socket, setUnreadCount]);

  // ===========================================
  // NOTIFICATION DELETED HANDLER
  // ===========================================
  useEffect(() => {
    if (!socket) return;

    const handleNotificationDeleted = (data) => {
      const { notificationId } = data;

      console.log('🗑️ Notification deleted:', notificationId);

      // Remove from state
      setNotifications(prev => {
        const deletedNotification = prev.find(n => n._id === notificationId);
        const newNotifications = prev.filter(n => n._id !== notificationId);
        
        // Update unread count if deleted notification was unread
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        return newNotifications;
      });

      showToast('Notification deleted', 'info');
    };

    socket.on('notification:deleted', handleNotificationDeleted);

    return () => {
      socket.off('notification:deleted', handleNotificationDeleted);
    };
  }, [socket, setNotifications, setUnreadCount, showToast]);

  // ===========================================
  // BULK NOTIFICATION UPDATE HANDLER
  // ===========================================
  useEffect(() => {
    if (!socket) return;

    const handleBulkUpdate = (data) => {
      const { notifications: updatedNotifications } = data;

      console.log('📦 Bulk notification update:', updatedNotifications.length);

      setNotifications(prev => {
        const newNotifications = [...prev];
        updatedNotifications.forEach(updated => {
          const index = newNotifications.findIndex(n => n._id === updated._id);
          if (index !== -1) {
            newNotifications[index] = { ...newNotifications[index], ...updated };
          } else {
            newNotifications.unshift(updated);
          }
        });
        return newNotifications;
      });

      // Recalculate unread count
      const newUnreadCount = updatedNotifications.filter(n => !n.isRead).length;
      setUnreadCount(newUnreadCount);
    };

    socket.on('notification:bulk-update', handleBulkUpdate);

    return () => {
      socket.off('notification:bulk-update', handleBulkUpdate);
    };
  }, [socket, setNotifications, setUnreadCount]);

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  /**
   * Play notification sound
   * @param {string} type - Sound type (default, urgent, success)
   */
  const playNotificationSound = (type = 'default') => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (type === 'urgent') {
        // Create urgent sound (beep beep)
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        
        // Second beep
        setTimeout(() => {
          const oscillator2 = audioContext.createOscillator();
          const gainNode2 = audioContext.createGain();
          
          oscillator2.connect(gainNode2);
          gainNode2.connect(audioContext.destination);
          
          oscillator2.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
          
          oscillator2.start();
          oscillator2.stop(audioContext.currentTime + 0.2);
        }, 300);
      } else {
        // Simple notification sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    } catch (error) {
      console.log('Audio play failed:', error);
    }
  };

  /**
   * Show browser notification
   * @param {Object} notification - Notification object
   */
  const showBrowserNotification = (notification) => {
    try {
      const browserNotification = new Notification(notification.title || 'New Notification', {
        body: notification.message,
        icon: notification.icon || '/logo192.png',
        badge: '/badge.png',
        tag: notification._id,
        renotify: true,
        silent: notification.priority !== 'high',
        data: {
          url: notification.actionUrl,
          id: notification._id
        }
      });

      browserNotification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => browserNotification.close(), 5000);
    } catch (error) {
      console.log('Browser notification failed:', error);
    }
  };

  /**
   * Request notification permission
   */
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  const markAsRead = useCallback((notificationId) => {
    if (socket) {
      socket.emit('notification:read', notificationId);
    }
  }, [socket]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    if (socket) {
      socket.emit('notification:read-all');
    }
  }, [socket]);

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   */
  const deleteNotification = useCallback((notificationId) => {
    if (socket) {
      socket.emit('notification:delete', notificationId);
    }
  }, [socket]);

  /**
   * Get unread count
   */
  const getUnreadCount = useCallback(() => {
    if (socket) {
      socket.emit('notification:unread-count');
    }
  }, [socket]);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    if (socket) {
      socket.emit('notification:clear-all');
    }
  }, [socket]);

  return {
    requestNotificationPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    clearAllNotifications
  };
};

// ===========================================
// NOTIFICATION CONTEXT PROVIDER
// ===========================================




const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    browser: true,
    desktop: true,
    email: false
  });

  // Initialize notification events
  const notificationEvents = useNotificationEvents(socket, {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    addNotification: (notification) => {
      setNotifications(prev => [notification, ...prev]);
    },
    updateNotification: (id, updates) => {
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, ...updates } : n)
      );
    }
  });

  // Load notifications on mount
  useEffect(() => {
    if (socket) {
      socket.emit('notification:get-all');
      
      socket.on('notification:list', (data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification:list');
      }
    };
  }, [socket]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setNotificationSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const value = {
    notifications,
    unreadCount,
    notificationSettings,
    setNotificationSettings,
    ...notificationEvents
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};