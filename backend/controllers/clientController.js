const { Message, Conversation } = require('../models/Message');
const User = require('../models/User');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// ===========================================
// MESSAGE CRUD OPERATIONS
// ===========================================

/**
 * @desc    Get all conversations for current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getConversations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
      participants: req.user._id,
      participantModel: 'User'
    })
    .populate({
      path: 'participants',
      match: { _id: { $ne: req.user._id } },
      select: 'name email avatar company status'
    })
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name avatar'
      }
    })
    .sort('-lastMessageAt')
    .skip(skip)
    .limit(limit);

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          receiver: req.user._id,
          isRead: false
        });
        
        return {
          ...conv.toObject(),
          unreadCount
        };
      })
    );

    const total = await Conversation.countDocuments({
      participants: req.user._id,
      participantModel: 'User'
    });

    res.json({
      success: true,
      data: {
        conversations: conversationsWithUnread,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get messages for a specific conversation
 * @route   GET /api/messages/conversations/:conversationId
 * @access  Private
 */
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user has access to this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }

    // Get messages
    const messages = await Message.getConversation(conversationId, page, limit);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiver: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: Date.now(),
        status: 'read'
      }
    );

    // Reset unread count for this user in conversation
    await conversation.resetUnread(req.user._id);

    // Get other participant info
    const otherParticipantId = conversation.participants.find(
      p => p.toString() !== req.user._id.toString()
    );

    let otherParticipant;
    if (conversation.participantModel === 'User') {
      otherParticipant = await User.findById(otherParticipantId)
        .select('name email avatar role status');
    } else {
      otherParticipant = await Client.findById(otherParticipantId)
        .select('name email avatar company');
    }

    res.json({
      success: true,
      data: {
        messages,
        conversation: {
          id: conversation._id,
          otherParticipant,
          lastMessageAt: conversation.lastMessageAt,
          createdAt: conversation.createdAt
        },
        pagination: {
          page,
          limit,
          total: messages.length,
          hasMore: messages.length === limit
        }
      }
    });
  } catch (error) {
    console.error('Get Conversation Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Send a new message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
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

    const { receiverId, receiverModel, subject, content, messageType, priority, relatedProject, attachments } = req.body;

    if (!receiverId || !receiverModel || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide receiverId, receiverModel, subject and content'
      });
    }

    // Validate receiver exists
    let receiver;
    if (receiverModel === 'User') {
      receiver = await User.findById(receiverId);
    } else if (receiverModel === 'Client') {
      receiver = await Client.findById(receiverId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid receiver model'
      });
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Get or create conversation
    const conversation = await Conversation.getOrCreate(req.user._id, receiverId);

    // Create message
    const message = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderEmail: req.user.email,
      senderAvatar: req.user.avatar,
      receiver: receiverId,
      receiverName: receiver.name,
      receiverEmail: receiver.email,
      receiverAvatar: receiver.avatar,
      subject,
      content,
      messageType: messageType || 'general',
      priority: priority || 'normal',
      conversationId: conversation._id,
      relatedProject,
      attachments: attachments || [],
      hasAttachments: attachments && attachments.length > 0,
      status: 'sent',
      sentAt: Date.now()
    });

    // Update conversation
    await conversation.updateLastMessage(message._id);
    await conversation.incrementUnread(receiverId);

    // Create notification for receiver
    await Notification.createNotification({
      user: receiverId,
      type: priority === 'urgent' ? 'alert' : 'info',
      category: 'message',
      title: `New Message from ${req.user.name}`,
      message: subject,
      actionUrl: `/messages?conversation=${conversation._id}`,
      priority: priority === 'urgent' ? 'high' : 'medium',
      metadata: {
        conversationId: conversation._id,
        messageId: message._id,
        senderName: req.user.name,
        senderAvatar: req.user.avatar
      }
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${receiverId}`).emit('newMessage', {
        conversationId: conversation._id,
        message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message,
        conversationId: conversation._id
      }
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Reply to a message
 * @route   POST /api/messages/:messageId/reply
 * @access  Private
 */
const replyToMessage = async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const { messageId } = req.params;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reply content'
      });
    }

    // Find parent message
    const parentMessage = await Message.findById(messageId);

    if (!parentMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has access to this conversation
    const conversation = await Conversation.findOne({
      _id: parentMessage.conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation'
      });
    }

    // Determine receiver (the other participant)
    const receiverId = parentMessage.sender._id.toString() === req.user._id.toString()
      ? parentMessage.receiver
      : parentMessage.sender;

    // Get receiver details
    let receiver;
    if (conversation.participantModel === 'User') {
      receiver = await User.findById(receiverId);
    } else {
      receiver = await Client.findById(receiverId);
    }

    // Create reply
    const reply = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderEmail: req.user.email,
      senderAvatar: req.user.avatar,
      receiver: receiverId,
      receiverName: receiver.name,
      receiverEmail: receiver.email,
      receiverAvatar: receiver.avatar,
      subject: `Re: ${parentMessage.subject}`,
      content,
      messageType: parentMessage.messageType,
      priority: parentMessage.priority,
      conversationId: parentMessage.conversationId,
      parentMessageId: messageId,
      isReply: true,
      attachments: attachments || [],
      hasAttachments: attachments && attachments.length > 0,
      status: 'sent',
      sentAt: Date.now()
    });

    // Update parent message
    await parentMessage.addReply(reply);

    // Update conversation
    await conversation.updateLastMessage(reply._id);
    await conversation.incrementUnread(receiverId);

    // Create notification
    await Notification.createNotification({
      user: receiverId,
      type: 'info',
      category: 'message',
      title: `New Reply from ${req.user.name}`,
      message: content.substring(0, 100),
      actionUrl: `/messages?conversation=${conversation._id}`,
      priority: parentMessage.priority === 'urgent' ? 'high' : 'medium'
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${receiverId}`).emit('newReply', {
        conversationId: conversation._id,
        parentMessageId: messageId,
        reply
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: { reply }
    });
  } catch (error) {
    console.error('Reply To Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending reply',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get message by ID
 * @route   GET /api/messages/:messageId
 * @access  Private
 */
const getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar company')
      .populate('parentMessageId')
      .populate('replies');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has access
    const hasAccess = message.sender._id.toString() === req.user._id.toString() ||
                     message.receiver._id.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this message'
      });
    }

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Get Message By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// MESSAGE ACTIONS
// ===========================================

