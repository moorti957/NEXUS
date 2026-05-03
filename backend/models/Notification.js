const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // ===========================================
  // NOTIFICATION RECIPIENT
  // ===========================================
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },

  userName: {
    type: String,
    required: true
  },

  userEmail: {
    type: String,
    required: true
  },

  userAvatar: {
    type: String,
    default: ''
  },

  // ===========================================
  // NOTIFICATION TYPE & CATEGORY
  // ===========================================
  type: {
    type: String,
    enum: {
      values: [
        'info',
        'success',
        'warning',
        'error',
        'alert',
        'reminder',
        'update',
        'achievement'
      ],
      message: '{VALUE} is not a valid notification type'
    },
    default: 'info'
  },

  category: {
  type: String,
  enum: {
    values: [
      'project',
      'client',
      'message',
      'payment',
      'team',
      'system',
      'task',
      'deadline',
      'invoice',
      'feedback',
      'profile'   // 👈 यह add करो
    ],
    message: '{VALUE} is not a valid category'
  },
  default: 'system'
},

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // ===========================================
  // NOTIFICATION CONTENT
  // ===========================================
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },

  shortMessage: {
    type: String,
    maxlength: [100, 'Short message cannot exceed 100 characters']
  },

  // ===========================================
  // READ STATUS
  // ===========================================
  isRead: {
    type: Boolean,
    default: false
  },

  readAt: {
    type: Date
  },

  isDelivered: {
    type: Boolean,
    default: false
  },

  deliveredAt: {
    type: Date
  },

  isArchived: {
    type: Boolean,
    default: false
  },

  archivedAt: {
    type: Date
  },

  // ===========================================
  // ACTION BUTTONS / LINKS
  // ===========================================
  actionUrl: {
    type: String
  },

  actionText: {
    type: String,
    default: 'View'
  },

  actionType: {
    type: String,
    enum: ['link', 'modal', 'slideover', 'none'],
    default: 'link'
  },

  actions: [{
    text: String,
    url: String,
    type: {
      type: String,
      enum: ['primary', 'secondary', 'danger', 'success']
    },
    icon: String
  }],

  // ===========================================
  // RELATED ENTITIES
  // ===========================================
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  relatedClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },

  relatedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },

  relatedInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },

  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ===========================================
  // NOTIFICATION ICON & IMAGE
  // ===========================================
  icon: {
    type: String,
    default: function() {
      const icons = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌',
        'alert': '🔔',
        'reminder': '⏰',
        'update': '🔄',
        'achievement': '🏆'
      };
      return icons[this.type] || '📌';
    }
  },

  image: {
    type: String
  },

  emoji: {
    type: String
  },

  // ===========================================
  // NOTIFICATION EXPIRY
  // ===========================================
  expiresAt: {
    type: Date
  },

  isExpired: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // REPEATING NOTIFICATIONS
  // ===========================================
  isRepeating: {
    type: Boolean,
    default: false
  },

  repeatInterval: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly']
  },

  repeatCount: {
    type: Number,
    default: 0
  },

  maxRepeat: {
    type: Number,
    default: 0
  },

  lastSentAt: {
    type: Date
  },

  nextScheduledAt: {
    type: Date
  },

  // ===========================================
  // SCHEDULED NOTIFICATIONS
  // ===========================================
  isScheduled: {
    type: Boolean,
    default: false
  },

  scheduledFor: {
    type: Date
  },

  // ===========================================
  // PUSH NOTIFICATION STATUS
  // ===========================================
  pushSent: {
    type: Boolean,
    default: false
  },

  pushSentAt: {
    type: Date
  },

  pushToken: {
    type: String
  },

  pushResponse: {
    type: mongoose.Schema.Types.Mixed
  },

  // ===========================================
  // EMAIL NOTIFICATION STATUS
  // ===========================================
  emailSent: {
    type: Boolean,
    default: false
  },

  emailSentAt: {
    type: Date
  },

  emailId: {
    type: String
  },

  emailResponse: {
    type: mongoose.Schema.Types.Mixed
  },

  // ===========================================
  // SMS NOTIFICATION STATUS
  // ===========================================
  smsSent: {
    type: Boolean,
    default: false
  },

  smsSentAt: {
    type: Date
  },

  smsId: {
    type: String
  },

  smsResponse: {
    type: mongoose.Schema.Types.Mixed
  },

  // ===========================================
  // IN-APP NOTIFICATION
  // ===========================================
  inAppSent: {
    type: Boolean,
    default: true
  },

  inAppRead: {
    type: Boolean,
    default: false
  },

  inAppReadAt: {
    type: Date
  },

  // ===========================================
  // NOTIFICATION METADATA
  // ===========================================
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  tags: [{
    type: String,
    trim: true
  }],

  source: {
    type: String,
    enum: ['system', 'user', 'automation', 'api', 'cron'],
    default: 'system'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ===========================================
  // NOTIFICATION GROUPING
  // ===========================================
  groupId: {
    type: String
  },

  groupCount: {
    type: Number,
    default: 1
  },

  isGrouped: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // TIMESTAMPS
  // ===========================================
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
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES FOR PERFORMANCE
// ===========================================
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, isArchived: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ relatedProject: 1 });
notificationSchema.index({ relatedClient: 1 });
notificationSchema.index({ createdAt: -1 });

