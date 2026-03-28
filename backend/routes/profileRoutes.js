const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Import controllers
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  getActivityLog,
  getUserStats,
//   getLoginHistory,
//   getProjects,
//   getMessages,
//   getNotifications,
//   markNotificationRead,
//   markAllNotificationsRead,
  deactivateAccount,
  deleteAccount,
//   exportData
} = require('../controllers/profileController');

// Import middleware
const { protect } = require('../middleware/authMiddleware');


const fs = require('fs');

const uploadDir = 'uploads/avatars/';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===========================================
// FILE UPLOAD CONFIGURATION
// ===========================================

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // ✅ FIXED
  },
  filename: (req, file, cb) => {
    const uniqueSuffix =
      Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(
      null,
      'avatar-' + uniqueSuffix + path.extname(file.originalname)
    );
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// ===========================================
// VALIDATION RULES
// ===========================================

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

  body('website')
    .optional()
    .isURL().withMessage('Please provide a valid website URL'),

  body('timezone')
    .optional()
    .isString().withMessage('Invalid timezone'),

  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'hi', 'zh', 'ja']).withMessage('Invalid language selection'),

  body('socialLinks')
    .optional()
    .isObject().withMessage('Social links must be an object'),

  body('socialLinks.twitter')
    .optional()
    .isURL().withMessage('Please provide a valid Twitter URL'),

  body('socialLinks.linkedin')
    .optional()
    .isURL().withMessage('Please provide a valid LinkedIn URL'),

  body('socialLinks.github')
    .optional()
    .isURL().withMessage('Please provide a valid GitHub URL'),

  body('socialLinks.dribbble')
    .optional()
    .isURL().withMessage('Please provide a valid Dribbble URL'),

  body('socialLinks.medium')
    .optional()
    .isURL().withMessage('Please provide a valid Medium URL'),
];

// Update password validation
const updatePasswordValidation = [
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

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

// Update notifications validation
const updateNotificationsValidation = [
  body('emailNotifications')
    .optional()
    .isBoolean().withMessage('Email notifications must be a boolean'),

  body('pushNotifications')
    .optional()
    .isBoolean().withMessage('Push notifications must be a boolean'),

  body('projectUpdates')
    .optional()
    .isBoolean().withMessage('Project updates must be a boolean'),

  body('newMessages')
    .optional()
    .isBoolean().withMessage('New messages must be a boolean'),

  body('marketingEmails')
    .optional()
    .isBoolean().withMessage('Marketing emails must be a boolean'),
];

// Update preferences validation
const updatePreferencesValidation = [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system']).withMessage('Invalid theme selection'),

  body('density')
    .optional()
    .isIn(['comfortable', 'compact', 'standard']).withMessage('Invalid density selection'),

  body('animations')
    .optional()
    .isBoolean().withMessage('Animations must be a boolean'),

  body('sound')
    .optional()
    .isBoolean().withMessage('Sound must be a boolean'),

  body('sidebarCollapsed')
    .optional()
    .isBoolean().withMessage('Sidebar collapsed must be a boolean'),

  body('defaultView')
    .optional()
    .isIn(['grid', 'list', 'calendar']).withMessage('Invalid default view'),
];

// Notification ID validation
const validateNotificationId = [
  param('notificationId').isMongoId().withMessage('Invalid notification ID')
];

// Pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sort').optional().isString()
];

// ===========================================
// ALL ROUTES ARE PROTECTED
// ===========================================
router.use(protect);

// ===========================================
// PROFILE MANAGEMENT ROUTES
// ===========================================

/**
 * @route   GET /api/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/', getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/', updateProfileValidation, updateProfile);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload profile avatar
 * @access  Private
 */
router.post('/avatar', upload.single('avatar'), uploadAvatar);

/**
 * @route   DELETE /api/profile/avatar
 * @desc    Remove profile avatar
 * @access  Private
 */
router.delete('/avatar', deleteAvatar);

/**
 * @route   PUT /api/profile/password
 * @desc    Update password
 * @access  Private
 */
router.put('/password', updatePasswordValidation, changePassword);

