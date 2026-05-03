const jwt = require('jsonwebtoken');
const User = require('../../models/User');

/**
 * Socket Authentication Middleware
 * Verifies JWT token for socket connections
 * @param {Object} socket - Socket instance
 * @param {Function} next - Next function
 */
const socketAuth = async (socket, next) => {
  try {
    // Extract token from multiple possible locations
    const token = 
      socket.handshake.auth.token || 
      socket.handshake.headers.token || 
      socket.handshake.query.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    // Check if token exists
    if (!token) {
      console.error('❌ Socket authentication failed: No token provided');
      return next(new Error('Authentication token required'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        console.error('❌ Socket authentication failed: Token expired');
        return next(new Error('Token expired'));
      }
      if (jwtError.name === 'JsonWebTokenError') {
        console.error('❌ Socket authentication failed: Invalid token');
        return next(new Error('Invalid token'));
      }
      throw jwtError;
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.error('❌ Socket authentication failed: User not found');
      return next(new Error('User not found'));
    }

    // Check if user is active
    if (!user.isActive) {
      console.error('❌ Socket authentication failed: Account deactivated');
      return next(new Error('Account has been deactivated'));
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.error('❌ Socket authentication failed: Account blocked');
      return next(new Error(user.blockedReason || 'Account has been blocked'));
    }

    // Attach user to socket
    socket.user = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      company: user.company,
      position: user.position,
      permissions: user.permissions
    };

    // Log successful authentication
    console.log(`✅ Socket authenticated: ${user.name} (${user.email}) - Role: ${user.role}`);

    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error('Authentication failed'));
  }
};

/**
 * Optional Socket Authentication
 * Tries to authenticate but doesn't fail if no token
 * @param {Object} socket - Socket instance
 * @param {Function} next - Next function
 */
const optionalSocketAuth = async (socket, next) => {
  try {
    const token = 
      socket.handshake.auth.token || 
      socket.handshake.headers.token || 
      socket.handshake.query.token;

    if (!token) {
      // No token, continue without user
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive && !user.isBlocked) {
        socket.user = {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        };
        console.log(`✅ Optional auth: User ${user.name} authenticated`);
      } else {
        socket.user = null;
      }
    } catch (jwtError) {
      // Token invalid, continue without user
      socket.user = null;
    }

    next();
  } catch (error) {
    console.error('❌ Optional socket auth error:', error.message);
    socket.user = null;
    next();
  }
};

/**
 * Admin Only Socket Middleware
 * @param {Object} socket - Socket instance
 * @param {Function} next - Next function
 */
const adminOnlySocket = (socket, next) => {
  if (!socket.user) {
    return next(new Error('Authentication required'));
  }

  if (socket.user.role !== 'admin') {
    console.error(`❌ Admin access denied for user: ${socket.user.email} (Role: ${socket.user.role})`);
    return next(new Error('Admin access required'));
  }

  console.log(`✅ Admin socket access granted: ${socket.user.name}`);
  next();
};

/**
 * Project Access Middleware
 * Checks if user has access to specific project
 * @param {Object} socket - Socket instance
 * @param {Function} next - Next function
 */
const projectAccessSocket = (projectId) => {
  return async (socket, next) => {
    try {
      if (!socket.user) {
        return next(new Error('Authentication required'));
      }

      const Project = require('../../models/Project');
      const project = await Project.findById(projectId)
        .populate('teamMembers.user', '_id')
        .populate('projectManager', '_id');

      if (!project) {
        return next(new Error('Project not found'));
      }

      // Check if user is admin
      if (socket.user.role === 'admin') {
        return next();
      }

      // Check if user is project manager
      if (project.projectManager && 
          project.projectManager._id.toString() === socket.user._id.toString()) {
        return next();
      }

      // Check if user is team member
      const isTeamMember = project.teamMembers.some(
        member => member.user._id.toString() === socket.user._id.toString()
      );

      if (isTeamMember) {
        return next();
      }

      console.error(`❌ Project access denied for user: ${socket.user.email} to project: ${projectId}`);
      next(new Error('You do not have access to this project'));
    } catch (error) {
      console.error('❌ Project access check error:', error.message);
      next(new Error('Error checking project access'));
    }
  };
};