// ===========================================
// VIRTUAL PROPERTIES
// ===========================================

// Get time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Get formatted date
notificationSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Check if notification is urgent
notificationSchema.virtual('isUrgent').get(function() {
  return this.priority === 'critical' || this.priority === 'high';
});

// Check if notification is recent (last 24 hours)
notificationSchema.virtual('isRecent').get(function() {
  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);
  return this.createdAt > dayAgo;
});

// Get notification color based on type
notificationSchema.virtual('color').get(function() {
  const colors = {
    'info': 'blue',
    'success': 'green',
    'warning': 'yellow',
    'error': 'red',
    'alert': 'orange',
    'reminder': 'purple',
    'update': 'indigo',
    'achievement': 'pink'
  };
  return colors[this.type] || 'gray';
});

// Get background gradient
notificationSchema.virtual('gradient').get(function() {
  const gradients = {
    'info': 'from-blue-500 to-blue-600',
    'success': 'from-green-500 to-green-600',
    'warning': 'from-yellow-500 to-yellow-600',
    'error': 'from-red-500 to-red-600',
    'alert': 'from-orange-500 to-orange-600',
    'reminder': 'from-purple-500 to-purple-600',
    'update': 'from-indigo-500 to-indigo-600',
    'achievement': 'from-pink-500 to-pink-600'
  };
  return gradients[this.type] || 'from-gray-500 to-gray-600';
});

// ===========================================
// PRE-SAVE MIDDLEWARE
// ===========================================

// Update timestamps
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-populate user details
  if (this.user && !this.userName) {
    const User = mongoose.model('User');
    User.findById(this.user).then(user => {
      if (user) {
        this.userName = user.name;
        this.userEmail = user.email;
        this.userAvatar = user.avatar;
      }
    });
  }
  
  // Set short message
  if (!this.shortMessage && this.message) {
    this.shortMessage = this.message.length > 100 
      ? this.message.substring(0, 97) + '...' 
      : this.message;
  }
  
  // Check if expired
  if (this.expiresAt && this.expiresAt < Date.now()) {
    this.isExpired = true;
  }
  
  next();
});

// ===========================================
// INSTANCE METHODS
// ===========================================

// Mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = Date.now();
  this.inAppRead = true;
  this.inAppReadAt = Date.now();
  await this.save();
  return this;
};

// Mark as delivered
notificationSchema.methods.markAsDelivered = async function() {
  this.isDelivered = true;
  this.deliveredAt = Date.now();
  await this.save();
  return this;
};

// Archive notification
notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  this.archivedAt = Date.now();
  await this.save();
  return this;
};

// Unarchive notification
notificationSchema.methods.unarchive = async function() {
  this.isArchived = false;
  this.archivedAt = null;
  await this.save();
  return this;
};

// Mark push as sent
notificationSchema.methods.markPushSent = async function(response) {
  this.pushSent = true;
  this.pushSentAt = Date.now();
  this.pushResponse = response;
  await this.save();
  return this;
};

// Mark email as sent
notificationSchema.methods.markEmailSent = async function(emailId, response) {
  this.emailSent = true;
  this.emailSentAt = Date.now();
  this.emailId = emailId;
  this.emailResponse = response;
  await this.save();
  return this;
};

// Mark SMS as sent
notificationSchema.methods.markSmsSent = async function(smsId, response) {
  this.smsSent = true;
  this.smsSentAt = Date.now();
  this.smsId = smsId;
  this.smsResponse = response;
  await this.save();
  return this;
};

// Schedule notification
notificationSchema.methods.schedule = async function(scheduleTime) {
  this.isScheduled = true;
  this.scheduledFor = scheduleTime;
  await this.save();
  return this;
};

// Repeat notification
notificationSchema.methods.repeat = async function() {
  if (this.repeatCount < this.maxRepeat) {
    const Notification = mongoose.model('Notification');
    const newNotification = new Notification({
      user: this.user,
      userName: this.userName,
      userEmail: this.userEmail,
      type: this.type,
      category: this.category,
      priority: this.priority,
      title: this.title,
      message: this.message,
      actionUrl: this.actionUrl,
      actionText: this.actionText,
      relatedProject: this.relatedProject,
      relatedClient: this.relatedClient,
      icon: this.icon,
      isRepeating: true,
      repeatCount: this.repeatCount + 1,
      maxRepeat: this.maxRepeat,
      scheduledFor: this.calculateNextSchedule(),
      groupId: this.groupId,
      isGrouped: this.isGrouped
    });
    
    await newNotification.save();
    this.lastSentAt = Date.now();
    await this.save();
  }
  return this;
};

