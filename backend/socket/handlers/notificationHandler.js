const Notification = require('../../models/Notification');

/**
 * Notification Socket Handler
 * Manages real-time notifications, alerts, and updates
 */
module.exports = (io, socket, onlineUsers) => {
  
  // ===========================================
  // SEND NOTIFICATION TO SPECIFIC USER
  // ===========================================
  socket.on('notification:send', async (data) => {
    try {
      const { userId, type, title, message, link, metadata = {} } = data;

      // Validation
      if (!userId || !type || !title || !message) {
        return socket.emit('notification:error', {
          message: 'Missing required fields: userId, type, title, message'
        });
      }

      // Create notification in database
      const notification = await Notification.create({
        user: userId,
        type,
        category: metadata.category || 'general',
        priority: metadata.priority || 'medium',
        title,
        message,
        shortMessage: message.length > 100 ? message.substring(0, 97) + '...' : message,
        actionUrl: link,
        actionText: metadata.actionText || 'View',
        icon: metadata.icon,
        relatedProject: metadata.projectId,
        relatedClient: metadata.clientId,
        relatedMessage: metadata.messageId,
        metadata,
        createdAt: new Date()
      });

      // Populate user info
      await notification.populate('user', 'name email avatar');

      // Send real-time notification if user is online
      const userSocket = onlineUsers.get(userId.toString());
      if (userSocket) {
        io.to(userSocket.socketId).emit('notification:new', {
          notification,
          timestamp: new Date()
        });

        // Also send unread count update
        const unreadCount = await Notification.countDocuments({
          user: userId,
          isRead: false
        });

        io.to(userSocket.socketId).emit('notification:unread-count', {
          count: unreadCount
        });
      }

      // Log notification sent
      console.log(`📨 Notification sent to user ${userId}: ${title}`);

      // Acknowledge to sender
      socket.emit('notification:sent', {
        success: true,
        notificationId: notification._id,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Notification send error:', error);
      socket.emit('notification:error', {
        message: 'Failed to send notification',
        error: error.message
      });
    }
  });

  // ===========================================
  // SEND NOTIFICATION TO MULTIPLE USERS
  // ===========================================
  socket.on('notification:send-multiple', async (data) => {
    try {
      const { userIds, type, title, message, link, metadata = {} } = data;

      if (!userIds || !userIds.length || !type || !title || !message) {
        return socket.emit('notification:error', {
          message: 'Missing required fields'
        });
      }

      // Create notifications for all users
      const notifications = await Notification.insertMany(
        userIds.map(userId => ({
          user: userId,
          type,
          category: metadata.category || 'general',
          priority: metadata.priority || 'medium',
          title,
          message,
          shortMessage: message.length > 100 ? message.substring(0, 97) + '...' : message,
          actionUrl: link,
          actionText: metadata.actionText || 'View',
          icon: metadata.icon,
          metadata,
          createdAt: new Date()
        }))
      );

      // Send to online users
      let sentCount = 0;
      for (const userId of userIds) {
        const userSocket = onlineUsers.get(userId.toString());
        if (userSocket) {
          const userNotifications = notifications.filter(
            n => n.user.toString() === userId.toString()
          );
          
          for (const notification of userNotifications) {
            io.to(userSocket.socketId).emit('notification:new', {
              notification,
              timestamp: new Date()
            });
            sentCount++;
          }

          // Update unread count
          const unreadCount = await Notification.countDocuments({
            user: userId,
            isRead: false
          });

          io.to(userSocket.socketId).emit('notification:unread-count', {
            count: unreadCount
          });
        }
      }

      socket.emit('notification:sent-multiple', {
        success: true,
        total: userIds.length,
        sent: sentCount,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Multiple notification send error:', error);
      socket.emit('notification:error', {
        message: 'Failed to send multiple notifications',
        error: error.message
      });
    }
  });

  // ===========================================
  // SEND NOTIFICATION TO ALL USERS (Broadcast)
  // ===========================================
  socket.on('notification:broadcast', async (data) => {
    try {
      // Check if user is admin
      if (socket.user.role !== 'admin') {
        return socket.emit('notification:error', {
          message: 'Only admins can broadcast notifications'
        });
      }

      const { type, title, message, link, metadata = {} } = data;

      // Get all active users
      const allUsers = await User.find({ isActive: true }).select('_id');
      const userIds = allUsers.map(u => u._id.toString());

      // Create notifications for all users
      const notifications = await Notification.insertMany(
        userIds.map(userId => ({
          user: userId,
          type,
          category: 'broadcast',
          priority: metadata.priority || 'medium',
          title,
          message,
          shortMessage: message.length > 100 ? message.substring(0, 97) + '...' : message,
          actionUrl: link,
          actionText: metadata.actionText || 'View',
          icon: metadata.icon || '📢',
          metadata: { ...metadata, broadcast: true },
          createdAt: new Date()
        }))
      );

      // Send to online users
      let sentCount = 0;
      onlineUsers.forEach((userSocket, userId) => {
        const userNotifications = notifications.filter(
          n => n.user.toString() === userId
        );
        
        for (const notification of userNotifications) {
          io.to(userSocket.socketId).emit('notification:new', {
            notification,
            timestamp: new Date()
          });
          sentCount++;
        }
      });

      socket.emit('notification:broadcast-success', {
        success: true,
        total: userIds.length,
        online: onlineUsers.size,
        sent: sentCount,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Broadcast notification error:', error);
      socket.emit('notification:error', {
        message: 'Failed to broadcast notification',
        error: error.message
      });
    }
  });

  // ===========================================
  // MARK NOTIFICATION AS READ
  // ===========================================
  socket.on('notification:read', async (notificationId) => {
    try {
      if (!notificationId) {
        return socket.emit('notification:error', {
          message: 'Notification ID required'
        });
      }

      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        {
          isRead: true,
          readAt: new Date(),
          inAppRead: true,
          inAppReadAt: new Date()
        },
        { new: true }
      );

      if (notification) {
        socket.emit('notification:read-success', {
          notificationId,
          readAt: notification.readAt
        });

        // Get updated unread count
        const unreadCount = await Notification.countDocuments({
          user: socket.user._id,
          isRead: false
        });

        socket.emit('notification:unread-count', {
          count: unreadCount
        });
      }

    } catch (error) {
      console.error('❌ Mark notification read error:', error);
      socket.emit('notification:error', {
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  });

  // ===========================================
  // MARK ALL NOTIFICATIONS AS READ
  // ===========================================
  socket.on('notification:read-all', async () => {
    try {
      const result = await Notification.updateMany(
        { user: socket.user._id, isRead: false },
        {
          isRead: true,
          readAt: new Date(),
          inAppRead: true,
          inAppReadAt: new Date()
        }
      );

      socket.emit('notification:read-all-success', {
        count: result.modifiedCount,
        timestamp: new Date()
      });

      socket.emit('notification:unread-count', { count: 0 });

    } catch (error) {
      console.error('❌ Mark all notifications read error:', error);
      socket.emit('notification:error', {
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  });

  // ===========================================
  // GET UNREAD COUNT
  // ===========================================
  socket.on('notification:unread-count', async () => {
    try {
      const count = await Notification.countDocuments({
        user: socket.user._id,
        isRead: false
      });

      socket.emit('notification:unread-count', { count });

    } catch (error) {
      console.error('❌ Get unread count error:', error);
      socket.emit('notification:error', {
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  });

  // ===========================================
  // GET ALL NOTIFICATIONS
  // ===========================================
  socket.on('notification:get-all', async (data) => {
    try {
      const { page = 1, limit = 20, filter = 'all' } = data;
      const skip = (page - 1) * limit;

      let query = { user: socket.user._id };
      
      if (filter === 'unread') {
        query.isRead = false;
      } else if (filter === 'read') {
        query.isRead = true;
      }

      const notifications = await Notification.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('relatedProject', 'name status')
        .populate('relatedClient', 'name company')
        .populate('relatedMessage', 'subject');

      const total = await Notification.countDocuments(query);

      socket.emit('notification:list', {
        success: true,
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Get notifications error:', error);
      socket.emit('notification:error', {
        message: 'Failed to get notifications',
        error: error.message
      });
    }
  });

  // ===========================================
  // DELETE NOTIFICATION
  // ===========================================
  socket.on('notification:delete', async (notificationId) => {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: socket.user._id
      });

      if (notification) {
        socket.emit('notification:deleted', {
          notificationId,
          timestamp: new Date()
        });

        // Update unread count
        const unreadCount = await Notification.countDocuments({
          user: socket.user._id,
          isRead: false
        });

        socket.emit('notification:unread-count', { count: unreadCount });
      }

    } catch (error) {
      console.error('❌ Delete notification error:', error);
      socket.emit('notification:error', {
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  });

  // ===========================================
  // CLEAR ALL NOTIFICATIONS
  // ===========================================
  socket.on('notification:clear-all', async () => {
    try {
      const result = await Notification.deleteMany({
        user: socket.user._id
      });

      socket.emit('notification:cleared', {
        count: result.deletedCount,
        timestamp: new Date()
      });

      socket.emit('notification:unread-count', { count: 0 });

    } catch (error) {
      console.error('❌ Clear all notifications error:', error);
      socket.emit('notification:error', {
        message: 'Failed to clear notifications',
        error: error.message
      });
    }
  });

  // ===========================================
  // GET NOTIFICATION STATS
  // ===========================================
  socket.on('notification:stats', async () => {
    try {
      const stats = await Notification.aggregate([
        { $match: { user: socket.user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
            },
            byType: {
              $push: {
                type: '$type',
                count: 1
              }
            },
            byCategory: {
              $push: {
                category: '$category',
                count: 1
              }
            }
          }
        }
      ]);

      // Get recent notifications
      const recent = await Notification.find({ user: socket.user._id })
        .sort('-createdAt')
        .limit(5)
        .select('title type createdAt isRead');

      socket.emit('notification:stats', {
        success: true,
        stats: stats[0] || { total: 0, unread: 0, byType: [], byCategory: [] },
        recent,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Get notification stats error:', error);
      socket.emit('notification:error', {
        message: 'Failed to get notification stats',
        error: error.message
      });
    }
  });

  // ===========================================
  // PROJECT NOTIFICATIONS
  // ===========================================
  
  // Project created notification
  socket.on('notification:project-created', async (data) => {
    try {
      const { project, teamMembers } = data;

      // Notify project manager
      if (project.projectManager) {
        await handleSendNotification({
          userId: project.projectManager,
          type: 'success',
          category: 'project',
          title: 'New Project Created',
          message: `Project "${project.name}" has been created`,
          link: `/projects/${project._id}`,
          metadata: { projectId: project._id }
        });
      }

      // Notify team members
      if (teamMembers && teamMembers.length > 0) {
        for (const member of teamMembers) {
          await handleSendNotification({
            userId: member.user,
            type: 'info',
            category: 'project',
            title: 'Added to Project',
            message: `You have been added to project: ${project.name}`,
            link: `/projects/${project._id}`,
            metadata: { projectId: project._id, role: member.role }
          });
        }
      }

    } catch (error) {
      console.error('❌ Project created notification error:', error);
    }
  });

  // Project status update notification
  socket.on('notification:project-status', async (data) => {
    try {
      const { projectId, projectName, oldStatus, newStatus, teamMembers } = data;

      const statusColors = {
        'Planning': 'info',
        'In Progress': 'info',
        'Review': 'warning',
        'Completed': 'success',
        'On Hold': 'warning',
        'Cancelled': 'error'
      };

      for (const memberId of teamMembers) {
        await handleSendNotification({
          userId: memberId,
          type: statusColors[newStatus] || 'info',
          category: 'project',
          title: 'Project Status Updated',
          message: `Project "${projectName}" status changed from ${oldStatus} to ${newStatus}`,
          link: `/projects/${projectId}`,
          metadata: { projectId, oldStatus, newStatus }
        });
      }

    } catch (error) {
      console.error('❌ Project status notification error:', error);
    }
  });

  // Project milestone notification
  socket.on('notification:project-milestone', async (data) => {
    try {
      const { projectId, projectName, milestone, teamMembers } = data;

      for (const memberId of teamMembers) {
        await handleSendNotification({
          userId: memberId,
          type: milestone.status === 'Completed' ? 'success' : 'info',
          category: 'milestone',
          title: milestone.status === 'Completed' ? 'Milestone Completed' : 'New Milestone Added',
          message: milestone.status === 'Completed' 
            ? `Milestone "${milestone.title}" completed in project ${projectName}`
            : `New milestone "${milestone.title}" added to project ${projectName}`,
          link: `/projects/${projectId}`,
          metadata: { projectId, milestoneId: milestone._id }
        });
      }

    } catch (error) {
      console.error('❌ Project milestone notification error:', error);
    }
  });

  // ===========================================
  // TASK NOTIFICATIONS
  // ===========================================
  
  // Task assigned notification
  socket.on('notification:task-assigned', async (data) => {
    try {
      const { task, projectName, assignedBy } = data;

      await handleSendNotification({
        userId: task.assignedTo,
        type: 'info',
        category: 'task',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: "${task.title}" in project ${projectName}`,
        link: `/projects/${task.projectId}`,
        priority: task.priority === 'High' ? 'high' : 'medium',
        metadata: {
          projectId: task.projectId,
          taskId: task._id,
          assignedBy
        }
      });

    } catch (error) {
      console.error('❌ Task assigned notification error:', error);
    }
  });

  // Task completed notification
  socket.on('notification:task-completed', async (data) => {
    try {
      const { task, projectName, completedBy, projectManager } = data;

      // Notify project manager
      await handleSendNotification({
        userId: projectManager,
        type: 'success',
        category: 'task',
        title: 'Task Completed',
        message: `Task "${task.title}" completed in project ${projectName} by ${completedBy}`,
        link: `/projects/${task.projectId}`,
        metadata: {
          projectId: task.projectId,
          taskId: task._id,
          completedBy
        }
      });

    } catch (error) {
      console.error('❌ Task completed notification error:', error);
    }
  });

  // ===========================================
  // CLIENT NOTIFICATIONS
  // ===========================================
  
  // New client added notification
  socket.on('notification:client-added', async (data) => {
    try {
      const { client, assignedTo } = data;

      if (assignedTo) {
        await handleSendNotification({
          userId: assignedTo,
          type: 'success',
          category: 'client',
          title: 'New Client Assigned',
          message: `You have been assigned a new client: ${client.name}`,
          link: `/clients/${client._id}`,
          metadata: { clientId: client._id }
        });
      }

      // Notify admins
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const admin of admins) {
        await handleSendNotification({
          userId: admin._id,
          type: 'info',
          category: 'client',
          title: 'New Client Added',
          message: `New client "${client.name}" has been added to the system`,
          link: `/clients/${client._id}`,
          metadata: { clientId: client._id }
        });
      }

    } catch (error) {
      console.error('❌ Client added notification error:', error);
    }
  });

  // ===========================================
  // PAYMENT NOTIFICATIONS
  // ===========================================
  
  // Payment received notification
  socket.on('notification:payment-received', async (data) => {
    try {
      const { payment, project, client } = data;

      // Notify project manager
      await handleSendNotification({
        userId: project.projectManager,
        type: 'success',
        category: 'payment',
        title: 'Payment Received',
        message: `Payment of $${payment.amount} received from ${client.name} for project ${project.name}`,
        link: `/projects/${project._id}`,
        metadata: {
          projectId: project._id,
          clientId: client._id,
          amount: payment.amount
        }
      });

      // Notify admins
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const admin of admins) {
        await handleSendNotification({
          userId: admin._id,
          type: 'success',
          category: 'payment',
          title: 'Payment Received',
          message: `Payment of $${payment.amount} received from ${client.name}`,
          link: `/projects/${project._id}`,
          metadata: {
            projectId: project._id,
            clientId: client._id,
            amount: payment.amount
          }
        });
      }

    } catch (error) {
      console.error('❌ Payment received notification error:', error);
    }
  });

  // ===========================================
  // DEADLINE NOTIFICATIONS
  // ===========================================
  
  // Deadline approaching notification
  socket.on('notification:deadline-approaching', async (data) => {
    try {
      const { project, daysLeft, teamMembers } = data;

      for (const memberId of teamMembers) {
        await handleSendNotification({
          userId: memberId,
          type: 'warning',
          category: 'deadline',
          title: 'Project Deadline Approaching',
          message: `Project "${project.name}" deadline is in ${daysLeft} days`,
          link: `/projects/${project._id}`,
          priority: daysLeft <= 2 ? 'high' : 'medium',
          metadata: {
            projectId: project._id,
            daysLeft
          }
        });
      }

    } catch (error) {
      console.error('❌ Deadline approaching notification error:', error);
    }
  });

  // ===========================================
  // HELPER FUNCTION TO SEND NOTIFICATION
  // ===========================================
  const handleSendNotification = async (data) => {
    try {
      const { userId, type, category, title, message, link, priority = 'medium', metadata = {} } = data;

      // Create notification in database
      const notification = await Notification.create({
        user: userId,
        type,
        category,
        priority,
        title,
        message,
        shortMessage: message.length > 100 ? message.substring(0, 97) + '...' : message,
        actionUrl: link,
        metadata,
        createdAt: new Date()
      });

      // Send real-time if user online
      const userSocket = onlineUsers.get(userId.toString());
      if (userSocket) {
        io.to(userSocket.socketId).emit('notification:new', {
          notification,
          timestamp: new Date()
        });

        // Update unread count
        const unreadCount = await Notification.countDocuments({
          user: userId,
          isRead: false
        });

        io.to(userSocket.socketId).emit('notification:unread-count', {
          count: unreadCount
        });
      }

      return notification;
    } catch (error) {
      console.error('❌ Helper notification error:', error);
      throw error;
    }
  };

  // Make helper available
  socket.handleSendNotification = handleSendNotification;

  // Log successful initialization
  console.log(`✅ Notification handler initialized for socket ${socket.id}`);
};