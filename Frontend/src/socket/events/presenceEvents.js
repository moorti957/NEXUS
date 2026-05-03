import socketService from '../index';

/**
 * Presence Events Handler
 * Manages all real-time user presence events (online/offline status, typing indicators, activity tracking)
 */

// ===========================================
// PRESENCE EMIT EVENTS (Client → Server)
// ===========================================

/**
 * Update user status
 * @param {string} status - online/away/busy/offline
 */
export const emitUpdateStatus = (status) => {
  socketService.emit('presence:status', { status });
  console.log(`📡 Status updated: ${status}`);
};

/**
 * Send typing indicator
 * @param {string} conversationId - Conversation ID
 * @param {boolean} isTyping - Whether user is typing
 */
export const emitTyping = (conversationId, isTyping) => {
  socketService.emit('presence:typing', {
    conversationId,
    isTyping,
    timestamp: new Date()
  });
};

/**
 * Send activity update
 * @param {string} activity - Current activity (e.g., 'viewing projects', 'editing profile')
 */
export const emitActivity = (activity) => {
  socketService.emit('presence:activity', { activity });
};

/**
 * Send heartbeat/ping
 * @param {Function} callback - Optional callback with latency
 */
export const emitPing = (callback) => {
  const start = Date.now();
  socketService.emit('presence:ping', () => {
    if (callback) {
      const latency = Date.now() - start;
      callback(latency);
    }
  });
};

/**
 * Get all online users
 * @param {Function} callback - Callback with online users list
 */
export const emitGetOnlineUsers = (callback) => {
  socketService.emit('presence:get-online', (response) => {
    if (callback) callback(response);
  });
};

/**
 * Get specific user presence
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with user presence info
 */
export const emitGetUserPresence = (userId, callback) => {
  socketService.emit('presence:get-user', { userId }, (response) => {
    if (callback) callback(response);
  });
};

/**
 * Get multiple users presence
 * @param {Array} userIds - Array of user IDs
 * @param {Function} callback - Callback with users presence info
 */
export const emitGetMultiplePresence = (userIds, callback) => {
  socketService.emit('presence:get-multiple', { userIds }, (response) => {
    if (callback) callback(response);
  });
};

/**
 * Subscribe to user presence updates
 * @param {string} userId - User ID to subscribe to
 */
export const emitSubscribeToUser = (userId) => {
  socketService.emit('presence:subscribe', { userId });
};

/**
 * Unsubscribe from user presence updates
 * @param {string} userId - User ID to unsubscribe from
 */
export const emitUnsubscribeFromUser = (userId) => {
  socketService.emit('presence:unsubscribe', { userId });
};

/**
 * Get presence statistics
 * @param {Function} callback - Callback with presence stats
 */
export const emitGetPresenceStats = (callback) => {
  socketService.emit('presence:stats', (response) => {
    if (callback) callback(response);
  });
};

/**
 * Check if user is active
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with active status
 */
export const emitIsUserActive = (userId, callback) => {
  socketService.emit('presence:is-active', { userId }, (response) => {
    if (callback) callback(response);
  });
};

/**
 * Set auto-away status
 */
export const emitAutoAway = () => {
  socketService.emit('presence:auto-away');
};

/**
 * Broadcast to all online users (Admin only)
 * @param {string} message - Broadcast message
 * @param {string} type - Message type (info, warning, success, error)
 */
export const emitBroadcast = (message, type = 'info') => {
  socketService.emit('presence:broadcast', { message, type });
};

/**
 * Get presence history
 * @param {Object} params - Query parameters
 * @param {string} params.userId - User ID (optional, defaults to current user)
 * @param {number} params.days - Number of days of history
 * @param {Function} callback - Callback with presence history
 */
export const emitGetPresenceHistory = (params, callback) => {
  socketService.emit('presence:history', params, (response) => {
    if (callback) callback(response);
  });
};

/**
 * Cleanup inactive users (Admin only)
 * @param {Function} callback - Callback with cleanup results
 */
