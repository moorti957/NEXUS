const User = require('../models/User');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

// ===========================================
// PROFILE MANAGEMENT
// ===========================================

/**
 * @desc    Get current user profile
 * @route   GET /api/profile
 * @access  Private
 */


const getProfile = async (req, res) => {
  try {

    console.log("🔥 USER:", req.user);

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const user = await User.findById(req.user._id)
  .select('-password -resetPasswordToken -resetPasswordExpire -loginAttempts -lockUntil')
  .populate('assignedProjects', 'name status deadline progress');

if (!user) {
  return res.status(404).json({
    success: false,
    message: "User not found"
  });
}

// ✅ SAFE VARIABLES
let projectsCompleted = 0;
let activeProjects = 0;
let totalClients = 0;
let unreadNotifications = 0;
let recentActivity = [];

try {
  projectsCompleted = await Project.countDocuments({
    'teamMembers.user': user._id,
    status: 'Completed'
  });
} catch (e) {
  console.log("projectsCompleted error:", e.message);
}

try {
  activeProjects = await Project.countDocuments({
    'teamMembers.user': user._id,
    status: { $in: ['In Progress', 'Planning'] }
  });
} catch (e) {
  console.log("activeProjects error:", e.message);
}

try {
  totalClients = await Client.countDocuments({
    projects: { 
  $in: Array.isArray(user.assignedProjects) 
    ? user.assignedProjects 
    : [] 
}
  });
} catch (e) {
  console.log("Client error:", e.message);
}

try {
  unreadNotifications = await Notification.countDocuments({
    user: user._id,
    isRead: false
  });
} catch (e) {
  console.log("Notification error:", e.message);
}

try {
  recentActivity = await Notification.find({
    user: user._id
  }).limit(10);
} catch (e) {
  console.log("Activity error:", e.message);
}

// ✅ FINAL RESPONSE
res.json({
  success: true,
  data: {
    profile: user,
    stats: {
      projectsCompleted,
      activeProjects,
      totalClients,
      unreadNotifications,
      profileCompletion: user.profileCompletion,
      memberSince: user.createdAt
    },
    recentActivity
  }
});
} catch (error) {
  console.error("🔥 FINAL ERROR:", error);
  res.status(500).json({
    success: false,
    message: error.message
  });
}
};
/**
 * @desc    Update profile
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const {
      name,
      email,
      phone,
      company,
      position,
      location,
      bio,
      socialLinks,
      notificationPreferences
    } = req.body;

    // Check if email is being changed and already exists
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        email,
        phone,
        company,
        position,
        location,
        bio,
        socialLinks,
        notificationPreferences,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire');

    // Create notification for profile update
    await Notification.createNotification({
      user: user._id,
      type: 'success',
      category: 'profile',
      title: 'Profile Updated',
      message: 'Your profile has been successfully updated',
      priority: 'low'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// AVATAR MANAGEMENT
// ===========================================

/**
 * @desc    Upload avatar
 * @route   POST /api/profile/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed (JPEG, PNG, GIF, WEBP)'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File size cannot exceed 5MB'
      });
    }

    // Generate avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Delete old avatar if exists and not default
    if (req.user.avatar && !req.user.avatar.includes('ui-avatars.com')) {
      const oldAvatarPath = path.join(__dirname, '..', 'public', req.user.avatar);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        avatar: avatarUrl,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: user.avatar,
        user
      }
    });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    
    // Delete uploaded file if error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server error while uploading avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete avatar
 * @route   DELETE /api/profile/avatar
 * @access  Private
 */
