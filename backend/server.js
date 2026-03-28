// ===========================================
// NEXUS AGENCY BACKEND - MAIN SERVER FILE
// ===========================================



const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import database connection
const { connectDB } = require('./config/db');
// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const clientRoutes = require('./routes/clientRoutes');
const messageRoutes = require('./routes/messageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const teamRoutes = require('./routes/teamRoutes');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const contactRoutes = require('./routes/contactRoutes');
const contactNotificationRoutes = require('./routes/contactNotificationRoutes');




// ===========================================
// VALIDATE REQUIRED ENVIRONMENT VARIABLES
// ===========================================


const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'FRONTEND_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('\n❌ ERROR: Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('\nPlease check your .env file\n');
  process.exit(1);
}

// ===========================================
// INITIALIZE EXPRESS APP
// ===========================================
const app = express();
const server = http.createServer(app);
const onlineUsers = new Map();

let io;

// ===========================================
// SOCKET.IO SETUP FOR REAL-TIME FEATURES
// ===========================================
io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Store io instance for use in controllers
app.set('io', io);

// Socket.io connection handling
// ===========================================
// SOCKET.IO CONNECTION
// ===========================================

io.on("connection", (socket) => {

  console.log("🔌 Client connected:", socket.id);

  socket.on("join-user", (userId) => {

    socket.userId = userId;

    onlineUsers.set(userId, socket.id);

    console.log("🟢 User online:", userId);

    io.emit("online-users", Array.from(onlineUsers.keys()));

  });


  // ✅ NEW MESSAGE SOCKET
  socket.on("message:send", (message) => {

    const receiverId = message.receiver;

    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {

      io.to(receiverSocketId).emit("newMessage", {
        message
      });

      console.log("📡 Realtime message sent to:", receiverId);

    }

  });

  // ===========================================
// TYPING INDICATOR
// ===========================================

socket.on("typing", ({ to }) => {

  const receiverSocketId = onlineUsers.get(to);

  if (receiverSocketId) {

    io.to(receiverSocketId).emit("userTyping", {
      from: socket.userId
    });

  }

});

socket.on("stopTyping", ({ to }) => {

  const receiverSocketId = onlineUsers.get(to);

  if (receiverSocketId) {

    io.to(receiverSocketId).emit("userStopTyping", {
      from: socket.userId
    });

  }

});


  socket.on("disconnect", () => {

    if (socket.userId) {

      onlineUsers.delete(socket.userId);

      console.log("🔴 User offline:", socket.userId);

      io.emit("online-users", Array.from(onlineUsers.keys()));

    }

    console.log("❌ Socket disconnected:", socket.id);

  });

});

// ===========================================
// CONNECT TO DATABASE
// ===========================================
connectDB();

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:5173"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://your-vercel-app.vercel.app'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
   max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,// Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use('/api', limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());
// Body parser FIRST
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// THEN routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/contact-notifications', contactNotificationRoutes); 

// ===========================================
// GENERAL MIDDLEWARE
// ===========================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDirs = ['uploads', 'uploads/avatars', 'uploads/messages', 'uploads/team', 'uploads/projects'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/users", userRoutes);

app.use("/api/posts", postRoutes);

// ===========================================
// CUSTOM MIDDLEWARE
// ===========================================

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log after response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${duration}ms`);
    }
  });

  next();
});

// ===========================================
// HEALTH CHECK ROUTES
// ===========================================

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Nexus Agency API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// Detailed health check with database status
app.get('/api/health/detailed', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    // Get database stats if connected
    let dbStats = null;
    if (dbState === 1 && mongoose.connection.db) {
      const stats = await mongoose.connection.db.stats();
      dbStats = {
        collections: stats.collections,
        objects: stats.objects,
        avgObjSize: stats.avgObjSize,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
      };
    }

    // System information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      server: {
        status: 'running',
        port: process.env.PORT,
        uptime: process.uptime(),
      },
      database: {
        status: dbStates[dbState] || 'unknown',
        state: dbState,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        stats: dbStats,
      },
      system: systemInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
    });
  }
});

// ===========================================
// API ROUTES
// ===========================================

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/profile', profileRoutes);

// ===========================================
// STATIC FILES
// ===========================================

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}



// ✅ पहले root route
app.get("/", (req, res) => {
  res.send("🚀 Backend is LIVE and running");
});

// ❌ 404 हमेशा सबसे LAST में होना चाहिए
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ===========================================
// ERROR HANDLING MIDDLEWARE
// ===========================================
app.use((err, req, res, next) => {
  console.error('\n❌ Error occurred:');
  console.error(`Time: ${new Date().toISOString()}`);
  console.error(`Path: ${req.method} ${req.originalUrl}`);
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}\n`);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = { message, statusCode: 401 };
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const message = 'File too large. Maximum size is 10MB.';
      error = { message, statusCode: 400 };
    } else {
      const message = err.message;
      error = { message, statusCode: 400 };
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ===========================================
// START SERVER
// ===========================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n');
  console.log('🚀 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦  NEXUS AGENCY BACKEND');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔌  Server      : http://localhost:${PORT}`);
  console.log(`📡  API         : http://localhost:${PORT}/api`);
  console.log(`💊  Health      : http://localhost:${PORT}/api/health`);
  console.log(`📊  DB Status   : ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}`);
  console.log(`🌍  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁  Uploads     : ${path.join(__dirname, 'uploads')}`);
  console.log(`🔌  Socket.io   : Running on same port`);
  console.log(`⏰  Started at  : ${new Date().toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n');
});

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================
const gracefulShutdown = async () => {
  console.log('\n🟡 Received shutdown signal. Closing connections...');

  // Close Socket.io connections
  io.close(() => {
    console.log('🔌 Socket.io closed.');
  });

  // Close server
  server.close(() => {
    console.log('🔌 HTTP server closed.');
  });

  // Close database connection
  try {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed.');
  } catch (err) {
    console.error('❌ Error closing MongoDB connection:', err);
  }

  // Exit process
  setTimeout(() => {
    console.log('👋 Exiting process...');
    process.exit(0);
  }, 1000);
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:');
  console.error(err);
  console.error('\n💥 Shutting down...');
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\n❌ UNHANDLED REJECTION:');
  console.error(err);
  console.error('\n💥 Shutting down...');
  gracefulShutdown();
});

// ===========================================
// EXPORT FOR TESTING
// ===========================================
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { app, server, getIO };