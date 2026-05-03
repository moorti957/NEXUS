const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // ===========================================
  // MESSAGE PARTICIPANTS
  // ===========================================
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },

  senderName: {
    type: String,
    required: true
  },

  senderEmail: {
    type: String,
    required: true
  },

  senderAvatar: {
    type: String,
    default: ''
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Receiver is required']
  },

  receiverName: {
    type: String,
    required: true
  },

  receiverEmail: {
    type: String,
    required: true
  },

  receiverAvatar: {
    type: String,
    default: ''
  },

  // ===========================================
  // MESSAGE CONTENT
  // ===========================================
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },

  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },

  // ===========================================
  // MESSAGE TYPE & STATUS
  // ===========================================
  messageType: {
    type: String,
    enum: {
      values: [
        'general',
        'project',
        'invoice',
        'proposal',
        'support',
        'feedback',
        'meeting'
      ],
      message: '{VALUE} is not a valid message type'
    },
    default: 'general'
  },

  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'archived', 'deleted'],
    default: 'sent'
  },

  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // ===========================================
  // READ RECEIPTS
  // ===========================================
  isRead: {
    type: Boolean,
    default: false
  },

  readAt: {
    type: Date
  },

  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isDelivered: {
    type: Boolean,
    default: false
  },

  deliveredAt: {
    type: Date
  },

  // ===========================================
  // THREAD / CONVERSATION
  // ===========================================
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },

  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],

  replyCount: {
    type: Number,
    default: 0
  },

  isReply: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // ATTACHMENTS
  // ===========================================
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['image', 'document', 'pdf', 'spreadsheet', 'other']
    },
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  hasAttachments: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // RELATED ENTITIES
  // ===========================================
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  relatedInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },

  // ===========================================
  // MESSAGE METADATA
  // ===========================================
  isImportant: {
    type: Boolean,
    default: false
  },

  isStarred: {
    type: Boolean,
    default: false
  },

  labels: [{
    type: String,
    trim: true
  }],

  tags: [{
    type: String,
    trim: true
  }],

  // ===========================================
  // QUOTES / FORWARDING
  // ===========================================
  quotedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  isForwarded: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // NOTIFICATIONS
  // ===========================================
  notificationSent: {
    type: Boolean,
    default: false
  },

  emailNotificationSent: {
    type: Boolean,
    default: false
  },

  pushNotificationSent: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // SCHEDULED MESSAGES
  // ===========================================
  isScheduled: {
    type: Boolean,
    default: false
  },

  scheduledFor: {
    type: Date
  },

  sentAt: {
    type: Date
  },

  // ===========================================
  // AUTO-RESPONSE
  // ===========================================
  isAutoResponse: {
    type: Boolean,
    default: false
  },

  autoResponseTemplate: {
    type: String
  },

  // ===========================================
  // REACTIONS
  // ===========================================
  reactions: [{
    emoji: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ===========================================
  // METADATA
  // ===========================================
  ipAddress: {
    type: String
  },

  userAgent: {
    type: String
  },

  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
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
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ relatedProject: 1 });
messageSchema.index({ tags: 1 });
messageSchema.index({ isImportant: 1 });
messageSchema.index({ isStarred: 1 });

// ===========================================
// VIRTUAL PROPERTIES
// ===========================================

// Get message preview
messageSchema.virtual('preview').get(function() {
  return this.content.length > 100 
    ? this.content.substring(0, 100) + '...' 
    : this.content;
});

// Get time ago
messageSchema.virtual('timeAgo').get(function() {
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

// Check if urgent
messageSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' && !this.isRead;
});

// Get attachment count
messageSchema.virtual('attachmentCount').get(function() {
  return this.attachments.length;
});

// Get reply status
messageSchema.virtual('replyStatus').get(function() {
  if (this.replyCount > 0) return `replied`;
  return 'no-reply';
});

// ===========================================
// PRE-SAVE MIDDLEWARE
// ===========================================

