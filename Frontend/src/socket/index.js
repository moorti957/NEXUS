import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventCallbacks = {};
  }

  /**
   * Connect to Socket.IO server
   * @param {string} token - JWT authentication token
   * @returns {Object} Socket instance
   */
  connect(token) {
    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket already connected');
      return this.socket;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    console.log('🔌 Connecting to Socket.IO server:', API_URL);

    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true,
      withCredentials: true
    });

    this.setupDefaultListeners();
    return this.socket;
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.eventCallbacks = {};
      console.log('🔌 Socket disconnected');
    }
  }

  /**
   * Setup default socket event listeners
   */
  setupDefaultListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected successfully');
      console.log('🆔 Socket ID:', this.socket.id);
      this.reconnectAttempts = 0;
      
      // Emit login event after connection
      this.emit('auth:login', {
        timestamp: new Date()
      });

      // Start heartbeat
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected. Reason:', reason);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        this.connect();
      }
      // Otherwise reconnection will be handled automatically
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached');
        this.emit('socket:max-reconnect-attempts', { attempts: this.reconnectAttempts });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      this.emit('socket:reconnect-failed', {});
    });

    this.socket.on('ping', () => {
      console.log('📡 Ping received');
    });

    this.socket.on('pong', (latency) => {
      console.log('📡 Pong received, latency:', latency, 'ms');
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Auth events
    this.socket.on('auth:welcome', (data) => {
      console.log('👋 Welcome message:', data.message);
      this.emit('auth:welcome-received', data);
    });

    this.socket.on('auth:error', (data) => {
      console.error('❌ Auth error:', data.message);
      this.emit('auth:error', data);
    });

    this.socket.on('auth:force-logout', (data) => {
      console.warn('⚠️ Force logout:', data.message);
      this.emit('auth:force-logout', data);
    });

    // Presence events
    this.socket.on('presence:status-change', (data) => {
      console.log(`👤 User ${data.name} status: ${data.oldStatus} → ${data.newStatus}`);
      this.emit('presence:status-change', data);
    });

    this.socket.on('presence:online-users', (data) => {
      console.log(`👥 Online users: ${data.count}`);
      this.emit('presence:online-users', data);
    });

    this.socket.on('presence:typing', (data) => {
      this.emit('presence:typing', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      console.log('📨 New notification:', data.notification.title);
      this.emit('notification:new', data);
    });

    this.socket.on('notification:unread-count', (data) => {
      this.emit('notification:unread-count', data);
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      console.log('💬 New message in conversation:', data.conversationId);
      this.emit('chat:message', data);
    });

    this.socket.on('chat:typing', (data) => {
      this.emit('chat:typing', data);
    });

    this.socket.on('chat:read-receipt', (data) => {
      this.emit('chat:read-receipt', data);
    });

    // Project events
    this.socket.on('project:update', (data) => {
      console.log('📁 Project updated:', data.projectId);
      this.emit('project:update', data);
    });

    this.socket.on('project:new-task', (data) => {
      console.log('📋 New task assigned:', data.task.title);
      this.emit('project:new-task', data);
    });

    // User events
    this.socket.on('user:online', (data) => {
      console.log(`👤 User ${data.name} is online`);
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data) => {
      console.log(`👤 User went offline`);
      this.emit('user:offline', data);
    });

    this.socket.on('users:online-list', (data) => {
      console.log(`👥 Online users list updated: ${data.length} users`);
      this.emit('users:online-list', data);
    });

    // Room events
    this.socket.on('room:joined', (data) => {
      console.log(`🚪 Joined room: ${data.room}`);
      this.emit('room:joined', data);
    });

    this.socket.on('room:left', (data) => {
      console.log(`🚪 Left room: ${data.room}`);
      this.emit('room:left', data);
    });

    // Broadcast events
    this.socket.on('auth:broadcast', (data) => {
      console.log('📢 Broadcast from admin:', data.message);
      this.emit('auth:broadcast', data);
    });

    this.socket.on('presence:broadcast', (data) => {
      console.log('📢 Presence broadcast:', data.message);
      this.emit('presence:broadcast', data);
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.emit('presence:ping', (response) => {
          if (response) {
            console.log('💓 Heartbeat response:', response);
          }
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @param {Function} callback - Optional callback
   */
  emit(event, data, callback) {
    if (!this.socket || !this.socket.connected) {
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
      
      // Store event to emit after reconnect
      this.storeEventForReconnect(event, data, callback);
      return;
    }

    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  /**
   * Store events to replay after reconnection
   */
  storeEventForReconnect(event, data, callback) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    
    this.eventCallbacks[event].push({ data, callback });
    
    // Limit stored events
    if (this.eventCallbacks[event].length > 10) {
      this.eventCallbacks[event].shift();
    }
  }

  /**
   * Replay stored events after reconnection
   */
  replayStoredEvents() {
    Object.keys(this.eventCallbacks).forEach(event => {
      this.eventCallbacks[event].forEach(({ data, callback }) => {
        this.emit(event, data, callback);
      });
    });
    
    // Clear after replay
    this.eventCallbacks = {};
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn(`⚠️ Cannot listen to ${event}: Socket not connected`);
      return;
    }

    // Remove existing listener if any
    if (this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
    }

    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   */
  off(event) {
    if (!this.socket) return;

    if (this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }

  /**
   * Remove all event listeners
   */
  offAll() {
    if (!this.socket) return;

    this.listeners.forEach((callback, event) => {
      this.socket.off(event, callback);
    });
    this.listeners.clear();
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Get socket ID
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket?.id || null;
  }

  /**
   * Join a room
   * @param {string} room - Room name
   */
  joinRoom(room) {
    this.emit('join-room', room);
  }

  /**
   * Leave a room
   * @param {string} room - Room name
   */
  leaveRoom(room) {
    this.emit('leave-room', room);
  }

  // ===========================================
  // PRESENCE METHODS
  // ===========================================

  /**
   * Update user status
   * @param {string} status - online/away/busy/offline
   */
  updateStatus(status) {
    this.emit('presence:status', { status });
  }

  /**
   * Send typing indicator
   * @param {string} conversationId - Conversation ID
   * @param {boolean} isTyping - Typing status
   */
  sendTyping(conversationId, isTyping) {
    this.emit('presence:typing', { conversationId, isTyping });
  }

  /**
   * Get online users
   */
  getOnlineUsers() {
    return new Promise((resolve) => {
      this.emit('presence:get-online', (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Subscribe to user presence
   * @param {string} userId - User ID
   */
  subscribeToUser(userId) {
    this.emit('presence:subscribe', { userId });
  }

  /**
   * Unsubscribe from user presence
   * @param {string} userId - User ID
   */
  unsubscribeFromUser(userId) {
    this.emit('presence:unsubscribe', { userId });
  }

  /**
   * Check if user is active
   * @param {string} userId - User ID
   */
  isUserActive(userId) {
    return new Promise((resolve) => {
      this.emit('presence:is-active', { userId }, (response) => {
        resolve(response);
      });
    });
  }

  // ===========================================
  // CHAT METHODS
  // ===========================================

  /**
   * Send chat message
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   * @param {string} receiverId - Receiver ID
   * @param {Array} attachments - Attachments array
   */
  sendMessage(conversationId, content, receiverId, attachments = []) {
    this.emit('chat:send', {
      conversationId,
      content,
      receiverId,
      attachments
    });
  }

  /**
   * Join conversation
   * @param {string} conversationId - Conversation ID
   */
  joinConversation(conversationId) {
    this.emit('chat:join', conversationId);
  }

  /**
   * Leave conversation
   * @param {string} conversationId - Conversation ID
   */
  leaveConversation(conversationId) {
    this.emit('chat:leave', conversationId);
  }

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {Array} messageIds - Message IDs to mark as read
   */
  markAsRead(conversationId, messageIds) {
    this.emit('chat:read', { conversationId, messageIds });
  }

  // ===========================================
  // NOTIFICATION METHODS
  // ===========================================

  /**
   * Send notification to user
   * @param {Object} notification - Notification object
   */
  sendNotification(notification) {
    this.emit('notification:send', notification);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markNotificationRead(notificationId) {
    this.emit('notification:read', notificationId);
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead() {
    this.emit('notification:read-all');
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return new Promise((resolve) => {
      this.emit('notification:unread-count', (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Get all notifications
   * @param {Object} params - Pagination params
   */
  getNotifications(params = {}) {
    return new Promise((resolve) => {
      this.emit('notification:get-all', params, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   */
  deleteNotification(notificationId) {
    this.emit('notification:delete', notificationId);
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications() {
    this.emit('notification:clear-all');
  }

  // ===========================================
  // PROJECT METHODS
  // ===========================================

  /**
   * Join project room
   * @param {string} projectId - Project ID
   */
  joinProject(projectId) {
    this.emit('project:join', projectId);
  }

  /**
   * Leave project room
   * @param {string} projectId - Project ID
   */
  leaveProject(projectId) {
    this.emit('project:leave', projectId);
  }

  // ===========================================
  // AUTH METHODS
  // ===========================================

  /**
   * Verify token
   */
  verifyToken() {
    return new Promise((resolve) => {
      this.emit('auth:verify-token', {}, (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Check session status
   */
  checkSession() {
    return new Promise((resolve) => {
      this.emit('auth:check-session', (response) => {
        resolve(response);
      });
    });
  }

  /**
   * Logout
   */
  logout() {
    this.emit('auth:logout', {});
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  /**
   * Test connection latency
   */
  ping() {
    const start = Date.now();
    return new Promise((resolve) => {
      this.emit('presence:ping', () => {
        const latency = Date.now() - start;
        resolve(latency);
      });
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts,
      listenersCount: this.listeners.size
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;