/**
 * @desc    Mark message as read
 * @route   PUT /api/messages/:messageId/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own messages as read'
      });
    }

    await message.markAsRead(req.user._id);

    // Update conversation unread count
    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      await conversation.resetUnread(req.user._id);
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${message.sender}`).emit('messageRead', {
        messageId: message._id,
        readAt: message.readAt
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      data: {
        isRead: message.isRead,
        readAt: message.readAt
      }
    });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking message as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Mark all messages in conversation as read
 * @route   PUT /api/messages/conversations/:conversationId/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    await Message.updateMany(
      {
        conversationId,
        receiver: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: Date.now(),
        status: 'read'
      }
    );

    await conversation.resetUnread(req.user._id);

    res.json({
      success: true,
      message: 'All messages marked as read'
    });
  } catch (error) {
    console.error('Mark All As Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking messages as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Toggle message importance
 * @route   PUT /api/messages/:messageId/toggle-important
 * @access  Private
 */
const toggleImportant = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only participant can toggle importance
    const isParticipant = message.sender.toString() === req.user._id.toString() ||
                         message.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own messages as important'
      });
    }

    const isImportant = await message.toggleImportant();

    res.json({
      success: true,
      message: isImportant ? 'Message marked as important' : 'Message unmarked as important',
      data: { isImportant }
    });
  } catch (error) {
    console.error('Toggle Important Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling importance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Toggle message star
 * @route   PUT /api/messages/:messageId/toggle-star
 * @access  Private
 */
const toggleStar = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only participant can toggle star
    const isParticipant = message.sender.toString() === req.user._id.toString() ||
                         message.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only star your own messages'
      });
    }

    const isStarred = await message.toggleStarred();

    res.json({
      success: true,
      message: isStarred ? 'Message starred' : 'Message unstarred',
      data: { isStarred }
    });
  } catch (error) {
    console.error('Toggle Star Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling star',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Add reaction to message
 * @route   POST /api/messages/:messageId/reactions
 * @access  Private
 */
const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const { messageId } = req.params;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Please provide emoji'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const reactions = await message.addReaction(emoji, req.user._id);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation-${message.conversationId}`).emit('messageReaction', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.json({
      success: true,
      message: 'Reaction added',
      data: { reactions }
    });
  } catch (error) {
    console.error('Add Reaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding reaction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// MESSAGE ORGANIZATION
// ===========================================

/**
 * @desc    Get unread messages count
 * @route   GET /api/messages/unread/count
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user._id);

    // Get unread by conversation
    const conversations = await Conversation.find({
      participants: req.user._id
    });

    const byConversation = {};
    await Promise.all(
      conversations.map(async (conv) => {
        const unread = await Message.countDocuments({
          conversationId: conv._id,
          receiver: req.user._id,
          isRead: false
        });
        if (unread > 0) {
          byConversation[conv._id] = unread;
        }
      })
    );

    res.json({
      success: true,
      data: {
        total: count,
        byConversation
      }
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get important messages
 * @route   GET /api/messages/important
 * @access  Private
 */
const getImportantMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ],
      isImportant: true,
      status: { $ne: 'deleted' }
    })
    .populate('sender', 'name email avatar')
    .populate('receiver', 'name email avatar company')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await Message.countDocuments({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ],
      isImportant: true,
      status: { $ne: 'deleted' }
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Important Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching important messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get starred messages
 * @route   GET /api/messages/starred
 * @access  Private
 */
const getStarredMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ],
      isStarred: true,
      status: { $ne: 'deleted' }
    })
    .populate('sender', 'name email avatar')
    .populate('receiver', 'name email avatar company')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

    const total = await Message.countDocuments({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ],
      isStarred: true,
      status: { $ne: 'deleted' }
    });

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Starred Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching starred messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Search messages
 * @route   GET /api/messages/search
 * @access  Private
 */
