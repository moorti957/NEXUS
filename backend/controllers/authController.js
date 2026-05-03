const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Generate JWT Token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate Refresh Token
 * @param {string} id - User ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  });
};

/**
 * Set token cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 */
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('token', token, cookieOptions);
};

/**
 * Create and send token response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove sensitive data
  user.password = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // Set cookie
  setTokenCookie(res, token);

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user,
      token,
      refreshToken,
    },
  });
};

// ===========================================
// AUTHENTICATION CONTROLLERS
// ===========================================

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        })),
      });
    }

   const { name, email, password, role, accessKey } = req.body;

   let userRole = 'user';

   console.log("ACCESS KEY FROM FRONTEND:", accessKey);
console.log("ACCESS KEY FROM ENV:", process.env.ACCESS_KEY);

if (accessKey && accessKey === process.env.ACCESS_KEY) {
  userRole = 'admin';
}

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create new user
    const user = await User.create({
  name,
  email,
  password,
  role: userRole,
  status: 'offline',
  lastSeen: Date.now(),
});

    // Update last login
    user.lastLogin = Date.now();
    user.lastLoginIP = req.ip || req.connection.remoteAddress;
    user.lastLoginUserAgent = req.get('User-Agent');
    await user.save({ validateBeforeSave: false });

    // Send response with token
    sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    console.error('Register Error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value entered',
      });
    }

    // Handle validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        })),
      });
    }

   const { email, password, rememberMe, accessKey } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: user.blockedReason || 'Your account has been blocked. Please contact support.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.',
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is locked. Please try again after ${lockTimeLeft} minutes.`,
      });
    }

    // Verify password
// verify password
const isPasswordMatch = await user.comparePassword(password);

if (!isPasswordMatch) {
  await user.incrementLoginAttempts();

  return res.status(401).json({
    success: false,
    message: 'Invalid credentials',
  });
}

// access key validation
if (user.role === 'admin') {
  if (!accessKey || accessKey !== process.env.ACCESS_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Access key required for admin login'
    });
  }
}
    
 
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    // Update last login info
    user.lastLogin = Date.now();
    user.lastLoginIP = req.ip || req.connection.remoteAddress;
    user.lastLoginUserAgent = req.get('User-Agent');
    
    // Update online status
    user.status = 'online';
    user.lastSeen = Date.now();
    
    await user.save({ validateBeforeSave: false });

    // Send response with token
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Update user status
    await User.findByIdAndUpdate(req.user._id, {
      status: 'offline',
      lastSeen: Date.now()
    });

    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
    });
  }
};

/**
 * @desc    Refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide refresh token',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Generate new tokens
    sendTokenResponse(user, 200, res, 'Token refreshed');
  } catch (error) {
    console.error('Refresh Token Error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during token refresh',
    });
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email',
      });
    }

    // Find user
    const user = await User.findOne({ email });
    
    // For security, always return success even if user doesn't exist
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a reset link',
      });
    }

    // Check for too many reset attempts
    if (user.passwordResetAttempts && user.passwordResetAttempts >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many password reset attempts. Please try again after 1 hour.',
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    
    // Increment reset attempts
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // TODO: Send email with resetUrl
    // await sendResetPasswordEmail(user.email, resetToken, user.name);

    // For development, return token in response
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        message: 'Password reset link generated',
        data: { resetToken, resetUrl }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and new password',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Hash the token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Check if new password is same as old
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as old password',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordResetAttempts = 0;
    user.passwordChangedAt = Date.now();

    await user.save();

    // Send response with new token (auto-login)
    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Change password (when logged in)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Check if new password is same as old
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password',
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
    });
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: { user },
    });

  } catch (error) {
    console.error('Get Me Error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
    });
  }
};

/**
 * @desc    Update user details
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
const updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      company: req.body.company,
      position: req.body.position,
      location: req.body.location,
      bio: req.body.bio,
      avatar: req.body.avatar,
      socialLinks: req.body.socialLinks,
      notificationPreferences: req.body.notificationPreferences,
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Check if email is being updated
    if (fieldsToUpdate.email && fieldsToUpdate.email !== req.user.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email: fieldsToUpdate.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update Details Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
    });
  }
};

/**
 * @desc    Update user status (online/away/offline)
 * @route   PUT /api/auth/status
 * @access  Private
 */
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['online', 'away', 'offline', 'busy'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        status,
        lastSeen: Date.now()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: { status: user.status },
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
    });
  }
};

/**
 * @desc    Upload avatar
 * @route   POST /api/auth/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    // TODO: Upload to cloud storage (Cloudinary, AWS S3, etc.)
    const avatarUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatar: user.avatar },
    });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading avatar',
    });
  }
};

/**
 * @desc    Deactivate account
 * @route   DELETE /api/auth/deactivate
 * @access  Private
 */
const deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
      });
    }

    // Deactivate account
    user.isActive = false;
    user.status = 'offline';
    user.deactivatedAt = Date.now();
    await user.save({ validateBeforeSave: false });

    // Clear cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating account',
    });
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
    });
  }
};

/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/auth/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('assignedProjects', 'name status deadline');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
    });
  }
};

/**
 * @desc    Update user (admin only)
 * @route   PUT /api/auth/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res) => {
  try {
    const { role, isActive, isBlocked, blockedReason, ...otherFields } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...otherFields,
        role,
        isActive,
        isBlocked,
        blockedReason,
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
    });
  }
};

/**
 * @desc    Delete user (admin only)
 * @route   DELETE /api/auth/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete
    user.isActive = false;
    user.deletedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
    });
  }
};

// ===========================================
// EXPORT ALL CONTROLLERS
// ===========================================
module.exports = {
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
  deleteUser,
};