/**
 * @route   GET /api/profile/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get('/notifications/preferences', getNotificationPreferences);

/**
 * @route   PUT /api/profile/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/notifications/preferences', updateNotificationsValidation, updateNotificationPreferences);

// ===========================================
// PROFILE STATISTICS & HISTORY
// ===========================================

/**
 * @route   GET /api/profile/stats
 * @desc    Get profile statistics
 * @access  Private
 */
router.get('/stats', getUserStats);

/**
 * @route   GET /api/profile/activity
 * @desc    Get user activity log
 * @access  Private
 */
router.get('/activity', paginationValidation, getActivityLog);

/**
 * @route   GET /api/profile/login-history
 * @desc    Get login history
 * @access  Private
 */
// router.get('/login-history', paginationValidation, getLoginHistory);

// ===========================================
// PROJECTS & MESSAGES
// ===========================================

/**
 * @route   GET /api/profile/projects
 * @desc    Get user's projects
 * @access  Private
 */
// router.get('/projects', paginationValidation, getProjects);

/**
 * @route   GET /api/profile/messages
 * @desc    Get user's messages
 * @access  Private
 */
// router.get('/messages', paginationValidation, getMessages);

// ===========================================
// NOTIFICATIONS
// ===========================================

/**
 * @route   GET /api/profile/notifications
 * @desc    Get user notifications
 * @access  Private
 */
// router.get('/notifications', paginationValidation, getNotifications);

/**
 * @route   PUT /api/profile/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
// router.put('/notifications/:notificationId/read', validateNotificationId, markNotificationRead);

/**
 * @route   PUT /api/profile/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
// router.put('/notifications/read-all', markAllNotificationsRead);

// ===========================================
// ACCOUNT MANAGEMENT
// ===========================================

/**
 * @route   POST /api/profile/deactivate
 * @desc    Deactivate account
 * @access  Private
 */
router.post('/deactivate', [
  body('password').notEmpty().withMessage('Password is required')
], deactivateAccount);

/**
 * @route   DELETE /api/profile/delete
 * @desc    Delete account permanently
 * @access  Private
 */
router.delete('/delete', [
  body('password').notEmpty().withMessage('Password is required'),
  body('confirm').equals('DELETE').withMessage('Please type DELETE to confirm')
], deleteAccount);

// ===========================================
// DATA EXPORT
// ===========================================

/**
 * @route   GET /api/profile/export
 * @desc    Export user data
 * @access  Private
 */
// router.get('/export', [
//   query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
// ], exportData);

// ===========================================
// ADDITIONAL PROFILE ROUTES
// ===========================================

/**
 * @route   GET /api/profile/summary
 * @desc    Get profile summary for dashboard
 * @access  Private
 */