/**
 * Conversation Access Middleware
 * Checks if user has access to specific conversation
 * @param {Object} socket - Socket instance
 * @param {Function} next - Next function
 */
const conversationAccessSocket = (conversationId) => {
  return async (socket, next) => {
    try {
      if (!socket.user) {
        return next(new Error('Authentication required'));
      }

      const Conversation = require('../../models/Message').Conversation;
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return next(new Error('Conversation not found'));
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(
        p => p.toString() === socket.user._id.toString()
      );

      if (!isParticipant) {
        console.error(`❌ Conversation access denied for user: ${socket.user.email} to conversation: ${conversationId}`);
        return next(new Error('You do not have access to this conversation'));
      }

      next();
    } catch (error) {
      console.error('❌ Conversation access check error:', error.message);
      next(new Error('Error checking conversation access'));
    }
  };
};

/**
 * Rate Limit Middleware for Socket
 * @param {Object} options - Rate limit options
 */
const socketRateLimit = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute
    max = 100, // max events per window
    message = 'Too many requests, please slow down'
  } = options;

  const clients = new Map();

  return (socket, next) => {
    const clientId = socket.user ? socket.user._id.toString() : socket.id;
    const now = Date.now();

    if (!clients.has(clientId)) {
      clients.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    const clientData = clients.get(clientId);

    if (now > clientData.resetTime) {
      // Reset window
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
      clients.set(clientId, clientData);
      return next();
    }

    if (clientData.count >= max) {
      console.warn(`⚠️ Rate limit exceeded for client: ${clientId}`);
      return next(new Error(message));
    }

    clientData.count++;
    clients.set(clientId, clientData);
    next();
  };
};

/**
 * Validate Socket Data Middleware
 * @param {Object} schema - Validation schema
 */
const validateSocketData = (schema) => {
  return (data, callback) => {
    const { error } = schema.validate(data);
    if (error) {
      console.warn('⚠️ Socket data validation failed:', error.message);
      callback({
        success: false,
        message: error.message
      });
      return false;
    }
    return true;
  };
};

/**
 * Track Socket Connections
 * @param {Map} onlineUsers - Map of online users
 */
const trackConnection = (onlineUsers) => {
  return (socket, next) => {
    if (socket.user) {
      // Store connection info
      onlineUsers.set(socket.user._id.toString(), {
        socketId: socket.id,
        userId: socket.user._id,
        name: socket.user.name,
        email: socket.user.email,
        role: socket.user.role,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      console.log(`👥 User ${socket.user.name} added to online users map`);
    }
    next();
  };
};

/**
 * Log Socket Events Middleware
 */
const logSocketEvents = (socket, next) => {
  // Log connection
  console.log(`🔌 Socket connection attempt from: ${socket.handshake.address}`);

  // Log all events
  const originalOn = socket.on;
  socket.on = function(event, listener) {
    return originalOn.call(this, event, async (...args) => {
      console.log(`📡 Socket event: ${event} from user: ${socket.user?.name || 'anonymous'}`);
      
      // Add timestamp to args if it's an object
      if (args[0] && typeof args[0] === 'object') {
        args[0]._serverTimestamp = new Date();
      }
      
      return listener.apply(this, args);
    });
  };

  next();
};

/**
 * CORS Check for Socket
 */
const socketCorsCheck = (socket, next) => {
  const origin = socket.handshake.headers.origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

  if (!origin || allowedOrigins.includes(origin)) {
    return next();
  }

  console.warn(`⚠️ CORS blocked for origin: ${origin}`);
  next(new Error('Origin not allowed'));
};

// ===========================================
// EXPORT MIDDLEWARE
// ===========================================
module.exports = {
  socketAuth,
  optionalSocketAuth,
  adminOnlySocket,
  projectAccessSocket,
  conversationAccessSocket,
  socketRateLimit,
  validateSocketData,
  trackConnection,
  logSocketEvents,
  socketCorsCheck
};