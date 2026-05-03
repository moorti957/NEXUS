// ===========================================
// USER MODEL - NEXUS AGENCY BACKEND
// ===========================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

// ===========================================
// USER SCHEMA DEFINITION
// ===========================================
const userSchema = new mongoose.Schema({

 
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        return /^[a-zA-Z\s\-']+$/.test(value);
      },
      message: 'Name can only contain letters, spaces, hyphens and apostrophes'
    }
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [
      {
        validator: validator.isEmail,
        message: 'Please provide a valid email address'
      },
      {
        validator: function(value) {
          // Check for common email domains
          const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
          const domain = value.split('@')[1];
          return true; // Allow all domains for now
        },
        message: 'Please use a valid email provider'
      }
    ]
  },

  

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false, // Don't return password by default in queries
    validate: {
      validator: function(value) {
        // Password strength validation
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },


   assignedProjects: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }
],

teamId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Team'
},

  // Password reset fields
  resetPasswordToken: {
    type: String,
    select: false
  },

  resetPasswordExpire: {
    type: Date,
    select: false
  },

  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationToken: {
    type: String,
    select: false
  },

  emailVerificationExpire: {
    type: Date,
    select: false
  },

  // Profile Information
  avatar: {
    type: String,
    default: function() {
      // Generate avatar URL based on name
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=6366f1&color=fff&size=200`;
    }
  },

  avatarPublicId: {
    type: String,
    default: null
  },

  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true;
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value);
      },
      message: 'Please provide a valid phone number'
    }
  },

  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },

  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot exceed 100 characters']
  },

  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },

  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },

  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true;
        return validator.isURL(value, {
          protocols: ['http', 'https'],
          require_protocol: true
        });
      },
      message: 'Please provide a valid website URL'
    }
  },

  socialLinks: {
    twitter: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    dribbble: { type: String, trim: true },
    medium: { type: String, trim: true }
  },

  // Account Settings
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'moderator'],
      message: '{VALUE} is not a valid role'
    },
    default: 'user'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  isBlocked: {
    type: Boolean,
    default: false
  },

  blockedReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Blocked reason cannot exceed 200 characters']
  },

  // Security
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  lockUntil: {
    type: Date,
    select: false
  },

  lastLogin: {
    type: Date
  },

  lastLoginIP: {
    type: String,
    select: false
  },

  lastLoginUserAgent: {
    type: String,
    select: false
  },

  passwordChangedAt: {
    type: Date,
    select: false
  },

  passwordResetAttempts: {
    type: Number,
    default: 0,
    select: false
  },

  // Preferences
  preferences: {
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'hi'],
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // Projects and Stats
  projectsCount: {
    type: Number,
    default: 0,
    min: 0
  },

  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },

  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },

  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    select: false
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  deletedAt: {
    type: Date,
    select: false
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpire;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpire;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      delete ret.lastLoginIP;
      delete ret.lastLoginUserAgent;
      delete ret.passwordResetAttempts;
      delete ret.metadata;
      delete ret.deletedAt;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// ===========================================
// INDEXES FOR PERFORMANCE
// ===========================================
userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'subscription.plan': 1, 'subscription.status': 1 });

// ===========================================
// VIRTUAL PROPERTIES
// ===========================================

// Full name with initials
userSchema.virtual('initials').get(function() {
  return this.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

// Account age in days
userSchema.virtual('accountAgeDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Is account locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  const fields = [
    'name', 'email', 'phone', 'company', 'position', 
    'location', 'bio', 'website', 'avatar'
  ];
  
  const completed = fields.filter(field => this[field]).length;
  return Math.round((completed / fields.length) * 100);
});

// ===========================================
// PRE-SAVE MIDDLEWARE
// ===========================================

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    // Only hash if password is modified
    if (!this.isModified('password')) {
      return next();
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Update password changed timestamp
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token is created after password change

    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-generate avatar if not provided
userSchema.pre('save', function(next) {
  if (!this.avatar && this.name) {
    this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=6366f1&color=fff&size=200`;
  }
  next();
});

// ===========================================
// INSTANCE METHODS
// ===========================================

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and save to database
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiration (1 hour from now)
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash token and save to database
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expiration (24 hours from now)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

// Check if password was changed after JWT issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if attempts exceed 5
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 }; // Lock for 1 hour
  }

  return this.updateOne(updates);
};

// ===========================================
// STATIC METHODS
// ===========================================

// Find user by email with password
userSchema.statics.findByEmailWithPassword = async function(email) {
  return this.findOne({ email }).select('+password');
};

// Find users by role
userSchema.statics.findByRole = async function(role, limit = 10, skip = 0) {
  return this.find({ role })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Get active users count
userSchema.statics.getActiveUsersCount = async function() {
  return this.countDocuments({ isActive: true, isBlocked: false });
};

// ===========================================
// QUERY MIDDLEWARE
// ===========================================

// Exclude inactive users by default
userSchema.pre(/^find/, function(next) {
  this.find({ isActive: { $ne: false }, isBlocked: { $ne: true } });
  next();
});

// Exclude deleted users
userSchema.pre(/^find/, function(next) {
  this.where({ deletedAt: null });
  next();
});
// ===========================================
// CREATE AND EXPORT MODEL
// ===========================================
const User = mongoose.model('User', userSchema);

module.exports = User;