export const emitCleanupInactive = (callback) => {
  socketService.emit('presence:cleanup', (response) => {
    if (callback) callback(response);
  });
};

// ===========================================
// PRESENCE ON EVENTS (Server → Client)
// ===========================================

/**
 * Listen for status changes
 * @param {Function} callback - Callback with status change data
 */
export const onStatusChange = (callback) => {
  socketService.on('presence:status-change', (data) => {
    console.log(`📡 Status change: ${data.name} → ${data.newStatus}`);
    callback(data);
  });
};

/**
 * Listen for online users list
 * @param {Function} callback - Callback with online users list
 */
export const onOnlineUsers = (callback) => {
  socketService.on('presence:online-users', (data) => {
    console.log(`📡 Online users count: ${data.count}`);
    callback(data);
  });
};

/**
 * Listen for typing indicators
 * @param {Function} callback - Callback with typing data
 */
export const onTypingIndicator = (callback) => {
  socketService.on('presence:typing', (data) => {
    callback(data);
  });
};

/**
 * Listen for user online event
 * @param {Function} callback - Callback with user data
 */
export const onUserOnline = (callback) => {
  socketService.on('user:online', (data) => {
    console.log(`📡 User online: ${data.name}`);
    callback(data);
  });
};

/**
 * Listen for user offline event
 * @param {Function} callback - Callback with user data
 */
export const onUserOffline = (callback) => {
  socketService.on('user:offline', (data) => {
    console.log(`📡 User offline: ${data.userId}`);
    callback(data);
  });
};

/**
 * Listen for user status change (alias for onStatusChange)
 * @param {Function} callback - Callback with status change data
 */
export const onUserStatusChange = (callback) => {
  socketService.on('presence:status-change', (data) => {
    console.log(`📡 User status change: ${data.name} → ${data.newStatus}`);
    callback(data);
  });
};

/**
 * Listen for online users list update
 * @param {Function} callback - Callback with users list
 */
export const onOnlineListUpdate = (callback) => {
  socketService.on('users:online-list', (data) => {
    callback(data);
  });
};

/**
 * Listen for ping response
 * @param {Function} callback - Callback with pong data
 */
export const onPong = (callback) => {
  socketService.on('presence:pong', (data) => {
    callback(data);
  });
};

/**
 * Listen for user presence info
 * @param {Function} callback - Callback with user info
 */
export const onUserInfo = (callback) => {
  socketService.on('presence:user-info', (data) => {
    callback(data);
  });
};

/**
 * Listen for multiple users presence info
 * @param {Function} callback - Callback with users info
 */
export const onMultipleUsersInfo = (callback) => {
  socketService.on('presence:multiple-info', (data) => {
    callback(data);
  });
};

/**
 * Listen for presence subscription confirmation
 * @param {Function} callback - Callback with subscription data
 */
export const onSubscribed = (callback) => {
  socketService.on('presence:subscribed', (data) => {
    callback(data);
  });
};

/**
 * Listen for presence unsubscription confirmation
 * @param {Function} callback - Callback with unsubscription data
 */
export const onUnsubscribed = (callback) => {
  socketService.on('presence:unsubscribed', (data) => {
    callback(data);
  });
};

/**
 * Listen for presence statistics
 * @param {Function} callback - Callback with stats data
 */
export const onPresenceStats = (callback) => {
  socketService.on('presence:stats', (data) => {
    callback(data);
  });
};

/**
 * Listen for active status response
 * @param {Function} callback - Callback with active status
 */
export const onActiveStatus = (callback) => {
  socketService.on('presence:is-active-response', (data) => {
    callback(data);
  });
};

/**
 * Listen for admin broadcast messages
 * @param {Function} callback - Callback with broadcast data
 */
export const onBroadcast = (callback) => {
  socketService.on('presence:broadcast', (data) => {
    console.log(`📢 Broadcast: ${data.message}`);
    callback(data);
  });
};

/**
 * Listen for broadcast success confirmation
 * @param {Function} callback - Callback with success data
 */
export const onBroadcastSuccess = (callback) => {
  socketService.on('presence:broadcast-success', (data) => {
    callback(data);
  });
};