// Update timestamps
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-populate sender details
  if (this.sender && !this.senderName) {
    const User = mongoose.model('User');
    User.findById(this.sender).then(user => {
      if (user) {
        this.senderName = user.name;
        this.senderEmail = user.email;
        this.senderAvatar = user.avatar;
      }
    });
  }
  
  // Auto-populate receiver details
  if (this.receiver && !this.receiverName) {
    const Client = mongoose.model('Client');
    Client.findById(this.receiver).then(client => {
      if (client) {
        this.receiverName = client.name;
        this.receiverEmail = client.email;
        this.receiverAvatar = client.avatar;
      }
    });
  }
  
  // Set hasAttachments
  this.hasAttachments = this.attachments && this.attachments.length > 0;
  
  // If scheduled, don't set sentAt yet
  if (!this.isScheduled && !this.sentAt) {
    this.sentAt = Date.now();
  }
  
  next();
});

// Update parent message when reply is added
messageSchema.pre('save', async function(next) {
  if (this.parentMessageId && this.isNew) {
    await mongoose.model('Message').findByIdAndUpdate(
      this.parentMessageId,
      { 
        $inc: { replyCount: 1 },
        $push: { replies: this._id }
      }
    );
  }
  next();
});

// ===========================================
// INSTANCE METHODS
// ===========================================

// Mark message as read
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = Date.now();
    this.readBy = userId;
    this.status = 'read';
    await this.save();
    
    // Update conversation
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(this.conversationId, {
      lastReadAt: Date.now()
    });
  }
  return this;
};

// Mark as delivered
messageSchema.methods.markAsDelivered = async function() {
  if (!this.isDelivered) {
    this.isDelivered = true;
    this.deliveredAt = Date.now();
    this.status = 'delivered';
    await this.save();
  }
  return this;
};

// Add reply
messageSchema.methods.addReply = async function(replyData) {
  const reply = await mongoose.model('Message').create({
    ...replyData,
    parentMessageId: this._id,
    conversationId: this.conversationId,
    isReply: true
  });
  
  this.replies.push(reply._id);
  this.replyCount++;
  await this.save();
  
  return reply;
};

// Add attachment
messageSchema.methods.addAttachment = async function(attachmentData) {
  this.attachments.push(attachmentData);
  this.hasAttachments = true;
  await this.save();
  return this;
};

// Toggle important
messageSchema.methods.toggleImportant = async function() {
  this.isImportant = !this.isImportant;
  await this.save();
  return this.isImportant;
};

// Toggle starred
messageSchema.methods.toggleStarred = async function() {
  this.isStarred = !this.isStarred;
  await this.save();
  return this.isStarred;
};

// Add reaction
messageSchema.methods.addReaction = async function(emoji, userId) {
  // Check if user already reacted with this emoji
  const existingReaction = this.reactions.find(
    r => r.emoji === emoji && r.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    // Remove reaction
    this.reactions = this.reactions.filter(
      r => !(r.emoji === emoji && r.user.toString() === userId.toString())
    );
  } else {
    // Add reaction
    this.reactions.push({ emoji, user: userId });
  }
  
  await this.save();
  return this.reactions;
};

// Archive message
messageSchema.methods.archive = async function() {
  this.status = 'archived';
  await this.save();
  return this;
};

// Soft delete
messageSchema.methods.softDelete = async function() {
  this.status = 'deleted';
  this.deletedAt = Date.now();
  await this.save();
  return this;
};

// Schedule message
messageSchema.methods.schedule = async function(scheduleTime) {
  this.isScheduled = true;
  this.scheduledFor = scheduleTime;
  await this.save();
  return this;
};

// ===========================================
// STATIC METHODS
// ===========================================

// Get conversation messages
messageSchema.statics.getConversation = async function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({ conversationId, status: { $ne: 'deleted' } })
    .populate('sender', 'name email avatar')
    .populate('receiver', 'name email avatar')
    .populate('replies')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Get unread messages for client
