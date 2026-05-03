const User = require('../../models/User');

/**
 * Presence Socket Handler
 * Manages real-time user presence, online/offline status, typing indicators, and activity tracking
 */
module.exports = (io, socket, onlineUsers) => {
  
  // ===========================================
  // UPDATE USER STATUS
  // ===========================================
  socket.on('presence:status', async (data) => {
    try {
      const { status } = data;

      // Validate status
      const validStatuses = ['online', 'away', 'busy', 'offline'];
      if (!validStatuses.includes(status)) {
        return socket.emit('presence:error', {
          message: 'Invalid status. Must be one of: online, away, busy, offline'
        });
      }

      if (socket.user && onlineUsers.has(socket.user._id.toString())) {
        // Update in-memory status
        const userData = onlineUsers.get(socket.user._id.toString());
        const oldStatus = userData.status;
        userData.status = status;
        userData.lastActivity = new Date();
        onlineUsers.set(socket.user._id.toString(), userData);

        // Update in database
        await User.findByIdAndUpdate(socket.user._id, {
          status,
          lastSeen: new Date()
        });

        // Broadcast status change to all connected clients
        io.emit('presence:status-change', {
          userId: socket.user._id,
          name: socket.user.name,
          oldStatus,
          newStatus: status,
          timestamp: new Date()
        });

        // Log status change
        console.log(`👤 User ${socket.user.name} status changed: ${oldStatus} → ${status}`);

        // Acknowledge to user
        socket.emit('presence:status-updated', {
          success: true,
          status,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('❌ Presence status update error:', error);
      socket.emit('presence:error', {
        message: 'Failed to update status',
        error: error.message
      });
    }
  });

  // ===========================================
  // GET ALL ONLINE USERS
  // ===========================================
  socket.on('presence:get-online', async () => {
    try {
      const onlineUsersList = Array.from(onlineUsers.values()).map(user => ({
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        connectedAt: user.connectedAt,
        lastActivity: user.lastActivity
      }));

      socket.emit('presence:online-users', {
        success: true,
        count: onlineUsersList.length,
        users: onlineUsersList,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Get online users error:', error);
      socket.emit('presence:error', {
        message: 'Failed to get online users',
        error: error.message
      });
    }
  });

  // ===========================================
  // TYPING INDICATOR
  // ===========================================
  socket.on('presence:typing', (data) => {
    try {
      const { conversationId, isTyping } = data;

      if (!conversationId) {
        return socket.emit('presence:error', {
          message: 'Conversation ID required'
        });
      }

      // Broadcast typing status to all users in the conversation except sender
      socket.to(`conversation:${conversationId}`).emit('presence:typing', {
        userId: socket.user?._id,
        name: socket.user?.name,
        conversationId,
        isTyping,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Typing indicator error:', error);
    }
  });

  // ===========================================
  // USER ACTIVITY TRACKING
  // ===========================================
  socket.on('presence:activity', (data) => {
    try {
      const { activity } = data;

      if (socket.user && onlineUsers.has(socket.user._id.toString())) {
        const userData = onlineUsers.get(socket.user._id.toString());
        userData.lastActivity = new Date();
        userData.currentActivity = activity || 'idle';
        onlineUsers.set(socket.user._id.toString(), userData);

        // Broadcast activity to relevant rooms (e.g., team members)
        if (socket.user.role === 'admin') {
          io.to('admins').emit('presence:admin-activity', {
            userId: socket.user._id,
            name: socket.user.name,
            activity,
            timestamp: new Date()
          });
        }
      }

    } catch (error) {
      console.error('❌ Activity tracking error:', error);
    }
  });

  // ===========================================
  // PING / HEARTBEAT
  // ===========================================
  socket.on('presence:ping', (callback) => {
    try {
      // Update last activity
      if (socket.user && onlineUsers.has(socket.user._id.toString())) {
        const userData = onlineUsers.get(socket.user._id.toString());
        userData.lastActivity = new Date();
        onlineUsers.set(socket.user._id.toString(), userData);
      }

      // Send pong response
      const response = {
        pong: true,
        timestamp: new Date(),
        userId: socket.user?._id,
        serverTime: Date.now()
      };

      if (typeof callback === 'function') {
        callback(response);
      } else {
        socket.emit('presence:pong', response);
      }

    } catch (error) {
      console.error('❌ Ping error:', error);
    }
  });

  // ===========================================
  // GET USER PRESENCE
  // ===========================================
  socket.on('presence:get-user', async (data) => {
    try {
      const { userId } = data;

      if (!userId) {
        return socket.emit('presence:error', {
          message: 'User ID required'
        });
      }

      // Check if user is online
      const isOnline = onlineUsers.has(userId.toString());
      let userData = null;

      if (isOnline) {
        userData = onlineUsers.get(userId.toString());
      } else {
        // Get last seen from database
        const user = await User.findById(userId).select('name email avatar status lastSeen');
        if (user) {
          userData = {
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            status: 'offline',
            lastSeen: user.lastSeen
          };
        }
      }

      socket.emit('presence:user-info', {
        success: true,
        userId,
        isOnline,
        userData,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Get user presence error:', error);
      socket.emit('presence:error', {
        message: 'Failed to get user presence',
        error: error.message
      });
    }
  });

  // ===========================================
  // GET MULTIPLE USERS PRESENCE
  // ===========================================
  socket.on('presence:get-multiple', async (data) => {
    try {
      const { userIds } = data;

      if (!userIds || !Array.isArray(userIds)) {
        return socket.emit('presence:error', {
          message: 'User IDs array required'
        });
      }

      const presenceData = [];

      for (const userId of userIds) {
        const isOnline = onlineUsers.has(userId.toString());
        let userData = null;

        if (isOnline) {
          userData = onlineUsers.get(userId.toString());
        } else {
          const user = await User.findById(userId).select('name email avatar status lastSeen');
          if (user) {
            userData = {
              userId: user._id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              status: 'offline',
              lastSeen: user.lastSeen
            };
          }
        }

        if (userData) {
          presenceData.push({
            ...userData,
            isOnline
          });
        }
      }

      socket.emit('presence:multiple-info', {
        success: true,
        users: presenceData,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Get multiple users presence error:', error);
      socket.emit('presence:error', {
        message: 'Failed to get users presence',
        error: error.message
      });
    }
  });

  // ===========================================
  // SUBSCRIBE TO USER PRESENCE
  // ===========================================
  socket.on('presence:subscribe', (data) => {
    try {
      const { userId } = data;

      if (!userId) {
        return socket.emit('presence:error', {
          message: 'User ID required'
        });
      }

      // Join user's presence room to get updates
      socket.join(`presence:${userId}`);

      // Send current presence immediately
      const isOnline = onlineUsers.has(userId.toString());
      let userData = null;

      if (isOnline) {
        userData = onlineUsers.get(userId.toString());
      }

      socket.emit('presence:subscribed', {
        success: true,
        userId,
        isOnline,
        userData: userData ? {
          status: userData.status,
          lastActivity: userData.lastActivity
        } : null,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Subscribe to presence error:', error);
      socket.emit('presence:error', {
        message: 'Failed to subscribe to presence',
        error: error.message
      });
    }
  });

  // ===========================================
  // UNSUBSCRIBE FROM USER PRESENCE
  // ===========================================
  socket.on('presence:unsubscribe', (data) => {
    try {
      const { userId } = data;

      if (userId) {
        socket.leave(`presence:${userId}`);
      }

      socket.emit('presence:unsubscribed', {
        success: true,
        userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Unsubscribe from presence error:', error);
    }
  });

  // ===========================================
  // GET PRESENCE STATISTICS
  // ===========================================
  socket.on('presence:stats', async () => {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

      // Count users by status
      const onlineCount = Array.from(onlineUsers.values()).filter(u => u.status === 'online').length;
      const awayCount = Array.from(onlineUsers.values()).filter(u => u.status === 'away').length;
      const busyCount = Array.from(onlineUsers.values()).filter(u => u.status === 'busy').length;
      
      // Get active users (activity in last 5 minutes)
      const activeCount = Array.from(onlineUsers.values()).filter(
        u => u.lastActivity > fiveMinutesAgo
      ).length;

      // Get counts by role
      const roleCounts = {};
      onlineUsers.forEach(user => {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      });

      socket.emit('presence:stats', {
        success: true,
        stats: {
          total: onlineUsers.size,
          online: onlineCount,
          away: awayCount,
          busy: busyCount,
          active: activeCount,
          idle: onlineUsers.size - activeCount,
          byRole: roleCounts
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Get presence stats error:', error);
      socket.emit('presence:error', {
        message: 'Failed to get presence statistics',
        error: error.message
      });
    }
  });

  // ===========================================
  // SET AWAY STATUS AUTOMATICALLY
  // ===========================================
  socket.on('presence:auto-away', () => {
    try {
      if (socket.user && onlineUsers.has(socket.user._id.toString())) {
        const userData = onlineUsers.get(socket.user._id.toString());
        
        if (userData.status === 'online') {
          userData.status = 'away';
          userData.lastActivity = new Date();
          onlineUsers.set(socket.user._id.toString(), userData);

          // Broadcast status change
          io.emit('presence:status-change', {
            userId: socket.user._id,
            name: socket.user.name,
            oldStatus: 'online',
            newStatus: 'away',
            auto: true,
            timestamp: new Date()
          });

          // Update database
          User.findByIdAndUpdate(socket.user._id, {
            status: 'away',
            lastSeen: new Date()
          }).catch(err => console.error('Error updating auto-away status:', err));
        }
      }

    } catch (error) {
      console.error('❌ Auto-away error:', error);
    }
  });

  // ===========================================
  // CHECK IF USER IS ACTIVE
  // ===========================================
  socket.on('presence:is-active', (data) => {
    try {
      const { userId } = data;

      if (!userId) {
        return socket.emit('presence:error', {
          message: 'User ID required'
        });
      }

      const userData = onlineUsers.get(userId.toString());
      const now = new Date();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      
      const isActive = userData && userData.lastActivity > fiveMinutesAgo;

      socket.emit('presence:is-active-response', {
        success: true,
        userId,
        isActive: !!isActive,
        lastActivity: userData?.lastActivity,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Check active status error:', error);
      socket.emit('presence:error', {
        message: 'Failed to check active status',
        error: error.message
      });
    }
  });

  // ===========================================
  // BROADCAST TO ALL ONLINE USERS (Admin only)
  // ===========================================
  socket.on('presence:broadcast', async (data) => {
    try {
      // Check if user is admin
      if (socket.user.role !== 'admin') {
        return socket.emit('presence:error', {
          message: 'Only admins can broadcast to all online users'
        });
      }

      const { message, type = 'info' } = data;

      // Broadcast to all online users
      onlineUsers.forEach((userData, userId) => {
        io.to(userData.socketId).emit('presence:broadcast', {
          message,
          type,
          from: socket.user.name,
          timestamp: new Date()
        });
      });

      socket.emit('presence:broadcast-success', {
        success: true,
        recipients: onlineUsers.size,
        message: 'Broadcast sent to all online users',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Broadcast error:', error);
      socket.emit('presence:error', {
        message: 'Failed to broadcast',
        error: error.message
      });
    }
  });

  // ===========================================
  // GET PRESENCE HISTORY
  // ===========================================
  socket.on('presence:history', async (data) => {
    try {
      const { userId, days = 7 } = data;
      const targetUserId = userId || socket.user._id;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user's presence history from database
      const user = await User.findById(targetUserId)
        .select('status lastSeen loginHistory')
        .populate('loginHistory');

      if (!user) {
        return socket.emit('presence:error', {
          message: 'User not found'
        });
      }

      // Format login history
      const history = user.loginHistory
        .filter(entry => entry.timestamp >= startDate)
        .map(entry => ({
          timestamp: entry.timestamp,
          action: entry.action,
          ip: entry.ip,
          location: entry.location
        }));

      socket.emit('presence:history-response', {
        success: true,
        userId: targetUserId,
        days,
        history,
        currentStatus: user.status,
        lastSeen: user.lastSeen,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Get presence history error:', error);
      socket.emit('presence:error', {
        message: 'Failed to get presence history',
        error: error.message
      });
    }
  });

  // ===========================================
  // CLEANUP INACTIVE USERS (Admin only)
  // ===========================================
  socket.on('presence:cleanup', async () => {
    try {
      if (socket.user.role !== 'admin') {
        return socket.emit('presence:error', {
          message: 'Only admins can cleanup inactive users'
        });
      }

      const now = new Date();
      const inactiveThreshold = new Date(now - 30 * 60 * 1000); // 30 minutes
      let cleanedCount = 0;

      onlineUsers.forEach((userData, userId) => {
        if (userData.lastActivity < inactiveThreshold) {
          onlineUsers.delete(userId);
          cleanedCount++;
        }
      });

      // Broadcast updated online list
      const onlineUsersList = Array.from(onlineUsers.values()).map(user => ({
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status
      }));

      io.emit('users:online-list', onlineUsersList);

      socket.emit('presence:cleanup-result', {
        success: true,
        cleaned: cleanedCount,
        remaining: onlineUsers.size,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Cleanup error:', error);
      socket.emit('presence:error', {
        message: 'Failed to cleanup inactive users',
        error: error.message
      });
    }
  });

  // ===========================================
  // ERROR HANDLING
  // ===========================================
  socket.on('presence:error', (error) => {
    console.error(`❌ Presence socket error from client ${socket.id}:`, error);
  });

  // Log successful handler initialization
  console.log(`✅ Presence handler initialized for socket ${socket.id}`);
};