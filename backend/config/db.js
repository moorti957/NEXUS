const mongoose = require('mongoose');

/**
 * MongoDB Connection Configuration
 * Handles connection to MongoDB database with retry logic and event listeners
 */

const connectDB = async () => {
  try {
    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Check if MongoDB URI is provided
    if (!process.env.MONGODB_URI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    // Log successful connection
    console.log('\n');
    console.log('🟢 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦  MongoDB Connected Successfully');
    console.log(`📍  Host: ${conn.connection.host}`);
    console.log(`📛  Database: ${conn.connection.name}`);
    console.log(`🔌  Port: ${conn.connection.port || 27017}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🟢');
    console.log('\n');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('🟡 MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🟢 MongoDB reconnected successfully');
    });

    mongoose.connection.on('connected', () => {
      console.log('🟢 MongoDB connected');
    });

    return conn;

  } catch (error) {
    console.error('\n');
    console.error('🔴 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ MongoDB Connection Failed');
    console.error(`📋 Error: ${error.message}`);
    
    // Log specific error types
    if (error.name === 'MongoNetworkError') {
      console.error('🌐 Network Error: Please check if MongoDB is running');
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('🎯 Server Selection Error: Could not connect to MongoDB server');
    } else if (error.code === 18) {
      console.error('🔑 Authentication Failed: Check username and password');
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🔴');
    console.error('\n');

    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Gracefully close MongoDB connection
 * Should be called when application shuts down
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🟡 MongoDB connection closed gracefully');
  } catch (error) {
  console.error('❌ MongoDB Connection Failed:', error.message);

  // 🔥 DON'T EXIT
  // process.exit(1);

  // ✅ RETRY CONNECTION
  setTimeout(connectDB, 5000);
}
};

/**
 * Check MongoDB connection status
 * @returns {Object} Connection status information
 */
const getDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const state = mongoose.connection.readyState;
  
  return {
    status: states[state] || 'unknown',
    readyState: state,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    models: Object.keys(mongoose.models),
    collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections) : [],
  };
};

/**
 * Test database connection
 * Useful for health checks
 */
const testConnection = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Execute a simple ping command
      await mongoose.connection.db.admin().ping();
      return { success: true, message: 'Database connection is healthy' };
    } else {
      return { success: false, message: 'Database is not connected' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Drop database (CAUTION: Use only in development)
 * This will delete all data
 */
const dropDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot drop database in production mode');
  }

  try {
    await mongoose.connection.dropDatabase();
    console.log('🗑️  Database dropped successfully');
    return { success: true, message: 'Database dropped' };
  } catch (error) {
    console.error('🔴 Error dropping database:', error);
    throw error;
  }
};

// Export all functions
module.exports = {
  connectDB,
  closeDB,
  getDBStatus,
  testConnection,
  dropDatabase,
};

// Optional: Handle application termination
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});