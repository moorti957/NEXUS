const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ===========================================
// PROTECT ROUTE MIDDLEWARE
// ===========================================

/**
 * Middleware to protect routes - verifies JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from Bearer header
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Check for token in query parameters (less secure, use with caution)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (excluding password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found with this token',
          code: 'USER_NOT_FOUND'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Check if user is blocked
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: user.blockedReason || 'Your account has been blocked. Please contact support.',
          code: 'ACCOUNT_BLOCKED'
        });
      }

      // Check if password was changed after token was issued
      if (user.passwordChangedAt) {
        const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
          return res.status(401).json({
            success: false,
            message: 'Password was changed recently. Please login again.',
            code: 'PASSWORD_CHANGED'
          });
        }
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      code: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// ADMIN ONLY MIDDLEWARE
// ===========================================

/**
 * Middleware to restrict access to admin users only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const adminOnly = (req, res, next) => {
  try {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.',
        code: 'NO_USER'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Admin Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization',
      code: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// MODERATOR ONLY MIDDLEWARE
// ===========================================

/**
 * Middleware to restrict access to moderator users only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const moderatorOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login.',
        code: 'NO_USER'
      });
    }

    // Allow both admin and moderator
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Moderator privileges required.',
        code: 'MODERATOR_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Moderator Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization',
      code: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// OPTIONAL AUTH MIDDLEWARE
// ===========================================

/**
 * Middleware that tries to authenticate but doesn't fail if no token
 * Useful for routes that can work with or without authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in various places
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, just continue without user
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isActive && !user.isBlocked) {
        req.user = user;
      }

      next();
    } catch (error) {
      // Token invalid, but we don't block the request
      next();
    }
  } catch (error) {
    console.error('Optional Auth Error:', error);
    next();
  }
};

// ===========================================
// OWNER OR ADMIN MIDDLEWARE
// ===========================================

/**
 * Middleware to check if user is owner of resource or admin
 * @param {Function} getResourceUserId - Function to extract user ID from resource
 * @returns {Function} Middleware function
 */
const ownerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized. Please login.',
          code: 'NO_USER'
        });
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource user ID
      const resourceUserId = await getResourceUserId(req);

      // Check if user owns the resource
      if (req.user._id.toString() !== resourceUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.',
          code: 'NOT_OWNER'
        });
      }

      next();
    } catch (error) {
      console.error('Owner Or Admin Middleware Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authorization',
        code: 'SERVER_ERROR'
      });
    }
  };
};

// ===========================================
// RATE LIMIT BY USER ROLE
// ===========================================

/**
 * Rate limit middleware based on user role
 * @param {Object} limits - Rate limits for different roles
 * @returns {Function} Rate limiter middleware
 */
const roleBasedRateLimit = (limits) => {
  return (req, res, next) => {
    try {
      const userRole = req.user ? req.user.role : 'public';
      const limit = limits[userRole] || limits.default || 100;

      // Add rate limit info to headers
      res.setHeader('X-RateLimit-Limit', limit);
      
      // You can implement actual rate limiting here using Redis or memory store
      
      next();
    } catch (error) {
      console.error('Rate Limit Middleware Error:', error);
      next();
    }
  };
};

// ===========================================
// TOKEN VALIDATION MIDDLEWARE
// ===========================================

/**
 * Validate token without attaching user
 * Useful for logout endpoints
 */
const validateToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.tokenData = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Token Validation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during token validation',
      code: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// PERMISSION CHECK MIDDLEWARE
// ===========================================

/**
 * Check if user has specific permissions
 * @param {Array} permissions - Required permissions
 * @returns {Function} Middleware function
 */
const hasPermission = (permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized. Please login.',
          code: 'NO_USER'
        });
      }

      // Define role-based permissions
      const rolePermissions = {
        admin: ['*'], // Admin has all permissions
        moderator: ['read', 'write', 'moderate', 'manage_users'],
        user: ['read', 'write']
      };

      const userPermissions = rolePermissions[req.user.role] || [];

      // Check if user has all required permissions
      const hasAllPermissions = permissions.every(permission => 
        userPermissions.includes('*') || userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      console.error('Permission Check Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check',
        code: 'SERVER_ERROR'
      });
    }
  };
};

// ===========================================
// ACCOUNT STATUS CHECK MIDDLEWARE
// ===========================================

/**
 * Check if user account is in good standing
 */
const checkAccountStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Check if account is active
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if account is blocked
    if (req.user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: req.user.blockedReason || 'Your account has been blocked. Please contact support.',
        code: 'ACCOUNT_BLOCKED'
      });
    }

    next();
  } catch (error) {
    console.error('Account Status Check Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during account status check',
      code: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// API KEY AUTHENTICATION MIDDLEWARE
// ===========================================

/**
 * Authenticate using API key for programmatic access
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required',
        code: 'NO_API_KEY'
      });
    }

    // Find user by API key
    const user = await User.findOne({ apiKey }).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('API Key Auth Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during API key authentication',
      code: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// REFRESH TOKEN VALIDATION
// ===========================================

/**
 * Validate refresh token specifically
 */
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      req.user = user;
      req.refreshTokenData = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  } catch (error) {
    console.error('Refresh Token Validation Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during refresh token validation',
      code: 'SERVER_ERROR'
    });
  }
};

// ===========================================
// REQUEST VALIDATION MIDDLEWARE
// ===========================================

/**
 * Validate request based on user role and resource access
 */
const validateRequest = (options = {}) => {
  return async (req, res, next) => {
    try {
      const { requireAuth = true, allowedRoles = [], requireEmailVerification = false } = options;

      // Check authentication if required
      if (requireAuth) {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }
      }

      // Check role if specified
      if (allowedRoles.length > 0) {
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Required role not met.',
            code: 'ROLE_DENIED'
          });
        }
      }

      // Check email verification if required
      if (requireEmailVerification) {
        if (!req.user.isEmailVerified) {
          return res.status(403).json({
            success: false,
            message: 'Please verify your email first',
            code: 'EMAIL_NOT_VERIFIED'
          });
        }
      }

      next();
    } catch (error) {
      console.error('Request Validation Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during request validation',
        code: 'SERVER_ERROR'
      });
    }
  };
};

// ===========================================
// EXPORT MIDDLEWARE
// ===========================================
module.exports = {
  protect,
  adminOnly,
  moderatorOnly,
  optionalAuth,
  ownerOrAdmin,
  roleBasedRateLimit,
  validateToken,
  hasPermission,
  checkAccountStatus,
  apiKeyAuth,
  validateRefreshToken,
  validateRequest
};