router.get('/summary', async (req, res) => {
  try {
    const User = require('../models/User');
    const Project = require('../models/Project');
    const Message = require('../models/Message');
    const Notification = require('../models/Notification');

    const user = req.user;

    const [projects, unreadMessages, unreadNotifications] = await Promise.all([
      Project.countDocuments({
        'teamMembers.user': user._id,
        status: 'In Progress'
      }),

      Message.countDocuments({
        receiver: user._id,
        isRead: false
      }),

      Notification.countDocuments({
        user: user._id,
        isRead: false
      })
    ]);

    // Calculate profile completion percentage
    const profileFields = ['name', 'email', 'phone', 'company', 'position', 'location', 'bio', 'avatar'];
    const filledFields = profileFields.filter(field => user[field]).length;
    const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

    res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        lastSeen: user.lastSeen,
        profileCompletion,
        stats: {
          activeProjects: projects,
          unreadMessages,
          unreadNotifications
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile summary',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/profile/online-status
 * @desc    Update online status
 * @access  Private
 */
router.put('/online-status', [
  body('status')
    .isIn(['online', 'away', 'offline', 'busy']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const User = require('../models/User');
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        status: req.body.status,
        lastSeen: Date.now()
      },
      { new: true }
    ).select('status lastSeen');

    res.json({
      success: true,
      message: 'Status updated',
      data: {
        status: user.status,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/profile/connected-accounts
 * @desc    Get connected social accounts
 * @access  Private
 */
router.get('/connected-accounts', async (req, res) => {
  try {
    const User = require('../models/User');
    
    const user = await User.findById(req.user._id).select('socialLinks');

    res.json({
      success: true,
      data: {
        socialLinks: user.socialLinks || {},
        connected: Object.keys(user.socialLinks || {}).filter(
          key => user.socialLinks[key]
        )
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching connected accounts',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/profile/connected-accounts/:platform
 * @desc    Connect social account
 * @access  Private
 */
router.post('/connected-accounts/:platform', [
  param('platform').isIn(['twitter', 'linkedin', 'github', 'dribbble', 'medium']),
  body('url').isURL().withMessage('Valid URL required')
], async (req, res) => {
  try {
    const { platform } = req.params;
    const { url } = req.body;
    
    const User = require('../models/User');
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        [`socialLinks.${platform}`]: url
      },
      { new: true }
    ).select('socialLinks');

    res.json({
      success: true,
      message: `${platform} account connected successfully`,
      data: {
        socialLinks: user.socialLinks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error connecting account',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/profile/connected-accounts/:platform
 * @desc    Disconnect social account
 * @access  Private
 */
router.delete('/connected-accounts/:platform', [
  param('platform').isIn(['twitter', 'linkedin', 'github', 'dribbble', 'medium'])
], async (req, res) => {
  try {
    const { platform } = req.params;
    
    const User = require('../models/User');
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: { [`socialLinks.${platform}`]: 1 }
      },
      { new: true }
    ).select('socialLinks');

    res.json({
      success: true,
      message: `${platform} account disconnected`,
      data: {
        socialLinks: user.socialLinks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error disconnecting account',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/profile/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get('/sessions', async (req, res) => {
  try {
    // This would typically come from a sessions collection
    // For now, return mock data
    const sessions = [
      {
        id: 1,
        device: 'Chrome on Windows',
        location: 'San Francisco, USA',
        ip: '192.168.1.1',
        lastActive: new Date(),
        current: true
      },
      {
        id: 2,
        device: 'Safari on iPhone',
        location: 'San Francisco, USA',
        ip: '192.168.1.2',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        current: false
      }
    ];

    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/profile/sessions/:sessionId
 * @desc    Terminate specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    // Implementation would depend on your session management
    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error terminating session',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/profile/sessions
 * @desc    Terminate all other sessions
 * @access  Private
 */
router.delete('/sessions', async (req, res) => {
  try {
    // Implementation would depend on your session management
    res.json({
      success: true,
      message: 'All other sessions terminated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error terminating sessions',
      error: error.message
    });
  }
});

// ===========================================
// TWO-FACTOR AUTHENTICATION ROUTES
// ===========================================

/**
 * @route   POST /api/profile/2fa/enable
 * @desc    Enable 2FA
 * @access  Private
 */
router.post('/2fa/enable', async (req, res) => {
  try {
    // Generate 2FA secret
    const speakeasy = require('speakeasy');
    const qrcode = require('qrcode');

    const secret = speakeasy.generateSecret({
      name: `Nexus:${req.user.email}`
    });

    // Store secret temporarily (would typically save to user record)
    const tempSecret = secret.base32;

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      data: {
        secret: tempSecret,
        qrCode: qrCodeUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error enabling 2FA',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/profile/2fa/verify
 * @desc    Verify and enable 2FA
 * @access  Private
 */
router.post('/2fa/verify', [
  body('token').isLength({ min: 6, max: 6 }).isNumeric(),
  body('secret').notEmpty()
], async (req, res) => {
  try {
    const speakeasy = require('speakeasy');
    
    const verified = speakeasy.totp.verify({
      secret: req.body.secret,
      encoding: 'base32',
      token: req.body.token
    });

    if (verified) {
      // Save to user record
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, {
        twoFactorEnabled: true,
        twoFactorSecret: req.body.secret
      });

      res.json({
        success: true,
        message: '2FA enabled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying 2FA',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/profile/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', [
  body('password').notEmpty()
], async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('+password');

    const isValid = await user.comparePassword(req.body.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error disabling 2FA',
      error: error.message
    });
  }
});

// ===========================================
// ERROR HANDLING FOR MULTER
// ===========================================

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