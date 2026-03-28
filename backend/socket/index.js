const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Import handlers
const authHandler = require('./handlers/authHandler');
const chatHandler = require('./handlers/chatHandler');
const notificationHandler = require('./handlers/notificationHandler');
const projectHandler = require('./handlers/projectHandler');
const presenceHandler = require('./handlers/presenceHandler');

// Store online users
const onlineUsers = new Map();

// GLOBAL IO INSTANCE
let io;

/**
 * Initialize Socket.IO server
 */
const initializeSocket = (server) => {

  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e6
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {

      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.token ||
        socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      };

      next();

    } catch (error) {

      console.error('Socket auth error:', error.message);
      return next(new Error('Invalid token'));

    }
  });

  // Connection
  io.on('connection', (socket) => {

    console.log(`🟢 Socket Connected: ${socket.id}`);

    if (socket.user) {

      const userData = {
        socketId: socket.id,
        userId: socket.user._id,
        name: socket.user.name,
        email: socket.user.email,
        role: socket.user.role,
        avatar: socket.user.avatar,
        connectedAt: new Date(),
        lastActivity: new Date(),
        status: 'online'
      };

      onlineUsers.set(socket.user._id.toString(), userData);

      socket.join(`user:${socket.user._id}`);

    }

    // Initialize handlers
    authHandler(io, socket, onlineUsers);
    chatHandler(io, socket, onlineUsers);
    notificationHandler(io, socket, onlineUsers);
    projectHandler(io, socket, onlineUsers);
    presenceHandler(io, socket, onlineUsers);

    socket.on('disconnect', () => {

      if (socket.user) {

        onlineUsers.delete(socket.user._id.toString());

        io.emit('user:offline', {
          userId: socket.user._id
        });

      }

      console.log(`🔴 Socket Disconnected: ${socket.id}`);

    });

  });

  console.log("🚀 Socket.IO Initialized");

  return io;
};

/**
 * GET IO INSTANCE
 */
const getIO = () => {

  if (!io) {
    throw new Error("Socket.io not initialized!");
  }

  return io;

};

module.exports = {
  initializeSocket,
  getIO
};