const deleteAvatar = async (req, res) => {
  try {
    // Delete avatar file if not default
    if (req.user.avatar && !req.user.avatar.includes('ui-avatars.com')) {
      const avatarPath = path.join(__dirname, '..', 'public', req.user.avatar);
      try {
        await fs.unlink(avatarPath);
      } catch (err) {
        console.error('Error deleting avatar:', err);
      }
    }

    // Reset to default avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name)}&background=6366f1&color=fff&size=200`,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
      data: { avatar: user.avatar }
    });
  } catch (error) {
    console.error('Delete Avatar Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// PASSWORD MANAGEMENT
// ===========================================

/**
 * @desc    Change password
 * @route   PUT /api/profile/password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as old
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    // Create notification
    await Notification.createNotification({
      user: user._id,
      type: 'success',
      category: 'security',
      title: 'Password Changed',
      message: 'Your password has been successfully changed',
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// NOTIFICATION PREFERENCES
// ===========================================

/**
 * @desc    Get notification preferences
 * @route   GET /api/profile/notifications
 * @access  Private
 */
const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('notificationPreferences');

    res.json({
      success: true,
      data: {
        preferences: user.notificationPreferences || {
          emailNotifications: true,
          pushNotifications: true,
          projectUpdates: true,
          newMessages: true,
          marketingEmails: false
        }
      }
    });
  } catch (error) {
    console.error('Get Notification Preferences Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update notification preferences
 * @route   PUT /api/profile/notifications
 * @access  Private
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      projectUpdates,
      newMessages,
      marketingEmails
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        notificationPreferences: {
          emailNotifications,
          pushNotifications,
          projectUpdates,
          newMessages,
          marketingEmails
        },
        updatedAt: Date.now()
      },
      { new: true }
    ).select('notificationPreferences');

    res.json({
      success: true,
      message: 'Notification preferences updated',
      data: { preferences: user.notificationPreferences }
    });
  } catch (error) {
    console.error('Update Notification Preferences Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// ACTIVITY & STATISTICS
// ===========================================

/**
 * @desc    Get user activity log
 * @route   GET /api/profile/activity
 * @access  Private
 */
const getActivityLog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const activities = await Notification.find({
      user: req.user._id,
      category: { $ne: 'system' }
    })
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await Notification.countDocuments({
      user: req.user._id,
      category: { $ne: 'system' }
    });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Activity Log Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user statistics
 * @route   GET /api/profile/stats
 * @access  Private
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      projectStats,
      taskStats,
      clientStats,
      activityStats
    ] = await Promise.all([
      // Project statistics
      Project.aggregate([
        { $match: { 'teamMembers.user': userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
            },
            totalBudget: { $sum: '$budget' }
          }
        }
      ]),

      // Task statistics
      Project.aggregate([
        { $match: { 'teamMembers.user': userId } },
        { $unwind: '$tasks' },
        { $match: { 'tasks.assignedTo': userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$tasks.status', 'Done'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $ne: ['$tasks.status', 'Done'] }, 1, 0] }
            }
          }
        }
      ]),

      // Client statistics
      Client.aggregate([
        { $match: { assignedTo: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
            }
          }
        }
      ]),

      // Activity statistics (last 30 days)
      Notification.aggregate([
        {
          $match: {
            user: userId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        projects: projectStats[0] || {
          total: 0,
          completed: 0,
          inProgress: 0,
          totalBudget: 0
        },
        tasks: taskStats[0] || {
          total: 0,
          completed: 0,
          pending: 0
        },
        clients: clientStats[0] || {
          total: 0,
          active: 0
        },
        activity: activityStats
      }
    });
  } catch (error) {
    console.error('Get User Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// SESSION MANAGEMENT
// ===========================================

/**
 * @desc    Get active sessions
 * @route   GET /api/profile/sessions
 * @access  Private
 */
const getActiveSessions = async (req, res) => {
  try {
    // This would typically come from a sessions collection
    // For now, return mock data
    const sessions = [
      {
        id: '1',
        device: 'Chrome on Windows',
        location: 'San Francisco, US',
        ip: '192.168.1.1',
        lastActive: new Date(),
        isCurrent: true
      },
      {
        id: '2',
        device: 'Safari on iPhone',
        location: 'San Francisco, US',
        ip: '192.168.1.2',
        lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isCurrent: false
      }
    ];

    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    console.error('Get Active Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Revoke session
 * @route   DELETE /api/profile/sessions/:sessionId
 * @access  Private
 */
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Don't allow revoking current session
    if (sessionId === '1') {
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke current session'
      });
    }

    // Here you would actually revoke the session from your session store

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while revoking session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Revoke all other sessions
 * @route   DELETE /api/profile/sessions
 * @access  Private
 */
const revokeAllOtherSessions = async (req, res) => {
  try {
    // Here you would revoke all sessions except current
    // For now, just return success

    res.json({
      success: true,
      message: 'All other sessions revoked successfully'
    });
  } catch (error) {
    console.error('Revoke All Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while revoking sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// ACCOUNT MANAGEMENT
// ===========================================

/**
 * @desc    Deactivate account
 * @route   POST /api/profile/deactivate
 * @access  Private
 */
const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Deactivate account
    user.isActive = false;
    user.status = 'offline';
    user.deactivatedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete account (permanent)
 * @route   DELETE /api/profile
 * @access  Private
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Delete avatar file if exists and not default
    if (user.avatar && !user.avatar.includes('ui-avatars.com')) {
      const avatarPath = path.join(__dirname, '..', 'public', user.avatar);
      try {
        await fs.unlink(avatarPath);
      } catch (err) {
        console.error('Error deleting avatar:', err);
      }
    }

    // Permanently delete user
    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted permanently'
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// EXPORT CONTROLLERS
// ===========================================
module.exports = {
  // Profile management
  getProfile,
  updateProfile,
  
  // Avatar management
  deleteAvatar,
    uploadAvatar,
  
  // Password management
  changePassword,
  
  // Notification preferences
  getNotificationPreferences,
  updateNotificationPreferences,
  
  // Activity & statistics
  getActivityLog,
  getUserStats,
  
  // Session management
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  
  // Account management
  deactivateAccount,
  deleteAccount
};