const searchMessages = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide search query'
      });
    }

    const messages = await Message.search(q, req.user._id);

    res.json({
      success: true,
      data: {
        messages,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Search Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// MESSAGE STATISTICS
// ===========================================

/**
 * @desc    Get message statistics
 * @route   GET /api/messages/stats
 * @access  Private
 */
const getMessageStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      total,
      unread,
      important,
      starred,
      withAttachments,
      byType,
      recentActivity
    ] = await Promise.all([
      // Total messages
      Message.countDocuments({
        $or: [
          { sender: userId },
          { receiver: userId }
        ],
        status: { $ne: 'deleted' }
      }),

      // Unread messages
      Message.countDocuments({
        receiver: userId,
        isRead: false,
        status: { $ne: 'deleted' }
      }),

      // Important messages
      Message.countDocuments({
        $or: [
          { sender: userId },
          { receiver: userId }
        ],
        isImportant: true,
        status: { $ne: 'deleted' }
      }),

      // Starred messages
      Message.countDocuments({
        $or: [
          { sender: userId },
          { receiver: userId }
        ],
        isStarred: true,
        status: { $ne: 'deleted' }
      }),

      // Messages with attachments
      Message.countDocuments({
        $or: [
          { sender: userId },
          { receiver: userId }
        ],
        hasAttachments: true,
        status: { $ne: 'deleted' }
      }),

      // Messages by type
      Message.aggregate([
        {
          $match: {
            $or: [
              { sender: userId },
              { receiver: userId }
            ],
            status: { $ne: 'deleted' }
          }
        },
        {
          $group: {
            _id: '$messageType',
            count: { $sum: 1 }
          }
        }
      ]),

      // Recent activity (last 7 days)
      Message.aggregate([
        {
          $match: {
            $or: [
              { sender: userId },
              { receiver: userId }
            ],
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            status: { $ne: 'deleted' }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            sent: {
              $sum: { $cond: [{ $eq: ['$sender', userId] }, 1, 0] }
            },
            received: {
              $sum: { $cond: [{ $eq: ['$receiver', userId] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
      ])
    ]);

    // Get response rate
    const responseTime = await Message.aggregate([
      {
        $match: {
          receiver: userId,
          isReply: true,
          status: { $ne: 'deleted' }
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'parentMessageId',
          foreignField: '_id',
          as: 'parent'
        }
      },
      { $unwind: '$parent' },
      {
        $project: {
          responseTime: { $subtract: ['$createdAt', '$parent.createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const avgResponseTime = responseTime[0]?.avgResponseTime || 0;
    const avgResponseHours = avgResponseTime / (1000 * 60 * 60);

    res.json({
      success: true,
      data: {
        overview: {
          total,
          unread,
          important,
          starred,
          withAttachments,
          avgResponseTime: Math.round(avgResponseHours * 10) / 10
        },
        byType,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get Message Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching message statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// ARCHIVE & DELETE
// ===========================================

/**
 * @desc    Archive message
 * @route   PUT /api/messages/:messageId/archive
 * @access  Private
 */
const archiveMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only participant can archive
    const isParticipant = message.sender.toString() === req.user._id.toString() ||
                         message.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only archive your own messages'
      });
    }

    await message.archive();

    res.json({
      success: true,
      message: 'Message archived'
    });
  } catch (error) {
    console.error('Archive Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete message (soft delete)
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only participant can delete
    const isParticipant = message.sender.toString() === req.user._id.toString() ||
                         message.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await message.softDelete();

    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Archive conversation
 * @route   PUT /api/messages/conversations/:conversationId/archive
 * @access  Private
 */
const archiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: req.params.conversationId,
        participants: req.user._id
      },
      { isArchived: true },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation archived'
    });
  } catch (error) {
    console.error('Archive Conversation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving conversation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// ATTACHMENT MANAGEMENT
// ===========================================

/**
 * @desc    Upload attachment for message
 * @route   POST /api/messages/attachments
 * @access  Private
 */
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype.split('/')[0],
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: Date.now()
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: { attachment }
    });
  } catch (error) {
    console.error('Upload Attachment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.exportClients = async (req, res) => {
  try {
    const Client = require('../models/Client');

    const clients = await Client.find({ isActive: true });

    res.json({
      success: true,
      data: clients
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting clients',
      error: error.message
    });
  }
};

const getClients = async (req, res) => {

  console.log("🔥 GET CLIENTS API HIT");

  try {

    const clients = await Client.find({ isDeleted: false })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    console.log("✅ Clients fetched:", clients.length);

    res.status(200).json({
      success: true,
      data: { clients }
    });

  } catch (error) {

    console.error("❌ Get Clients Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching clients"
    });

  }
};

const getClientById = async (req,res)=>{
  res.json({message:"getClientById working"})
}

const createClient = async (req,res)=>{
  res.json({message:"createClient working"})
}

const updateClient = async (req,res)=>{
  res.json({message:"updateClient working"})
}

const deleteClient = async (req,res)=>{
  res.json({message:"deleteClient working"})
}

const getClientStats = async (req,res)=>{
  res.json({message:"getClientStats working"})
}

const addContactHistory = async (req,res)=>{}
const getContactHistory = async (req,res)=>{}
const addNote = async (req,res)=>{}
const getNotes = async (req,res)=>{}
const updateNote = async (req,res)=>{}
const deleteNote = async (req,res)=>{}
const addFeedback = async (req,res)=>{}
const getPaymentHistory = async (req,res)=>{}
const addReferral = async (req,res)=>{}
const updateReferralStatus = async (req,res)=>{}
const uploadDocument = async (req,res)=>{}
const deleteDocument = async (req,res)=>{}
const searchClients = async (req,res)=>{}
// ===========================================
// SCHEDULED MESSAGES
// ===========================================

/**
 * @desc    Schedule a message
 * @route   POST /api/messages/schedule
 * @access  Private
 */
const scheduleMessage = async (req, res) => {
  try {
    const { receiverId, receiverModel, subject, content, scheduledFor } = req.body;

    if (!receiverId || !receiverModel || !subject || !content || !scheduledFor) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate scheduled time
    const scheduleTime = new Date(scheduledFor);
    if (scheduleTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    // Get or create conversation
    const conversation = await Conversation.getOrCreate(req.user._id, receiverId);

    const message = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderEmail: req.user.email,
      receiver: receiverId,
      receiverModel,
      subject,
      content,
      conversationId: conversation._id,
      isScheduled: true,
      scheduledFor: scheduleTime,
      status: 'scheduled'
    });

    res.status(201).json({
      success: true,
      message: 'Message scheduled successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Schedule Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while scheduling message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get scheduled messages
 * @route   GET /api/messages/scheduled
 * @access  Private
 */
const getScheduledMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      sender: req.user._id,
      isScheduled: true,
      status: 'scheduled'
    })
    .populate('receiver', 'name email avatar company')
    .sort('scheduledFor');

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Get Scheduled Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching scheduled messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// EXPORT CONTROLLERS
// ===========================================
module.exports = {

  // CLIENT CONTROLLERS
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  addContactHistory,
  getContactHistory,
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  addFeedback,
  getPaymentHistory,
  addReferral,
  updateReferralStatus,
  uploadDocument,
  deleteDocument,
  searchClients,

  // MESSAGE CONTROLLERS
  getConversations,
  getConversationMessages,
  sendMessage,
  replyToMessage,
  getMessageById,
  markAsRead,
  markAllAsRead,
  toggleImportant,
  toggleStar,
  addReaction,
  getUnreadCount,
  getImportantMessages,
  getStarredMessages,
  searchMessages,
  getMessageStats,
  archiveMessage,
  deleteMessage,
  archiveConversation,
  uploadAttachment,
  scheduleMessage,
  getScheduledMessages
};