/**
 * Listen for presence history response
 * @param {Function} callback - Callback with history data
 */
export const onPresenceHistory = (callback) => {
  socketService.on('presence:history-response', (data) => {
    callback(data);
  });
};

/**
 * Listen for cleanup results
 * @param {Function} callback - Callback with cleanup data
 */
export const onCleanupResult = (callback) => {
  socketService.on('presence:cleanup-result', (data) => {
    callback(data);
  });
};

/**
 * Listen for admin activity updates
 * @param {Function} callback - Callback with admin activity
 */
export const onAdminActivity = (callback) => {
  socketService.on('presence:admin-activity', (data) => {
    callback(data);
  });
};

/**
 * Listen for status update confirmation
 * @param {Function} callback - Callback with status data
 */
export const onStatusUpdated = (callback) => {
  socketService.on('presence:status-updated', (data) => {
    callback(data);
  });
};

/**
 * Listen for presence errors
 * @param {Function} callback - Callback with error data
 */
export const onPresenceError = (callback) => {
  socketService.on('presence:error', (data) => {
    console.error('❌ Presence error:', data.message);
    callback(data);
  });
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Start heartbeat to keep connection alive
 * @param {number} interval - Heartbeat interval in ms (default: 30000)
 */
export const startHeartbeat = (interval = 30000) => {
  setInterval(() => {
    emitPing((latency) => {
      console.log(`💓 Heartbeat latency: ${latency}ms`);
    });
  }, interval);
};

/**
 * Track user activity
 * @param {string} activity - Current activity
 */
export const trackActivity = (activity) => {
  emitActivity(activity);
};

/**
 * Setup auto-away detection
 * @param {number} timeout - Inactivity timeout in ms (default: 300000 - 5 minutes)
 */
export const setupAutoAway = (timeout = 300000) => {
  let activityTimer;

  const resetTimer = () => {
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
      emitAutoAway();
    }, timeout);
  };

  // Reset timer on user activity
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  events.forEach(event => {
    document.addEventListener(event, resetTimer);
  });

  // Initial setup
  resetTimer();

  // Cleanup function
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, resetTimer);
    });
    clearTimeout(activityTimer);
  };
};

/**
 * Get user's online status color
 * @param {string} status - User status
 * @returns {string} Tailwind color class
 */
export const getStatusColor = (status) => {
  const colors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500'
  };
  return colors[status] || 'bg-gray-500';
};

/**
 * Get user's status icon
 * @param {string} status - User status
 * @returns {string} Status icon
 */
export const getStatusIcon = (status) => {
  const icons = {
    online: '🟢',
    away: '🟡',
    busy: '🔴',
    offline: '⚫'
  };
  return icons[status] || '⚪';
};

/**
 * Format last seen time
 * @param {Date} lastSeen - Last seen timestamp
 * @returns {string} Formatted last seen string
 */
export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Never';

  const now = new Date();
  const last = new Date(lastSeen);
  const diffMinutes = Math.floor((now - last) / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return last.toLocaleDateString();
};

// ===========================================
// REMOVE LISTENERS
// ===========================================

/**
 * Remove all presence event listeners
 */
export const removeAllPresenceListeners = () => {
  socketService.off('presence:status-change');
  socketService.off('presence:online-users');
  socketService.off('presence:typing');
  socketService.off('user:online');
  socketService.off('user:offline');
  socketService.off('users:online-list');
  socketService.off('presence:pong');
  socketService.off('presence:user-info');
  socketService.off('presence:multiple-info');
  socketService.off('presence:subscribed');
  socketService.off('presence:unsubscribed');
  socketService.off('presence:stats');
  socketService.off('presence:is-active-response');
  socketService.off('presence:broadcast');
  socketService.off('presence:broadcast-success');
  socketService.off('presence:history-response');
  socketService.off('presence:cleanup-result');
  socketService.off('presence:admin-activity');
  socketService.off('presence:status-updated');
  socketService.off('presence:error');
  console.log('🧹 All presence listeners removed');
};