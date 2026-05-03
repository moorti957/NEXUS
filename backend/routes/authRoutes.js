const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

// Import controllers
const {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateDetails,
  updateStatus,
  uploadAvatar,
  deactivateAccount,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/authController');

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ===========================================
// FILE UPLOAD CONFIGURATION
// ===========================================

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// ===========================================
// RATE LIMITING
// ===========================================

// Strict rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Even stricter limiter for login/register
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===========================================
// VALIDATION RULES
// ===========================================

// Registration validation
const registerValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes')
    .trim()
    .escape(),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom(async (email) => {
      // Check if email domain is valid
      const blockedDomains = ['tempmail.com', 'throwaway.com', 'mailinator.com'];
      const domain = email.split('@')[1];
      if (blockedDomains.includes(domain)) {
        throw new Error('Please use a permanent email address');
      }
      return true;
    }),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .isLength({ max: 100 }).withMessage('Password cannot exceed 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('role')
    .optional()
    .isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),

  body('phone')
    .optional()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid phone number'),
];

// Login validation
const loginValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  body('rememberMe')
    .optional()
    .isBoolean().withMessage('Remember me must be a boolean'),
];

// Forgot password validation
const forgotPasswordValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

// Reset password validation
const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token is required')
    .isString().withMessage('Token must be a string'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

// Change password validation
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password cannot be the same as current password');
      }
      return true;
    }),
];

// Update profile validation
const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes')
    .trim()
    .escape(),

  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid phone number'),

  body('company')
    .optional()
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters')
    .trim()
    .escape(),

  body('position')
    .optional()
    .isLength({ max: 100 }).withMessage('Position cannot exceed 100 characters')
    .trim()
    .escape(),

  body('location')
    .optional()
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters')
    .trim()
    .escape(),

  body('bio')
    .optional()
    .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters')
    .trim()
    .escape(),

  body('socialLinks.twitter')
    .optional()
    .isURL().withMessage('Please provide a valid Twitter URL'),

  body('socialLinks.linkedin')
    .optional()
    .isURL().withMessage('Please provide a valid LinkedIn URL'),

  body('socialLinks.github')
    .optional()
    .isURL().withMessage('Please provide a valid GitHub URL'),

  body('notificationPreferences')
    .optional()
    .isObject().withMessage('Notification preferences must be an object'),
];

// Update status validation
const updateStatusValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['online', 'away', 'offline', 'busy']).withMessage('Invalid status'),
];

// Refresh token validation
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isString().withMessage('Refresh token must be a string'),
];

// Deactivate account validation
const deactivateValidation = [
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Admin update user validation
const adminUpdateUserValidation = [
  body('role')
    .optional()
    .isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),

  body('isBlocked')
    .optional()
    .isBoolean().withMessage('isBlocked must be a boolean'),

  body('blockedReason')
    .optional()
    .isLength({ max: 200 }).withMessage('Blocked reason cannot exceed 200 characters')
    .trim()
    .escape(),
];

// ===========================================
// PUBLIC ROUTES (No Authentication Required)
// ===========================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  registerValidation,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginLimiter,
  loginValidation,
  login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  refreshTokenValidation,
  refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  forgotPasswordValidation,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  resetPasswordValidation,
  resetPassword
);

// ===========================================
// PROTECTED ROUTES (Authentication Required)
// ===========================================

// Apply protect middleware to all routes below
router.use(protect);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (logged in)
 * @access  Private
 */
router.post(
  '/change-password',
  changePasswordValidation,
  changePassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', getMe);

/**
 * @route   PUT /api/auth/updatedetails
 * @desc    Update user details
 * @access  Private
 */
router.put(
  '/updatedetails',
  updateProfileValidation,
  updateDetails
);

/**
 * @route   PUT /api/auth/status
 * @desc    Update user online/away status
 * @access  Private
 */
router.put(
  '/status',
  updateStatusValidation,
  updateStatus
);

/**
 * @route   POST /api/auth/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  '/avatar',
  upload.single('avatar'),
  uploadAvatar
);

/**
 * @route   DELETE /api/auth/deactivate
 * @desc    Deactivate own account
 * @access  Private
 */
router.delete(
  '/deactivate',
  deactivateValidation,
  deactivateAccount
);

// ===========================================
// ADMIN ROUTES (Admin Only)
// ===========================================

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get(
  '/users',
  adminOnly,
  getAllUsers
);

/**
 * @route   GET /api/auth/users/:id
 * @desc    Get user by ID (admin only)
 * @access  Private/Admin
 */
router.get(
  '/users/:id',
  adminOnly,
  getUserById
);

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Update user (admin only)
 * @access  Private/Admin
 */
router.put(
  '/users/:id',
  adminOnly,
  adminUpdateUserValidation,
  updateUser
);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete user (admin only)
 * @access  Private/Admin
 */
router.delete(
  '/users/:id',
  adminOnly,
  deleteUser
);

// ===========================================
// ERROR HANDLING FOR MULTER
// ===========================================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next(error);
});

// ===========================================
// EXPORT ROUTER
// ===========================================
module.exports = router;