messageSchema.statics.getUnreadForClient = async function(clientId) {
  return this.find({
    receiver: clientId,
    isRead: false,
    status: { $ne: 'deleted' }
  })
  .populate('sender', 'name avatar')
  .sort('-createdAt');
};

// Get unread count
messageSchema.statics.getUnreadCount = async function(clientId) {
  return this.countDocuments({
    receiver: clientId,
    isRead: false,
    status: { $ne: 'deleted' }
  });
};

// Get recent conversations
messageSchema.statics.getRecentConversations = async function(userId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: userId },
          { receiver: userId }
        ],
        status: { $ne: 'deleted' }
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        count: { $sum: 1 }
      }
    },
    { $limit: limit }
  ]);
};

// Get message stats
messageSchema.statics.getMessageStats = async function() {
  const total = await this.countDocuments({ status: { $ne: 'deleted' } });
  const unread = await this.countDocuments({ isRead: false, status: { $ne: 'deleted' } });
  const urgent = await this.countDocuments({ priority: 'urgent', isRead: false });
  const withAttachments = await this.countDocuments({ hasAttachments: true });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayMessages = await this.countDocuments({
    createdAt: { $gte: today },
    status: { $ne: 'deleted' }
  });
  
  return {
    total,
    unread,
    urgent,
    withAttachments,
    today: todayMessages
  };
};

// Search messages
messageSchema.statics.search = async function(query, userId) {
  return this.find({
    $and: [
      {
        $or: [
          { sender: userId },
          { receiver: userId }
        ]
      },
      {
        $or: [
          { subject: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } }
        ]
      },
      { status: { $ne: 'deleted' } }
    ]
  })
  .populate('sender', 'name avatar')
  .populate('receiver', 'name avatar')
  .sort('-createdAt')
  .limit(50);
};

// Get messages by project
messageSchema.statics.getByProject = async function(projectId) {
  return this.find({ relatedProject: projectId, status: { $ne: 'deleted' } })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar')
    .sort('-createdAt');
};

// Get scheduled messages
messageSchema.statics.getScheduled = async function() {
  return this.find({
    isScheduled: true,
    scheduledFor: { $lte: new Date() },
    status: { $ne: 'deleted' }
  });
};

// ===========================================
// QUERY MIDDLEWARE
// ===========================================

// Populate references by default
messageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sender',
    select: 'name email avatar'
  }).populate({
    path: 'receiver',
    select: 'name email avatar company'
  }).populate({
    path: 'parentMessageId',
    select: 'subject content sender createdAt'
  }).populate({
    path: 'replies',
    options: { sort: { createdAt: -1 }, limit: 5 }
  });
  
  // Exclude deleted messages
  this.find({ status: { $ne: 'deleted' } });
  
  next();
});

// ===========================================
// CONVERSATION MODEL (for grouping messages)
// ===========================================
const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'participantModel'
  }],
  
  participantModel: {
    type: String,
    enum: ['User', 'Client'],
    required: true
  },
  
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  
  lastReadAt: {
    type: Date
  },
  
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  
  isArchived: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
conversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Get or create conversation
conversationSchema.statics.getOrCreate = async function(userId, clientId) {
  let conversation = await this.findOne({
    participants: { $all: [userId, clientId] },
    participantModel: 'User'
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants: [userId, clientId],
      participantModel: 'User',
      unreadCount: new Map()
    });
  }
  
  return conversation;
};

// Update last message
conversationSchema.methods.updateLastMessage = async function(messageId) {
  this.lastMessage = messageId;
  this.lastMessageAt = Date.now();
  await this.save();
};

// Increment unread count
conversationSchema.methods.incrementUnread = async function(participantId) {
  const current = this.unreadCount.get(participantId.toString()) || 0;
  this.unreadCount.set(participantId.toString(), current + 1);
  await this.save();
};

// Reset unread count
conversationSchema.methods.resetUnread = async function(participantId) {
  this.unreadCount.set(participantId.toString(), 0);
  await this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

// ===========================================
// EXPORT MODELS
// ===========================================
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
module.exports.Conversation = Conversation;