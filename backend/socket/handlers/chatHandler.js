const Message = require('../../models/Message');
const Conversation = require('../../models/Message').Conversation;
const User = require('../../models/User');
const Client = require('../../models/Client');
const Notification = require('../../models/Notification');

/**
 * Chat Handler - Manages all real-time chat functionality
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Connected socket instance
 * @param {Map} onlineUsers - Map of online users
 */
module.exports = (io, socket, onlineUsers) => {
  
  // ===========================================
  // CONVERSATION MANAGEMENT
  // ===========================================

  /**
   * Join a conversation room
   */
  socket.on('chat:join', async (data) => {
    try {
      const { conversationId } = data;

      if (!conversationId) {
        return socket.emit('chat:error', { 
          message: 'Conversation ID is required' 
        });
      }

      // Check if user has access to this conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
      });

      if (!conversation) {
        return socket.emit('chat:error', { 
          message: 'You do not have access to this conversation' 
        });
      }

      // Join the conversation room
      socket.join(`conversation:${conversationId}`);
      
      // Get other participant info
      const otherParticipantId = conversation.participants.find(
        p => p.toString() !== socket.user._id.toString()
      );

      let otherParticipant;
      if (conversation.participantModel === 'User') {
        otherParticipant = await User.findById(otherParticipantId)
          .select('name email avatar role status');
      } else {
        otherParticipant = await Client.findById(otherParticipantId)
          .select('name email avatar company');
      }

      console.log(`💬 User ${socket.user.name} joined conversation ${conversationId}`);

      // Send success response
      socket.emit('chat:joined', {
        success: true,
        conversationId,
        otherParticipant,
        participantModel: conversation.participantModel
      });

      // Notify others in the conversation
      socket.to(`conversation:${conversationId}`).emit('chat:user-joined', {
        userId: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Chat Join Error:', error);
      socket.emit('chat:error', { 
        message: 'Error joining conversation',
        error: error.message 
      });
    }
  });

  /**
   * Leave a conversation room
   */
  socket.on('chat:leave', async (data) => {
    try {
      const { conversationId } = data;

      socket.leave(`conversation:${conversationId}`);
      
      console.log(`💬 User ${socket.user.name} left conversation ${conversationId}`);

      // Notify others
      socket.to(`conversation:${conversationId}`).emit('chat:user-left', {
        userId: socket.user._id,
        name: socket.user.name,
        timestamp: new Date()
      });

      socket.emit('chat:left', {
        success: true,
        conversationId
      });

    } catch (error) {
      console.error('Chat Leave Error:', error);
      socket.emit('chat:error', { 
        message: 'Error leaving conversation',
        error: error.message 
      });
    }
  });

  /**
   * Get conversation history
   */
  socket.on('chat:history', async (data) => {
    try {
      const { conversationId, page = 1, limit = 50 } = data;

      const skip = (page - 1) * limit;

      const messages = await Message.find({ conversationId })
        .populate('sender', 'name email avatar')
        .populate('receiver', 'name email avatar company')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments({ conversationId });

      socket.emit('chat:history', {
        success: true,
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Chat History Error:', error);
      socket.emit('chat:error', { 
        message: 'Error fetching chat history',
        error: error.message 
      });
    }
  });

  // ===========================================
  // MESSAGE HANDLING
  // ===========================================

  /**
   * Send a new message
   */
  socket.on('chat:send', async (data) => {
    try {
      const { 
        conversationId, 
        content, 
        receiverId, 
        receiverModel = 'Client',
        messageType = 'general',
        priority = 'normal',
        attachments = [],
        replyTo
      } = data;

      // Validation
      if (!conversationId || !content || !receiverId) {
        return socket.emit('chat:error', { 
          message: 'Missing required fields' 
        });
      }

      // Get receiver info
      let receiver;
      if (receiverModel === 'User') {
        receiver = await User.findById(receiverId);
      } else {
        receiver = await Client.findById(receiverId);
      }

      if (!receiver) {
        return socket.emit('chat:error', { 
          message: 'Receiver not found' 
        });
      }

      // Create message in database
      const message = await Message.create({
        sender: socket.user._id,
        senderName: socket.user.name,
        senderEmail: socket.user.email,
        senderAvatar: socket.user.avatar,
        receiver: receiverId,
        receiverName: receiver.name,
        receiverEmail: receiver.email,
        receiverAvatar: receiver.avatar,
        content,
        messageType,
        priority,
        conversationId,
        attachments: attachments || [],
        hasAttachments: attachments && attachments.length > 0,
        parentMessageId: replyTo || null,
        status: 'sent',
        sentAt: new Date()
      });

      // Populate sender info
      await message.populate('sender', 'name email avatar');

      // Update conversation last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      });

      // Increment unread count for receiver
      await Conversation.findByIdAndUpdate(conversationId, {
        $inc: { [`unreadCount.${receiverId}`]: 1 }
      });

      // Emit to conversation room (including sender)
      io.to(`conversation:${conversationId}`).emit('chat:message', {
        message,
        conversationId,
        timestamp: new Date()
      });

      // Send notification to receiver if online
      const receiverSocket = onlineUsers.get(receiverId.toString());
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('chat:notification', {
          type: 'new_message',
          from: socket.user.name,
          fromId: socket.user._id,
          fromAvatar: socket.user.avatar,
          content: content.substring(0, 100),
          conversationId,
          messageId: message._id,
          timestamp: new Date()
        });

        // Also send to receiver's personal room
        io.to(`user:${receiverId}`).emit('chat:new-message', {
          message,
          conversationId,
          from: socket.user.name
        });
      }

      // Create notification in database
      await Notification.create({
        user: receiverId,
        type: priority === 'urgent' ? 'alert' : 'info',
        category: 'message',
        title: `New message from ${socket.user.name}`,
        message: content.substring(0, 100),
        actionUrl: `/messages?conversation=${conversationId}`,
        priority: priority === 'urgent' ? 'high' : 'medium',
        metadata: {
          conversationId,
          messageId: message._id,
          senderName: socket.user.name,
          senderAvatar: socket.user.avatar
        }
      });

      console.log(`📨 Message sent by ${socket.user.name} in conversation ${conversationId}`);

    } catch (error) {
      console.error('Chat Send Error:', error);
      socket.emit('chat:error', { 
        message: 'Error sending message',
        error: error.message 
      });
    }
  });

  /**
   * Edit a message
   */
  socket.on('chat:edit', async (data) => {
    try {
      const { messageId, content } = data;

      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Check if user is the sender
      if (message.sender.toString() !== socket.user._id.toString()) {
        return socket.emit('chat:error', { 
          message: 'You can only edit your own messages' 
        });
      }

      // Check if message is too old to edit (optional: 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (message.createdAt < fiveMinutesAgo) {
        return socket.emit('chat:error', { 
          message: 'Messages can only be edited within 5 minutes' 
        });
      }

      message.content = content;
      message.edited = true;
      message.editedAt = new Date();
      await message.save();

      // Notify conversation
      io.to(`conversation:${message.conversationId}`).emit('chat:message-edited', {
        messageId,
        content,
        editedAt: message.editedAt,
        editedBy: socket.user._id
      });

    } catch (error) {
      console.error('Chat Edit Error:', error);
      socket.emit('chat:error', { 
        message: 'Error editing message',
        error: error.message 
      });
    }
  });

  /**
   * Delete a message (soft delete)
   */
  socket.on('chat:delete', async (data) => {
    try {
      const { messageId } = data;

      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Check if user is the sender or admin
      const isSender = message.sender.toString() === socket.user._id.toString();
      const isAdmin = socket.user.role === 'admin';

      if (!isSender && !isAdmin) {
        return socket.emit('chat:error', { 
          message: 'You can only delete your own messages' 
        });
      }

      await message.softDelete();

      // Notify conversation
      io.to(`conversation:${message.conversationId}`).emit('chat:message-deleted', {
        messageId,
        deletedBy: socket.user._id,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Chat Delete Error:', error);
      socket.emit('chat:error', { 
        message: 'Error deleting message',
        error: error.message 
      });
    }
  });

  // ===========================================
  // READ RECEIPTS
  // ===========================================

  /**
   * Mark messages as read
   */
  socket.on('chat:read', async (data) => {
    try {
      const { conversationId, messageIds } = data;

      if (!conversationId || !messageIds || !messageIds.length) {
        return socket.emit('chat:error', { 
          message: 'Conversation ID and message IDs required' 
        });
      }

      // Update messages as read
      await Message.updateMany(
        { 
          _id: { $in: messageIds },
          receiver: socket.user._id,
          isRead: false 
        },
        { 
          isRead: true, 
          readAt: new Date(),
          status: 'read'
        }
      );

      // Reset unread count for this user in conversation
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCount.${socket.user._id}`]: 0 }
      });

      // Notify conversation that messages were read
      io.to(`conversation:${conversationId}`).emit('chat:read-receipt', {
        messageIds,
        readBy: socket.user._id,
        readAt: new Date()
      });

      // Get sender IDs to notify them individually
      const messages = await Message.find({ _id: { $in: messageIds } })
        .select('sender');

      const senderIds = [...new Set(messages.map(m => m.sender.toString()))];

      senderIds.forEach(senderId => {
        const senderSocket = onlineUsers.get(senderId);
        if (senderSocket) {
          io.to(senderSocket.socketId).emit('chat:messages-read', {
            conversationId,
            messageIds,
            readBy: socket.user._id,
            readAt: new Date()
          });
        }
      });

    } catch (error) {
      console.error('Chat Read Error:', error);
      socket.emit('chat:error', { 
        message: 'Error marking messages as read',
        error: error.message 
      });
    }
  });

  /**
   * Mark all messages in conversation as read
   */
  socket.on('chat:read-all', async (data) => {
    try {
      const { conversationId } = data;

      // Update all unread messages
      const result = await Message.updateMany(
        { 
          conversationId,
          receiver: socket.user._id,
          isRead: false 
        },
        { 
          isRead: true, 
          readAt: new Date(),
          status: 'read'
        }
      );

      // Reset unread count
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCount.${socket.user._id}`]: 0 }
      });

      // Notify conversation
      io.to(`conversation:${conversationId}`).emit('chat:all-read', {
        conversationId,
        readBy: socket.user._id,
        count: result.modifiedCount,
        readAt: new Date()
      });

    } catch (error) {
      console.error('Chat Read All Error:', error);
      socket.emit('chat:error', { 
        message: 'Error marking all messages as read',
        error: error.message 
      });
    }
  });

  // ===========================================
  // TYPING INDICATORS
  // ===========================================

  /**
   * User typing indicator
   */
  socket.on('chat:typing', (data) => {
    try {
      const { conversationId, isTyping } = data;

      // Broadcast to others in the conversation (not the sender)
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        userId: socket.user._id,
        name: socket.user.name,
        isTyping,
        conversationId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Chat Typing Error:', error);
    }
  });

  // ===========================================
  // REACTIONS
  // ===========================================

  /**
   * Add reaction to message
   */
  socket.on('chat:react', async (data) => {
    try {
      const { messageId, emoji } = data;

      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      const reactions = await message.addReaction(emoji, socket.user._id);

      // Notify conversation
      io.to(`conversation:${message.conversationId}`).emit('chat:reaction', {
        messageId,
        reactions,
        userId: socket.user._id,
        emoji,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Chat Reaction Error:', error);
      socket.emit('chat:error', { 
        message: 'Error adding reaction',
        error: error.message 
      });
    }
  });

  // ===========================================
  // ATTACHMENTS
  // ===========================================

  /**
   * Upload attachment (just notify, actual upload handled by HTTP)
   */
  socket.on('chat:attachment-uploaded', async (data) => {
    try {
      const { conversationId, messageId, attachment } = data;

      // Notify conversation about attachment
      io.to(`conversation:${conversationId}`).emit('chat:attachment', {
        messageId,
        attachment,
        uploadedBy: socket.user._id,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Chat Attachment Error:', error);
    }
  });

  // ===========================================
  // SEARCH & FILTERS
  // ===========================================

  /**
   * Search messages in conversation
   */
  socket.on('chat:search', async (data) => {
    try {
      const { conversationId, query } = data;

      if (!query || query.length < 2) {
        return socket.emit('chat:search-results', { results: [] });
      }

      const messages = await Message.find({
        conversationId,
        content: { $regex: query, $options: 'i' }
      })
      .populate('sender', 'name avatar')
      .sort('-createdAt')
      .limit(20);

      socket.emit('chat:search-results', {
        query,
        results: messages
      });

    } catch (error) {
      console.error('Chat Search Error:', error);
    }
  });

  // ===========================================
  // MESSAGE FORWARDING
  // ===========================================

  /**
   * Forward message to another conversation
   */
  socket.on('chat:forward', async (data) => {
    try {
      const { messageId, targetConversationId } = data;

      const originalMessage = await Message.findById(messageId);

      if (!originalMessage) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Create forwarded message
      const forwardedMessage = await Message.create({
        sender: socket.user._id,
        senderName: socket.user.name,
        senderEmail: socket.user.email,
        receiver: originalMessage.receiver,
        receiverName: originalMessage.receiverName,
        content: originalMessage.content,
        messageType: originalMessage.messageType,
        conversationId: targetConversationId,
        forwardedFrom: messageId,
        isForwarded: true,
        attachments: originalMessage.attachments,
        hasAttachments: originalMessage.hasAttachments
      });

      // Notify target conversation
      io.to(`conversation:${targetConversationId}`).emit('chat:message', {
        message: forwardedMessage,
        conversationId: targetConversationId,
        isForwarded: true,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Chat Forward Error:', error);
      socket.emit('chat:error', { 
        message: 'Error forwarding message',
        error: error.message 
      });
    }
  });

  // ===========================================
  // MESSAGE PINNING
  // ===========================================

  /**
   * Pin message in conversation
   */
  socket.on('chat:pin', async (data) => {
    try {
      const { messageId } = data;

      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('chat:error', { message: 'Message not found' });
      }

      // Toggle pin
      message.isPinned = !message.isPinned;
      message.pinnedAt = message.isPinned ? new Date() : null;
      await message.save();

      // Notify conversation
      io.to(`conversation:${message.conversationId}`).emit('chat:pin-toggled', {
        messageId,
        isPinned: message.isPinned,
        pinnedAt: message.pinnedAt,
        pinnedBy: socket.user._id
      });

    } catch (error) {
      console.error('Chat Pin Error:', error);
      socket.emit('chat:error', { 
        message: 'Error pinning message',
        error: error.message 
      });
    }
  });

  // ===========================================
  // CONVERSATION MANAGEMENT
  // ===========================================

  /**
   * Get unread counts for all conversations
   */
  socket.on('chat:unread-counts', async () => {
    try {
      const conversations = await Conversation.find({
        participants: socket.user._id
      });

      const unreadCounts = {};
      
      conversations.forEach(conv => {
        const count = conv.unreadCount?.get(socket.user._id.toString()) || 0;
        if (count > 0) {
          unreadCounts[conv._id] = count;
        }
      });

      socket.emit('chat:unread-counts', {
        total: Object.values(unreadCounts).reduce((a, b) => a + b, 0),
        byConversation: unreadCounts
      });

    } catch (error) {
      console.error('Chat Unread Counts Error:', error);
    }
  });

  /**
   * Archive conversation
   */
  socket.on('chat:archive', async (data) => {
    try {
      const { conversationId } = data;

      await Conversation.findByIdAndUpdate(conversationId, {
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: socket.user._id
      });

      socket.emit('chat:archived', {
        success: true,
        conversationId
      });

    } catch (error) {
      console.error('Chat Archive Error:', error);
      socket.emit('chat:error', { 
        message: 'Error archiving conversation',
        error: error.message 
      });
    }
  });

  /**
   * Mute conversation
   */
  socket.on('chat:mute', async (data) => {
    try {
      const { conversationId, muted } = data;

      // Store mute preference (you might want to add this to user schema)
      // This is simplified - you'd typically store in a separate collection

      socket.emit('chat:muted', {
        success: true,
        conversationId,
        muted
      });

    } catch (error) {
      console.error('Chat Mute Error:', error);
      socket.emit('chat:error', { 
        message: 'Error muting conversation',
        error: error.message 
      });
    }
  });

  // ===========================================
  // ERROR HANDLING
  // ===========================================

  // Error handler for chat events
  socket.on('chat:error', (error) => {
    console.error('Chat client error:', error);
  });

  console.log(`✅ Chat handler initialized for user: ${socket.user?.name}`);
};