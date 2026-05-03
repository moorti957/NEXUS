import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

// Create Socket Context
const SocketContext = createContext();

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Socket Provider Component
export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState(null);
  
  // Socket references
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socketError, setSocketError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);

  // ===========================================
  // SOCKET CONNECTION MANAGEMENT
  // ===========================================

  /**
   * Connect to socket server
   */
 const connectSocket = useCallback(() => {
  if (!token || !user) return;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // अगर socket already connected है तो नया मत बनाओ
  if (socketRef.current && socketRef.current.connected) {
    return;
  }

  // Create socket connection
  socketRef.current = io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: maxReconnectAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
    withCredentials: true,
  });



setSocket(socketRef.current);

const socket = socketRef.current;

  // ===============================
  // CONNECTION EVENTS
  // ===============================

  socket.on("connect", () => {
    console.log("🔌 Socket connected successfully");

    setIsConnected(true);
    setSocketError(null);
    reconnectAttempts.current = 0;
    setReconnecting(false);

    // Join user room
    socket.emit("join-user", user._id);

    showToast("Real-time connection established", "success", {
      duration: 2000,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);

    setIsConnected(false);

    if (reason === "io server disconnect") {
      socket.connect();
    }

    if (reason === "transport close" || reason === "ping timeout") {
      setReconnecting(true);

      showToast("Reconnecting...", "info", {
        duration: 3000,
      });
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);

    setSocketError(error.message);
    reconnectAttempts.current++;

    if (reconnectAttempts.current <= maxReconnectAttempts) {
      setReconnecting(true);

      showToast(
        `Reconnecting attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`,
        "info"
      );
    } else {
      showToast("Unable to establish real-time connection", "error");
      setReconnecting(false);
    }
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempts`);

    setIsConnected(true);
    setReconnecting(false);
    reconnectAttempts.current = 0;

    showToast("Reconnected successfully", "success");
  });

  socket.on("reconnect_attempt", (attempt) => {
    console.log(`Reconnection attempt ${attempt}`);
  });

  socket.on("reconnect_error", (error) => {
    console.error("Reconnection error:", error);
  });

  socket.on("reconnect_failed", () => {
    console.error("Reconnection failed");

    showToast("Failed to reconnect. Please refresh the page.", "error");
    setReconnecting(false);
  });

  // ===============================
  // USER PRESENCE EVENTS
  // ===============================

  socket.on("user:online", (data) => {
    console.log("👤 User online:", data.name);

    setOnlineUsers((prev) => {
      const exists = prev.some((u) => u.userId === data.userId);
      if (!exists) return [...prev, data];
      return prev;
    });
  });

  socket.on("user:offline", (data) => {
    console.log("👤 User offline:", data.userId);

    setOnlineUsers((prev) =>
      prev.filter((u) => u.userId !== data.userId)
    );
  });

  socket.on("users:online-list", (users) => {
    console.log("👥 Online users:", users.length);
    setOnlineUsers(users);
  });

  socket.on("user:status-change", (data) => {
    setOnlineUsers((prev) =>
      prev.map((u) =>
        u.userId === data.userId ? { ...u, status: data.status } : u
      )
    );
  });

  // ===============================
  // TYPING EVENTS
  // ===============================

  socket.on("user:typing", (data) => {
    const { conversationId, userId, name, isTyping } = data;

    setTypingUsers((prev) => {
      const key = `${conversationId}:${userId}`;

      if (isTyping) {
        return {
          ...prev,
          [key]: { name, timestamp: Date.now() },
        };
      }

      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  });

  // ===============================
  // NOTIFICATIONS
  // ===============================

  socket.on("notification:new", (data) => {
    console.log("🔔 New notification:", data);

    const { notification } = data;

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    const toastType =
      notification.type === "success"
        ? "success"
        : notification.type === "warning"
        ? "warning"
        : notification.type === "error"
        ? "error"
        : "info";

    showToast(notification.message || notification.title, toastType, {
      duration: notification.priority === "high" ? 8000 : 5000,
    });
  });

  socket.on("notification:read", ({ notificationId }) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notificationId ? { ...n, isRead: true } : n
      )
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));
  });

  socket.on("notification:all-read", () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );

    setUnreadCount(0);
  });

  // ===============================
  // CHAT EVENTS
  // ===============================


  
 // ===============================
// CHAT EVENTS
// ===============================

// ===============================
// CHAT EVENTS
// ===============================

socket.on("newMessage", (data) => {
  console.log("🔥 SocketContext received message:", data);

  const { message } = data;

  const sender =
    typeof message.sender === "object"
      ? message.sender
      : null;

  // realtime event for chat window
  window.dispatchEvent(
    new CustomEvent("chat:message", { detail: data })
  );

  // global notification event
  window.dispatchEvent(
    new CustomEvent("chat:toast", { detail: data })
  );

});

socket.on("chat:typing", (data) => {

  window.dispatchEvent(
    new CustomEvent("chat:typing", { detail: data })
  );

});



  // ===============================
  // PROJECT EVENTS
  // ===============================

  socket.on("project:updated", (data) => {
    window.dispatchEvent(new CustomEvent("project:updated", { detail: data }));
  });

  socket.on("project:task-assigned", (data) => {
    showToast(`New task: ${data.task.title}`, "info");

    window.dispatchEvent(
      new CustomEvent("project:task-assigned", { detail: data })
    );
  });

  socket.on("project:task-completed", (data) => {
    showToast(`Task completed: ${data.taskName}`, "success");

    window.dispatchEvent(
      new CustomEvent("project:task-completed", { detail: data })
    );
  });

  socket.on("project:deadline-alert", (data) => {
    showToast(data.message, "warning", { duration: 8000 });
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);

    showToast(error.message || "Socket error occurred", "error");
  });

}, [token, user, showToast]);

  /**
   * Disconnect socket
   */
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setOnlineUsers([]);
      console.log('🔌 Socket disconnected manually');
    }
  }, []);

  /**
   * Play notification sound
   */
  const playNotificationSound = (type = 'default') => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (type === 'urgent') {
        // Urgent sound (two beeps)
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        
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
        // Default sound
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
   */
  const showBrowserNotification = (notification) => {
    try {
      const browserNotification = new Notification(notification.title || 'New Notification', {
        body: notification.message,
        icon: notification.icon || '/logo192.png',
        badge: '/badge.png',
        tag: notification._id,
        silent: notification.priority !== 'high'
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

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

  // ===========================================
  // SOCKET EMIT FUNCTIONS
  // ===========================================

  /**
   * Emit socket event
   */
  const emit = useCallback((event, data, callback) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Socket not connected, cannot emit:', event);
      if (callback) callback({ error: 'Socket not connected' });
      return false;
    }

    if (callback) {
      socketRef.current.emit(event, data, callback);
    } else {
      socketRef.current.emit(event, data);
    }
    return true;
  }, [isConnected]);

  /**
   * Join a room
   */
  const joinRoom = useCallback((room) => {
    return emit('join-room', { room });
  }, [emit]);

  /**
   * Leave a room
   */
  const leaveRoom = useCallback((room) => {
    return emit('leave-room', { room });
  }, [emit]);

  /**
   * Update user status
   */
  const updateStatus = useCallback((status) => {
    return emit('user:status', { status });
  }, [emit]);

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback((conversationId, isTyping) => {
    return emit('user:typing', { conversationId, isTyping });
  }, [emit]);

  /**
   * Mark notification as read
   */
  const markNotificationRead = useCallback((notificationId) => {
    return emit('notification:read', { notificationId });
  }, [emit]);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsRead = useCallback(() => {
    return emit('notification:read-all');
  }, [emit]);

  /**
   * Get unread count
   */
  const getUnreadCount = useCallback(() => {
    return emit('notification:unread-count');
  }, [emit]);

  /**
   * Send chat message
   */
  const sendMessage = useCallback((data) => {
    return emit('chat:send', data);
  }, [emit]);

  /**
   * Join conversation
   */
  const joinConversation = useCallback((conversationId) => {
    return emit('chat:join', { conversationId });
  }, [emit]);

  /**
   * Leave conversation
   */
  const leaveConversation = useCallback((conversationId) => {
    return emit('chat:leave', { conversationId });
  }, [emit]);

  /**
   * Join project
   */
  const joinProject = useCallback((projectId) => {
    return emit('project:join', { projectId });
  }, [emit]);

  /**
   * Leave project
   */
  const leaveProject = useCallback((projectId) => {
    return emit('project:leave', { projectId });
  }, [emit]);

  // ===========================================
  // EFFECTS
  // ===========================================

  // Connect when user authenticates
useEffect(() => {

  if (isAuthenticated && token && user) {
    connectSocket();
  }

}, [isAuthenticated, token, user]);

useEffect(() => {

  return () => {
    disconnectSocket();
  };

}, []);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Cleanup typing indicators periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          if (now - newState[key].timestamp > 3000) {
            delete newState[key];
          }
        });
        return newState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ===========================================
  // CONTEXT VALUE
  // ===========================================

  const value = {
  socket: socketRef.current,
  socketRef,
  isConnected,
    reconnecting,
    socketError,
    
    // User presence
    onlineUsers,
    typingUsers,
    
    // Notifications
    notifications,
    unreadCount,
    
    // Socket functions
    emit,
    joinRoom,
    leaveRoom,
    updateStatus,
    sendTyping,
    
    // Notification functions
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
    
    // Chat functions
    sendMessage,
    joinConversation,
    leaveConversation,
    
    // Project functions
    joinProject,
    leaveProject,
    
    // Utility
    requestNotificationPermission,
    
    // Manual connection control
    connectSocket,
    disconnectSocket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// ===========================================
// CUSTOM HOOKS FOR SPECIFIC FEATURES
// ===========================================

/**
 * Hook for chat functionality
 */
export const useChat = (conversationId) => {
  const { socket, isConnected, emit, joinConversation, leaveConversation } = useSocket();
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!conversationId || !isConnected) return;

    joinConversation(conversationId);

    const handleNewMessage = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: data.isTyping ? data.name : null
        }));
      }
    };

    window.addEventListener('chat:message', handleNewMessage);
    window.addEventListener('chat:typing', handleTyping);

    return () => {
      leaveConversation(conversationId);
      window.removeEventListener('chat:message', handleNewMessage);
      window.removeEventListener('chat:typing', handleTyping);
    };
  }, [conversationId, isConnected, joinConversation, leaveConversation]);

  const sendMessage = useCallback((content, receiverId, attachments = []) => {
    if (!isConnected) return false;
    
    return emit('chat:send', {
      conversationId,
      content,
      receiverId,
      attachments
    });
  }, [conversationId, isConnected, emit]);

  const sendTyping = useCallback((isTyping) => {
    if (!isConnected) return false;
    
    return emit('user:typing', {
      conversationId,
      isTyping
    });
  }, [conversationId, isConnected, emit]);

  return {
    messages,
    typingUsers,
    sendMessage,
    sendTyping
  };
};

/**
 * Hook for project functionality
 */
export const useProject = (projectId) => {
  const { socket, isConnected, emit, joinProject, leaveProject } = useSocket();
  const [projectData, setProjectData] = useState(null);

  useEffect(() => {
    if (!projectId || !isConnected) return;

    joinProject(projectId);

    const handleProjectUpdate = (data) => {
      if (data.projectId === projectId) {
        setProjectData(prev => ({ ...prev, ...data.updates }));
      }
    };

    window.addEventListener('project:updated', handleProjectUpdate);

    return () => {
      leaveProject(projectId);
      window.removeEventListener('project:updated', handleProjectUpdate);
    };
  }, [projectId, isConnected, joinProject, leaveProject]);

  return {
    projectData,
    emit
  };
};