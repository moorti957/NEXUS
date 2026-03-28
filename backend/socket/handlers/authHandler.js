const User = require('../../models/User');

/**
 * Authentication Socket Handler
 * Manages user authentication, login, logout, and presence events
 */
module.exports = (io, socket, onlineUsers) => {
  
  // ===========================================
  // USER LOGIN HANDLER
  // ===========================================
  socket.on('auth:login', async (data) => {
    try {
      console.log(`🔐 Auth: User ${socket.user?.name} logging in`);

      // Update user status in database
      await User.findByIdAndUpdate(socket.user._id, {
        status: 'online',
        lastSeen: new Date(),
        socketId: socket.id
      });

      // Update online users map
      onlineUsers.set(socket.user._id.toString(), {
        socketId: socket.id,
        userId: socket.user._id,
        name: socket.user.name,
        email: socket.user.email,
        role: socket.user.role,
        avatar: socket.user.avatar,
        connectedAt: new Date(),
        lastActivity: new Date(),
        status: 'online'
      });

      // Send current online users to the newly connected user
      const onlineUsersList = Array.from(onlineUsers.values()).map(user => ({
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status
      }));

      socket.emit('auth:online-users', onlineUsersList);

      // Notify all other users about new connection
      socket.broadcast.emit('auth:user-connected', {
        userId: socket.user._id,
        name: socket.user.name,
        email: socket.user.email,
        role: socket.user.role,
        avatar: socket.user.avatar,
        status: 'online',
        timestamp: new Date()
      });

      // Send welcome message to the user
      socket.emit('auth:welcome', {
        message: `Welcome back, ${socket.user.name}!`,
        userId: socket.user._id,
        timestamp: new Date()
      });

      console.log(`✅ User ${socket.user.name} logged in successfully`);

    } catch (error) {
      console.error('❌ Auth login error:', error);
      socket.emit('auth:error', {
        message: 'Login failed',
        error: error.message
      });
    }
  });

  // ===========================================
  // USER LOGOUT HANDLER
  // ===========================================
  socket.on('auth:logout', async (data) => {
    try {
      console.log(`🔐 Auth: User ${socket.user?.name} logging out`);

      if (socket.user) {
        // Remove from online users
        onlineUsers.delete(socket.user._id.toString());

        // Update user status in database
        await User.findByIdAndUpdate(socket.user._id, {
          status: 'offline',
          lastSeen: new Date(),
          socketId: null
        });

        // Notify all users about disconnection
        io.emit('auth:user-disconnected', {
          userId: socket.user._id,
          name: socket.user.name,
          timestamp: new Date()
        });

        // Send updated online users list
        const onlineUsersList = Array.from(onlineUsers.values()).map(user => ({
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          status: user.status
        }));
        
        io.emit('users:online-list', onlineUsersList);

        console.log(`✅ User ${socket.user.name} logged out successfully`);
      }

    } catch (error) {
      console.error('❌ Auth logout error:', error);
      socket.emit('auth:error', {
        message: 'Logout failed',
        error: error.message
      });
    }
  });

  // ===========================================
  // TOKEN VERIFICATION HANDLER
  // ===========================================
  socket.on('auth:verify-token', async (data) => {
    try {
      const { token } = data;

      if (!token) {
        return socket.emit('auth:token-verified', {
          valid: false,
          message: 'No token provided'
        });
      }

      // Token is already verified by middleware
      // Just return user info
      socket.emit('auth:token-verified', {
        valid: true,
        user: {
          _id: socket.user._id,
          name: socket.user.name,
          email: socket.user.email,
          role: socket.user.role,
          avatar: socket.user.avatar
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Token verification error:', error);
      socket.emit('auth:token-verified', {
        valid: false,
        message: 'Token verification failed',
        error: error.message
      });
    }
  });

  // ===========================================
  // CHECK ONLINE STATUS HANDLER
  // ===========================================
  socket.on('auth:check-online', async (data) => {
    try {
      const { userId } = data;

      if (!userId) {
        return socket.emit('auth:online-status', {
          success: false,
          message: 'User ID required'
        });
      }

      const isOnline = onlineUsers.has(userId.toString());
      const userData = onlineUsers.get(userId.toString());

      socket.emit('auth:online-status', {
        success: true,
        userId,
        isOnline,
        userData: userData ? {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: userData.status,
          lastActivity: userData.lastActivity
        } : null
      });

    } catch (error) {
      console.error('❌ Check online status error:', error);
      socket.emit('auth:online-status', {
        success: false,
        message: 'Failed to check online status',
        error: error.message
      });
    }
  });

  // ===========================================
  // GET ALL ONLINE USERS HANDLER
  // ===========================================
  socket.on('auth:get-online-users', async () => {
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

      socket.emit('auth:online-users-list', {
        success: true,
        count: onlineUsersList.length,
        users: onlineUsersList,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Get online users error:', error);
      socket.emit('auth:online-users-list', {
        success: false,
        message: 'Failed to get online users',
        error: error.message
      });
    }
  });

  // ===========================================
  // SESSION CHECK HANDLER
  // ===========================================
  socket.on('auth:check-session', async () => {
    try {
      if (!socket.user) {
        return socket.emit('auth:session-status', {
          valid: false,
          message: 'No active session'
        });
      }

      // Check if user still exists in database
      const user = await User.findById(socket.user._id);
      
      if (!user) {
        return socket.emit('auth:session-status', {
          valid: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return socket.emit('auth:session-status', {
          valid: false,
          message: 'Account is deactivated'
        });
      }

      socket.emit('auth:session-status', {
        valid: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Session check error:', error);
      socket.emit('auth:session-status', {
        valid: false,
        message: 'Session check failed',
        error: error.message
      });
    }
  });

  // ===========================================
  // FORCE LOGOUT HANDLER (Admin only)
  // ===========================================
  socket.on('auth:force-logout', async (data) => {
    try {
      const { userId } = data;

      // Check if current user is admin
      if (socket.user.role !== 'admin') {
        return socket.emit('auth:error', {
          message: 'Only admins can force logout users'
        });
      }

      const userSocket = onlineUsers.get(userId.toString());
      
      if (userSocket) {
        // Send force logout message to that user
        io.to(userSocket.socketId).emit('auth:force-logout', {
          message: 'You have been logged out by admin',
          timestamp: new Date()
        });

        // Disconnect the user's socket
        const clientSocket = io.sockets.sockets.get(userSocket.socketId);
        if (clientSocket) {
          clientSocket.disconnect(true);
        }

        // Remove from online users
        onlineUsers.delete(userId.toString());

        // Update database
        await User.findByIdAndUpdate(userId, {
          status: 'offline',
          lastSeen: new Date(),
          socketId: null
        });

        // Notify all users
        io.emit('auth:user-disconnected', {
          userId,
          forced: true,
          byAdmin: socket.user.name,
          timestamp: new Date()
        });

        socket.emit('auth:force-logout-success', {
          message: `User ${userId} has been logged out`,
          userId
        });
      }

    } catch (error) {
      console.error('❌ Force logout error:', error);
      socket.emit('auth:error', {
        message: 'Failed to force logout',
        error: error.message
      });
    }
  });

  // ===========================================
  // BROADCAST TO ALL USERS (Admin only)
  // ===========================================
  socket.on('auth:broadcast', async (data) => {
    try {
      const { message, type = 'info' } = data;

      // Check if current user is admin
      if (socket.user.role !== 'admin') {
        return socket.emit('auth:error', {
          message: 'Only admins can broadcast messages'
        });
      }

      // Broadcast to all connected users
      io.emit('auth:broadcast', {
        message,
        type,
        from: socket.user.name,
        timestamp: new Date()
      });

      socket.emit('auth:broadcast-success', {
        message: 'Broadcast sent successfully'
      });

    } catch (error) {
      console.error('❌ Broadcast error:', error);
      socket.emit('auth:error', {
        message: 'Failed to broadcast',
        error: error.message
      });
    }
  });

  // ===========================================
  // UPDATE USER PROFILE (Real-time)
  // ===========================================
  socket.on('auth:profile-updated', async (data) => {
    try {
      const { updates } = data;

      if (socket.user) {
        // Update online users map
        const userData = onlineUsers.get(socket.user._id.toString());
        if (userData) {
          Object.assign(userData, updates);
          onlineUsers.set(socket.user._id.toString(), userData);
        }

        // Notify all users about profile update
        io.emit('auth:profile-updated', {
          userId: socket.user._id,
          updates,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('❌ Profile update broadcast error:', error);
    }
  });

  // ===========================================
  // HEARTBEAT / PING HANDLER
  // ===========================================
  socket.on('auth:heartbeat', () => {
    if (socket.user) {
      const userData = onlineUsers.get(socket.user._id.toString());
      if (userData) {
        userData.lastActivity = new Date();
        onlineUsers.set(socket.user._id.toString(), userData);
      }
    }
    
    socket.emit('auth:heartbeat-ack', {
      timestamp: new Date()
    });
  });

  // ===========================================
  // ERROR HANDLING
  // ===========================================
  socket.on('auth:error', (error) => {
    console.error(`❌ Auth socket error from client ${socket.id}:`, error);
  });

  // Log successful handler initialization
  console.log(`✅ Auth handler initialized for socket ${socket.id}`);
};