// Calculate next schedule
notificationSchema.methods.calculateNextSchedule = function() {
  const next = new Date(this.scheduledFor || Date.now());
  
  switch(this.repeatInterval) {
    case 'hourly':
      next.setHours(next.getHours() + 1);
      break;
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  
  return next;
};

// Soft delete
notificationSchema.methods.softDelete = async function() {
  this.deletedAt = Date.now();
  await this.save();
  return this;
};

// ===========================================
// STATIC METHODS
// ===========================================

// Get unread notifications for user
notificationSchema.statics.getUnreadForUser = async function(userId, limit = 50) {
  return this.find({
    user: userId,
    isRead: false,
    isArchived: false,
    deletedAt: null,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  })
  .sort('-createdAt')
  .limit(limit);
};

// Get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    user: userId,
    isRead: false,
    isArchived: false,
    deletedAt: null,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });
};

// Get all notifications for user
notificationSchema.statics.getAllForUser = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    user: userId,
    isArchived: false,
    deletedAt: null
  })
  .sort('-createdAt')
  .skip(skip)
  .limit(limit);
};

// Get archived notifications
notificationSchema.statics.getArchived = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    user: userId,
    isArchived: true,
    deletedAt: null
  })
  .sort('-archivedAt')
  .skip(skip)
  .limit(limit);
};

// Mark all as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true, 
      readAt: Date.now(),
      inAppRead: true,
      inAppReadAt: Date.now()
    }
  );
};

// Delete all read notifications
notificationSchema.statics.deleteAllRead = async function(userId) {
  return this.updateMany(
    { user: userId, isRead: true },
    { deletedAt: Date.now() }
  );
};

// Get notification stats
notificationSchema.statics.getStats = async function(userId) {
  const total = await this.countDocuments({ 
    user: userId, 
    deletedAt: null 
  });
  
  const unread = await this.countDocuments({ 
    user: userId, 
    isRead: false, 
    deletedAt: null 
  });
  
  const archived = await this.countDocuments({ 
    user: userId, 
    isArchived: true, 
    deletedAt: null 
  });
  
  const byType = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), deletedAt: null } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  
  const byCategory = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), deletedAt: null } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);
  
  return {
    total,
    unread,
    archived,
    byType,
    byCategory
  };
};

// Get scheduled notifications
notificationSchema.statics.getScheduled = async function() {
  return this.find({
    isScheduled: true,
    scheduledFor: { $lte: new Date() },
    deletedAt: null
  });
};

// Get expired notifications
notificationSchema.statics.getExpired = async function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    isExpired: false
  });
};

// Mark expired notifications
notificationSchema.statics.markExpired = async function() {
  return this.updateMany(
    { expiresAt: { $lt: new Date() }, isExpired: false },
    { isExpired: true }
  );
};

// Create notification (factory method)
notificationSchema.statics.createNotification = async function(data) {
  // Auto-set icon based on type
  if (!data.icon) {
    const icons = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'alert': '🔔',
      'reminder': '⏰',
      'update': '🔄',
      'achievement': '🏆'
    };
    data.icon = icons[data.type] || '📌';
  }
  
  // Auto-set priority based on type
  if (!data.priority) {
    const priorities = {
      'error': 'critical',
      'alert': 'high',
      'warning': 'medium'
    };
    data.priority = priorities[data.type] || 'medium';
  }
  
  const User = mongoose.model('User');

  const user = await User.findById(data.user);

  if (!user) {
    throw new Error("User not found for notification");
  }

  const notificationData = {
    ...data,
    userName: user.name,
    userEmail: user.email,
    userAvatar: user.avatar
  };

  const notification = await this.create(notificationData);

  

  return notification;
};

// ===========================================
// QUERY MIDDLEWARE
// ===========================================

// Populate references by default
notificationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email avatar'
  }).populate({
    path: 'relatedProject',
    select: 'name status'
  }).populate({
    path: 'relatedClient',
    select: 'name company'
  }).populate({
    path: 'relatedUser',
    select: 'name email'
  });
  
  // Exclude deleted notifications
  this.find({ deletedAt: null });
  
  // Exclude expired unless specifically requested
  if (!this.getQuery().includeExpired) {
    this.find({
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    });
  }
  
  next();
});

// ===========================================
// EXPORT MODEL
// ===========================================
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;