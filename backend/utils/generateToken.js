const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ===========================================
// JWT TOKEN GENERATION
// ===========================================

/**
 * Generate JWT access token
 * @param {string} id - User ID
 * @param {Object} options - Additional options
 * @returns {string} JWT token
 */
const generateToken = (id, options = {}) => {
  const payload = {
    id,
    ...options
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate refresh token
 * @param {string} id - User ID
 * @param {Object} options - Additional options
 * @returns {string} Refresh token
 */
const generateRefreshToken = (id, options = {}) => {
  const payload = {
    id,
    ...options
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: options.expiresIn || process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

/**
 * Generate email verification token
 * @param {string} id - User ID
 * @returns {string} Verification token
 */
const generateVerificationToken = (id) => {
  const payload = {
    id,
    type: 'email_verification'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h', // 24 hours
  });
};

/**
 * Generate password reset token
 * @param {string} id - User ID
 * @returns {string} Password reset token
 */
const generatePasswordResetToken = (id) => {
  const payload = {
    id,
    type: 'password_reset'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h', // 1 hour
  });
};

/**
 * Generate API key for programmatic access
 * @param {Object} options - API key options
 * @returns {Object} API key object
 */
const generateApiKey = (options = {}) => {
  const {
    name = 'Default API Key',
    permissions = ['read'],
    expiresIn = null // null means never expires
  } = options;

  // Generate a secure random API key
  const key = crypto.randomBytes(32).toString('hex');
  
  // Create a prefix for identification
  const prefix = 'nexus_';
  
  const apiKey = {
    id: crypto.randomBytes(16).toString('hex'),
    name,
    key: prefix + key,
    prefix,
    permissions,
    createdAt: new Date(),
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : null,
    lastUsed: null
  };

  // Create a hash of the key for storage
  const keyHash = crypto
    .createHash('sha256')
    .update(apiKey.key)
    .digest('hex');

  return {
    ...apiKey,
    keyHash,
    key: apiKey.key // Return full key only once
  };
};

// ===========================================
// TOKEN VERIFICATION
// ===========================================

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - Secret key (optional)
 * @returns {Object} Decoded token
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      valid: true,
      decoded,
      expired: false
    };
  } catch (error) {
    return {
      valid: false,
      decoded: null,
      expired: error.name === 'TokenExpiredError',
      error: error.message
    };
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Verification result
 */
const verifyRefreshToken = (token) => {
  return verifyToken(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
};

/**
 * Verify API key
 * @param {string} apiKey - API key to verify
 * @param {Object} storedKey - Stored API key object
 * @returns {boolean} Is valid
 */
const verifyApiKey = (apiKey, storedKey) => {
  if (!apiKey || !storedKey) return false;

  // Check if expired
  if (storedKey.expiresAt && new Date(storedKey.expiresAt) < new Date()) {
    return false;
  }

  // Hash the provided key and compare
  const hash = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  return hash === storedKey.keyHash;
};

// ===========================================
// TOKEN DECODING
// ===========================================

/**
 * Decode token without verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (token) => {
  const decoded = decodeToken(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} Is expired
 */
const isTokenExpired = (token) => {
  const expiration = getTokenExpiration(token);
  return expiration ? expiration < new Date() : true;
};

// ===========================================
// TOKEN REFRESH
// ===========================================

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New tokens
 */
const refreshTokens = (refreshToken) => {
  const verification = verifyRefreshToken(refreshToken);

  if (!verification.valid) {
    throw new Error(verification.expired ? 'Refresh token expired' : 'Invalid refresh token');
  }

  const { id } = verification.decoded;

  // Generate new tokens
  const newAccessToken = generateToken(id);
  const newRefreshToken = generateRefreshToken(id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

// ===========================================
// TOKEN BLACKLIST (if using Redis)
// ===========================================

/**
 * Blacklist token (requires Redis)
 * @param {string} token - Token to blacklist
 * @param {number} expiresIn - Expiry in seconds
 */
const blacklistToken = async (token, expiresIn) => {
  // This would typically use Redis
  // Example with Redis:
  // await redis.setex(`blacklist:${token}`, expiresIn, 'true');
  
  console.log(`Token blacklisted: ${token.substring(0, 20)}...`);
  return true;
};

/**
 * Check if token is blacklisted
 * @param {string} token - Token to check
 * @returns {boolean} Is blacklisted
 */
const isTokenBlacklisted = async (token) => {
  // This would typically use Redis
  // Example with Redis:
  // return await redis.exists(`blacklist:${token}`);
  
  return false;
};

// ===========================================
// COOKIE OPTIONS
// ===========================================

/**
 * Get cookie options for token
 * @param {boolean} rememberMe - Remember me option
 * @returns {Object} Cookie options
 */
const getCookieOptions = (rememberMe = false) => {
  const maxAge = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000;  // 7 days

  return {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  };
};

/**
 * Set token cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 * @param {boolean} rememberMe - Remember me option
 */
const setTokenCookie = (res, token, rememberMe = false) => {
  const options = getCookieOptions(rememberMe);
  res.cookie('token', token, options);
};

/**
 * Clear token cookie
 * @param {Object} res - Express response object
 */
const clearTokenCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
};

// ===========================================
// TOKEN PAYLOAD HELPERS
// ===========================================

/**
 * Create custom token payload
 * @param {Object} user - User object
 * @param {Object} extra - Extra data
 * @returns {Object} Payload
 */
const createPayload = (user, extra = {}) => {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
    ...extra
  };
};

/**
 * Generate tokens with custom payload
 * @param {Object} payload - Custom payload
 * @returns {Object} Tokens
 */
const generateCustomTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  const refreshToken = jwt.sign(
    { id: payload.id }, 
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

// ===========================================
// STATISTICS & METADATA
// ===========================================

/**
 * Get token metadata
 * @param {string} token - JWT token
 * @returns {Object} Token metadata
 */
const getTokenMetadata = (token) => {
  try {
    const decoded = decodeToken(token);
    const expiration = getTokenExpiration(token);
    const now = new Date();
    
    return {
      valid: !isTokenExpired(token),
      issuedAt: decoded?.iat ? new Date(decoded.iat * 1000) : null,
      expiresAt: expiration,
      expiresIn: expiration ? Math.round((expiration - now) / 1000) : null,
      expired: expiration ? expiration < now : false,
      payload: decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

// ===========================================
// EXPORT ALL FUNCTIONS
// ===========================================
module.exports = {
  // Generation
  generateToken,
  generateRefreshToken,
  generateVerificationToken,
  generatePasswordResetToken,
  generateApiKey,
  generateCustomTokens,
  
  // Verification
  verifyToken,
  verifyRefreshToken,
  verifyApiKey,
  
  // Decoding
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  getTokenMetadata,
  
  // Refresh
  refreshTokens,
  
  // Blacklist
  blacklistToken,
  isTokenBlacklisted,
  
  // Cookies
  getCookieOptions,
  setTokenCookie,
  clearTokenCookie,
  
  // Payload
  createPayload
};