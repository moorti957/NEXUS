const Project = require('../../models/Project');
const User = require('../../models/User');
const Client = require('../../models/Client');
const Notification = require('../../models/Notification');

/**
 * Project Handler - Manages all real-time project functionality
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Connected socket instance
 * @param {Map} onlineUsers - Map of online users
 */
module.exports = (io, socket, onlineUsers) => {
  
  // ===========================================
  // PROJECT ROOM MANAGEMENT
  // ===========================================

  /**
   * Join a project room
   */
  socket.on('project:join', async (data) => {
    try {
      const { projectId } = data;

      if (!projectId) {
        return socket.emit('project:error', { 
          message: 'Project ID is required' 
        });
      }

      // Check if user has access to this project
      const project = await Project.findById(projectId)
        .populate('client', 'name company')
        .populate('projectManager', 'name email')
        .populate('teamMembers.user', 'name email avatar');

      if (!project) {
        return socket.emit('project:error', { 
          message: 'Project not found' 
        });
      }

      // Check if user is team member, project manager, or admin
      const isTeamMember = project.teamMembers.some(
        member => member.user._id.toString() === socket.user._id.toString()
      );
      const isProjectManager = project.projectManager?._id.toString() === socket.user._id.toString();
      const isAdmin = socket.user.role === 'admin';

      if (!isTeamMember && !isProjectManager && !isAdmin) {
        return socket.emit('project:error', { 
          message: 'You do not have access to this project' 
        });
      }

      // Join the project room
      socket.join(`project:${projectId}`);
      
      console.log(`📊 User ${socket.user.name} joined project room: ${project.name} (${projectId})`);

      // Send project data to user
      socket.emit('project:joined', {
        success: true,
        projectId,
        project: {
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          progress: project.progress,
          deadline: project.deadline,
          client: project.client,
          projectManager: project.projectManager,
          teamMembers: project.teamMembers
        }
      });

      // Notify others in the project room
      socket.to(`project:${projectId}`).emit('project:user-joined', {
        userId: socket.user._id,
        name: socket.user.name,
        role: socket.user.role,
        avatar: socket.user.avatar,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Project Join Error:', error);
      socket.emit('project:error', { 
        message: 'Error joining project room',
        error: error.message 
      });
    }
  });

  /**
   * Leave a project room
   */
  socket.on('project:leave', async (data) => {
    try {
      const { projectId } = data;

      socket.leave(`project:${projectId}`);
      
      console.log(`📊 User ${socket.user.name} left project room ${projectId}`);

      // Notify others
      socket.to(`project:${projectId}`).emit('project:user-left', {
        userId: socket.user._id,
        name: socket.user.name,
        timestamp: new Date()
      });

      socket.emit('project:left', {
        success: true,
        projectId
      });

    } catch (error) {
      console.error('Project Leave Error:', error);
      socket.emit('project:error', { 
        message: 'Error leaving project room',
        error: error.message 
      });
    }
  });

  // ===========================================
  // PROJECT CRUD OPERATIONS
  // ===========================================

  /**
   * Project created
   */
  socket.on('project:created', async (data) => {
    try {
      const { project } = data;

      // Notify all admins
      io.to('admins').emit('project:new', {
        project: {
          id: project._id,
          name: project.name,
          status: project.status,
          client: project.clientName,
          createdBy: socket.user.name,
          createdAt: new Date()
        }
      });

      // Notify project manager if assigned
      if (project.projectManager) {
        const pmSocket = onlineUsers.get(project.projectManager.toString());
        if (pmSocket) {
          io.to(pmSocket.socketId).emit('project:assigned', {
            projectId: project._id,
            projectName: project.name,
            role: 'Project Manager',
            assignedBy: socket.user.name
          });
        }

        // Create notification
        await Notification.create({
          user: project.projectManager,
          type: 'info',
          category: 'project',
          title: 'New Project Assigned',
          message: `You have been assigned as project manager for: ${project.name}`,
          actionUrl: `/projects/${project._id}`
        });
      }

      console.log(`📊 New project created: ${project.name} by ${socket.user.name}`);

    } catch (error) {
      console.error('Project Created Error:', error);
    }
  });

  /**
   * Project updated
   */
  socket.on('project:updated', async (data) => {
    try {
      const { projectId, updates, project } = data;

      // Get full project details for notification
      const fullProject = await Project.findById(projectId)
        .populate('teamMembers.user', 'name email')
        .populate('client', 'name');

      if (!fullProject) return;

      // Prepare notification message
      const changedFields = Object.keys(updates).join(', ');
      
      // Notify all team members
      fullProject.teamMembers.forEach(async (member) => {
        if (member.user._id.toString() !== socket.user._id.toString()) {
          const memberSocket = onlineUsers.get(member.user._id.toString());
          if (memberSocket) {
            io.to(memberSocket.socketId).emit('project:update', {
              projectId,
              projectName: fullProject.name,
              updates,
              changedFields,
              updatedBy: socket.user.name,
              timestamp: new Date()
            });
          }

          // Create notification
          await Notification.create({
            user: member.user._id,
            type: 'info',
            category: 'project',
            title: 'Project Updated',
            message: `Project "${fullProject.name}" was updated: ${changedFields}`,
            actionUrl: `/projects/${projectId}`
          });
        }
      });

      // Notify project manager
      if (fullProject.projectManager && 
          fullProject.projectManager.toString() !== socket.user._id.toString()) {
        const pmSocket = onlineUsers.get(fullProject.projectManager.toString());
        if (pmSocket) {
          io.to(pmSocket.socketId).emit('project:update', {
            projectId,
            projectName: fullProject.name,
            updates,
            changedFields,
            updatedBy: socket.user.name,
            timestamp: new Date()
          });
        }
      }

      // Notify client if major updates (status change, completion)
      if (updates.status || updates.progress === 100) {
        const clientSocket = onlineUsers.get(fullProject.client?._id?.toString());
        if (clientSocket) {
          io.to(clientSocket.socketId).emit('project:client-update', {
            projectId,
            projectName: fullProject.name,
            status: fullProject.status,
            progress: fullProject.progress,
            updatedBy: socket.user.name
          });
        }
      }

      // Emit to project room
      io.to(`project:${projectId}`).emit('project:updated', {
        projectId,
        updates,
        project: fullProject,
        updatedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Project ${fullProject.name} updated by ${socket.user.name}`);

    } catch (error) {
      console.error('Project Updated Error:', error);
    }
  });

  /**
   * Project deleted
   */
  socket.on('project:deleted', async (data) => {
    try {
      const { projectId, projectName } = data;

      // Notify all team members
      const project = await Project.findById(projectId)
        .populate('teamMembers.user', 'name email');

      if (project) {
        project.teamMembers.forEach(async (member) => {
          const memberSocket = onlineUsers.get(member.user._id.toString());
          if (memberSocket) {
            io.to(memberSocket.socketId).emit('project:deleted', {
              projectId,
              projectName,
              deletedBy: socket.user.name,
              timestamp: new Date()
            });
          }

          // Create notification
          await Notification.create({
            user: member.user._id,
            type: 'warning',
            category: 'project',
            title: 'Project Deleted',
            message: `Project "${projectName}" has been deleted`,
            priority: 'high'
          });
        });
      }

      // Notify project room
      io.to(`project:${projectId}`).emit('project:deleted', {
        projectId,
        projectName,
        deletedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Project ${projectName} deleted by ${socket.user.name}`);

    } catch (error) {
      console.error('Project Deleted Error:', error);
    }
  });

  // ===========================================
  // PROJECT STATUS UPDATES
  // ===========================================

  /**
   * Project status changed
   */
  socket.on('project:status-changed', async (data) => {
    try {
      const { projectId, oldStatus, newStatus, projectName } = data;

      const project = await Project.findById(projectId)
        .populate('teamMembers.user', 'name email');

      if (!project) return;

      const statusMessage = `Project status changed from ${oldStatus} to ${newStatus}`;

      // Notify all team members
      project.teamMembers.forEach(async (member) => {
        if (member.user._id.toString() !== socket.user._id.toString()) {
          const memberSocket = onlineUsers.get(member.user._id.toString());
          if (memberSocket) {
            io.to(memberSocket.socketId).emit('project:status-change', {
              projectId,
              projectName,
              oldStatus,
              newStatus,
              changedBy: socket.user.name,
              timestamp: new Date()
            });
          }

          // Create notification
          await Notification.create({
            user: member.user._id,
            type: newStatus === 'Completed' ? 'success' : 'info',
            category: 'project',
            title: 'Project Status Updated',
            message: `${projectName}: ${statusMessage}`,
            actionUrl: `/projects/${projectId}`
          });
        }
      });

      // Special notification for completed projects
      if (newStatus === 'Completed') {
        // Notify client
        if (project.client) {
          const clientSocket = onlineUsers.get(project.client.toString());
          if (clientSocket) {
            io.to(clientSocket.socketId).emit('project:completed', {
              projectId,
              projectName,
              completedBy: socket.user.name,
              completedAt: new Date()
            });
          }
        }

        // Notify admins
        io.to('admins').emit('project:completed', {
          projectId,
          projectName,
          completedBy: socket.user.name,
          completedAt: new Date()
        });
      }

      // Emit to project room
      io.to(`project:${projectId}`).emit('project:status-changed', {
        projectId,
        projectName,
        oldStatus,
        newStatus,
        changedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Project ${projectName} status changed: ${oldStatus} → ${newStatus}`);

    } catch (error) {
      console.error('Project Status Change Error:', error);
    }
  });

  /**
   * Project progress updated
   */
  socket.on('project:progress-updated', async (data) => {
    try {
      const { projectId, oldProgress, newProgress, projectName } = data;

      // Emit to project room
      io.to(`project:${projectId}`).emit('project:progress-updated', {
        projectId,
        projectName,
        oldProgress,
        newProgress,
        updatedBy: socket.user.name,
        timestamp: new Date()
      });

      // If progress is 100%, auto-complete
      if (newProgress === 100) {
        io.to(`project:${projectId}`).emit('project:auto-completed', {
          projectId,
          projectName,
          completedBy: 'System',
          timestamp: new Date()
        });
      }

      console.log(`📊 Project ${projectName} progress: ${oldProgress}% → ${newProgress}%`);

    } catch (error) {
      console.error('Project Progress Update Error:', error);
    }
  });

  // ===========================================
  // TEAM MANAGEMENT
  // ===========================================

  /**
   * Team member added
   */
  socket.on('project:team-member-added', async (data) => {
    try {
      const { projectId, member, projectName, role } = data;

      // Notify the added member
      const memberSocket = onlineUsers.get(member.user.toString());
      if (memberSocket) {
        io.to(memberSocket.socketId).emit('project:added-to-team', {
          projectId,
          projectName,
          role,
          addedBy: socket.user.name,
          timestamp: new Date()
        });
      }

      // Create notification
      await Notification.create({
        user: member.user,
        type: 'success',
        category: 'project',
        title: 'Added to Project',
        message: `You have been added to project "${projectName}" as ${role}`,
        actionUrl: `/projects/${projectId}`
      });

      // Notify project room
      io.to(`project:${projectId}`).emit('project:team-member-added', {
        projectId,
        member,
        role,
        addedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Team member added to ${projectName} by ${socket.user.name}`);

    } catch (error) {
      console.error('Team Member Added Error:', error);
    }
  });

  /**
   * Team member removed
   */
  socket.on('project:team-member-removed', async (data) => {
    try {
      const { projectId, memberId, memberName, projectName } = data;

      // Notify the removed member
      const memberSocket = onlineUsers.get(memberId);
      if (memberSocket) {
        io.to(memberSocket.socketId).emit('project:removed-from-team', {
          projectId,
          projectName,
          removedBy: socket.user.name,
          timestamp: new Date()
        });
      }

      // Create notification
      await Notification.create({
        user: memberId,
        type: 'warning',
        category: 'project',
        title: 'Removed from Project',
        message: `You have been removed from project "${projectName}"`,
        priority: 'medium'
      });

      // Notify project room
      io.to(`project:${projectId}`).emit('project:team-member-removed', {
        projectId,
        memberId,
        memberName,
        removedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Team member ${memberName} removed from ${projectName}`);

    } catch (error) {
      console.error('Team Member Removed Error:', error);
    }
  });

  /**
   * Team member role updated
   */
  socket.on('project:team-member-role-updated', async (data) => {
    try {
      const { projectId, memberId, oldRole, newRole, projectName } = data;

      // Notify the member
      const memberSocket = onlineUsers.get(memberId);
      if (memberSocket) {
        io.to(memberSocket.socketId).emit('project:role-updated', {
          projectId,
          projectName,
          oldRole,
          newRole,
          updatedBy: socket.user.name,
          timestamp: new Date()
        });
      }

      // Create notification
      await Notification.create({
        user: memberId,
        type: 'info',
        category: 'project',
        title: 'Project Role Updated',
        message: `Your role in "${projectName}" changed from ${oldRole} to ${newRole}`,
        actionUrl: `/projects/${projectId}`
      });

      // Notify project room
      io.to(`project:${projectId}`).emit('project:team-member-role-updated', {
        projectId,
        memberId,
        oldRole,
        newRole,
        updatedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Team member role updated in ${projectName}: ${oldRole} → ${newRole}`);

    } catch (error) {
      console.error('Team Member Role Update Error:', error);
    }
  });

  // ===========================================
  // TASK MANAGEMENT
  // ===========================================

  /**
   * Task added
   */
  socket.on('project:task-added', async (data) => {
    try {
      const { projectId, task, projectName } = data;

      // Notify assigned user if any
      if (task.assignedTo) {
        const assignedSocket = onlineUsers.get(task.assignedTo.toString());
        if (assignedSocket) {
          io.to(assignedSocket.socketId).emit('project:task-assigned', {
            projectId,
            projectName,
            task: {
              id: task._id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              dueDate: task.dueDate
            },
            assignedBy: socket.user.name,
            timestamp: new Date()
          });
        }

        // Create notification
        await Notification.create({
          user: task.assignedTo,
          type: task.priority === 'High' ? 'alert' : 'info',
          category: 'task',
          title: 'New Task Assigned',
          message: `Task "${task.title}" assigned in project "${projectName}"`,
          actionUrl: `/projects/${projectId}`,
          priority: task.priority === 'High' ? 'high' : 'medium'
        });
      }

      // Notify project room
      io.to(`project:${projectId}`).emit('project:task-added', {
        projectId,
        task,
        addedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Task added to ${projectName}: ${task.title}`);

    } catch (error) {
      console.error('Task Added Error:', error);
    }
  });

  /**
   * Task updated
   */
  socket.on('project:task-updated', async (data) => {
    try {
      const { projectId, taskId, updates, task, projectName } = data;

      // Notify assigned user if changed
      if (updates.assignedTo && updates.assignedTo !== task.assignedTo) {
        const newAssigneeSocket = onlineUsers.get(updates.assignedTo.toString());
        if (newAssigneeSocket) {
          io.to(newAssigneeSocket.socketId).emit('project:task-assigned', {
            projectId,
            projectName,
            task: {
              id: taskId,
              title: task.title
            },
            assignedBy: socket.user.name,
            timestamp: new Date()
          });
        }
      }

      // Notify project room
      io.to(`project:${projectId}`).emit('project:task-updated', {
        projectId,
        taskId,
        updates,
        updatedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Task updated in ${projectName}: ${task.title}`);

    } catch (error) {
      console.error('Task Updated Error:', error);
    }
  });

  /**
   * Task completed
   */
  socket.on('project:task-completed', async (data) => {
    try {
      const { projectId, taskId, taskName, projectName, assignedTo } = data;

      // Notify project manager
      const project = await Project.findById(projectId).select('projectManager');
      if (project && project.projectManager) {
        const pmSocket = onlineUsers.get(project.projectManager.toString());
        if (pmSocket) {
          io.to(pmSocket.socketId).emit('project:task-completed', {
            projectId,
            projectName,
            taskId,
            taskName,
            completedBy: socket.user.name,
            timestamp: new Date()
          });
        }
      }

      // Notify assigner (if different from completer)
      if (assignedTo && assignedTo.toString() !== socket.user._id.toString()) {
        const assigneeSocket = onlineUsers.get(assignedTo.toString());
        if (assigneeSocket) {
          io.to(assigneeSocket.socketId).emit('project:task-completed', {
            projectId,
            projectName,
            taskId,
            taskName,
            completedBy: socket.user.name,
            timestamp: new Date()
          });
        }
      }

      // Create notification for project manager
      if (project && project.projectManager) {
        await Notification.create({
          user: project.projectManager,
          type: 'success',
          category: 'task',
          title: 'Task Completed',
          message: `Task "${taskName}" completed in project "${projectName}"`,
          actionUrl: `/projects/${projectId}`
        });
      }

      // Notify project room
      io.to(`project:${projectId}`).emit('project:task-completed', {
        projectId,
        taskId,
        taskName,
        completedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Task completed in ${projectName}: ${taskName}`);

    } catch (error) {
      console.error('Task Completed Error:', error);
    }
  });

  /**
   * Task deleted
   */
  socket.on('project:task-deleted', async (data) => {
    try {
      const { projectId, taskId, taskName, projectName, assignedTo } = data;

      // Notify assigned user if any
      if (assignedTo) {
        const assignedSocket = onlineUsers.get(assignedTo.toString());
        if (assignedSocket) {
          io.to(assignedSocket.socketId).emit('project:task-deleted', {
            projectId,
            projectName,
            taskId,
            taskName,
            deletedBy: socket.user.name,
            timestamp: new Date()
          });
        }
      }

      // Notify project room
      io.to(`project:${projectId}`).emit('project:task-deleted', {
        projectId,
        taskId,
        taskName,
        deletedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Task deleted from ${projectName}: ${taskName}`);

    } catch (error) {
      console.error('Task Deleted Error:', error);
    }
  });

  // ===========================================
  // MILESTONE MANAGEMENT
  // ===========================================

  /**
   * Milestone added
   */
  socket.on('project:milestone-added', async (data) => {
    try {
      const { projectId, milestone, projectName } = data;

      // Notify project room
      io.to(`project:${projectId}`).emit('project:milestone-added', {
        projectId,
        milestone,
        addedBy: socket.user.name,
        timestamp: new Date()
      });

      console.log(`📊 Milestone added to ${projectName}: ${milestone.title}`);

    } catch (error) {
      console.error('Milestone Added Error:', error);
    }
  });

  /**
   * Milestone completed
   */
  socket.on('project:milestone-completed', async (data) => {
    try {
      const { projectId, milestoneId, milestoneTitle, projectName } = data;

      // Get project for client info
      const project = await Project.findById(projectId)
        .populate('client', 'name email');

      // Notify project room with celebration
      io.to(`project:${projectId}`).emit('project:milestone-completed', {
        projectId,
        milestoneId,
        milestoneTitle,
        projectName,
        completedBy: socket.user.name,
        timestamp: new Date(),
        celebration: true
      });

      // Notify client if milestone has payment
      if (project && project.client) {
        const clientSocket = onlineUsers.get(project.client._id.toString());
        if (clientSocket) {
          io.to(clientSocket.socketId).emit('project:milestone-completed', {
            projectId,
            projectName,
            milestoneTitle,
            message: `Milestone "${milestoneTitle}" completed!`
          });
        }
      }

      // Create notifications for team
      const teamMembers = project?.teamMembers || [];
      teamMembers.forEach(async (member) => {
        if (member.user.toString() !== socket.user._id.toString()) {
          await Notification.create({
            user: member.user,
            type: 'success',
            category: 'project',
            title: '🎉 Milestone Achieved!',
            message: `Milestone "${milestoneTitle}" completed in "${projectName}"`,
            actionUrl: `/projects/${projectId}`
          });
        }
      });

      console.log(`📊 Milestone completed in ${projectName}: ${milestoneTitle}`);

    } catch (error) {
      console.error('Milestone Completed Error:', error);
    }
  });

  // ===========================================
  // COMMENT & DISCUSSION
  // ===========================================

  /**
   * Comment added to project
   */
  socket.on('project:comment-added', async (data) => {
    try {
      const { projectId, comment, projectName } = data;

      // Get project to notify team
      const project = await Project.findById(projectId)
        .populate('teamMembers.user', 'name email');

      // Notify all team members except commenter
      project.teamMembers.forEach(async (member) => {
        if (member.user._id.toString() !== socket.user._id.toString()) {
          const memberSocket = onlineUsers.get(member.user._id.toString());
          if (memberSocket) {
            io.to(memberSocket.socketId).emit('project:new-comment', {
              projectId,
              projectName,
              comment,
              commentedBy: socket.user.name,
              timestamp: new Date()
            });
          }

          // Create notification
          await Notification.create({
            user: member.user._id,
            type: 'info',
            category: 'project',
            title: 'New Comment',
            message: `${socket.user.name} commented on "${projectName}"`,
            actionUrl: `/projects/${projectId}`
          });
        }
      });

      // Notify project manager
      if (project.projectManager && 
          project.projectManager.toString() !== socket.user._id.toString()) {
        const pmSocket = onlineUsers.get(project.projectManager.toString());
        if (pmSocket) {
          io.to(pmSocket.socketId).emit('project:new-comment', {
            projectId,
            projectName,
            comment,
            commentedBy: socket.user.name,
            timestamp: new Date()
          });
        }
      }

      // Emit to project room
      io.to(`project:${projectId}`).emit('project:comment-added', {
        projectId,
        comment,
        commentedBy: socket.user.name,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Comment Added Error:', error);
    }
  });

  // ===========================================
  // PROJECT TIMELINE
  // ===========================================

  /**
   * Timeline event added
   */
  socket.on('project:timeline-event', async (data) => {
    try {
      const { projectId, event, description, projectName } = data;

      // Emit to project room
      io.to(`project:${projectId}`).emit('project:timeline-event', {
        projectId,
        event,
        description,
        createdBy: socket.user.name,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Timeline Event Error:', error);
    }
  });

  // ===========================================
  // DEADLINE ALERTS
  // ===========================================

  /**
   * Check and send deadline alerts
   */
  socket.on('project:check-deadlines', async () => {
    try {
      const now = new Date();
      const threeDaysLater = new Date(now);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      const projects = await Project.find({
        status: { $ne: 'Completed' },
        deadline: { $gte: now, $lte: threeDaysLater }
      }).populate('projectManager', 'name email')
        .populate('teamMembers.user', 'name email');

      projects.forEach(project => {
        const daysLeft = Math.ceil((project.deadline - now) / (1000 * 60 * 60 * 24));
        
        // Notify project manager
        if (project.projectManager) {
          const pmSocket = onlineUsers.get(project.projectManager._id.toString());
          if (pmSocket) {
            io.to(pmSocket.socketId).emit('project:deadline-alert', {
              projectId: project._id,
              projectName: project.name,
              deadline: project.deadline,
              daysLeft,
              message: `Project "${project.name}" deadline in ${daysLeft} days`
            });
          }
        }

        // Notify team members
        project.teamMembers.forEach(member => {
          const memberSocket = onlineUsers.get(member.user._id.toString());
          if (memberSocket) {
            io.to(memberSocket.socketId).emit('project:deadline-alert', {
              projectId: project._id,
              projectName: project.name,
              deadline: project.deadline,
              daysLeft,
              message: `Project "${project.name}" deadline in ${daysLeft} days`
            });
          }
        });
      });

    } catch (error) {
      console.error('Deadline Check Error:', error);
    }
  });

  // ===========================================
  // PROJECT STATISTICS
  // ===========================================

  /**
   * Request project statistics
   */
  socket.on('project:get-stats', async (data) => {
    try {
      const { projectId } = data;

      const stats = await Project.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(projectId) } },
        {
          $project: {
            totalTasks: { $size: '$tasks' },
            completedTasks: {
              $size: {
                $filter: {
                  input: '$tasks',
                  as: 'task',
                  cond: { $eq: ['$$task.status', 'Done'] }
                }
              }
            },
            totalMilestones: { $size: '$milestones' },
            completedMilestones: {
              $size: {
                $filter: {
                  input: '$milestones',
                  as: 'm',
                  cond: { $eq: ['$$m.status', 'Completed'] }
                }
              }
            }
          }
        }
      ]);

      socket.emit('project:stats', {
        projectId,
        stats: stats[0] || {
          totalTasks: 0,
          completedTasks: 0,
          totalMilestones: 0,
          completedMilestones: 0
        }
      });

    } catch (error) {
      console.error('Project Stats Error:', error);
    }
  });

  // ===========================================
  // ERROR HANDLING
  // ===========================================

  // Error handler for project events
  socket.on('project:error', (error) => {
    console.error('Project client error:', error);
  });

  console.log(`✅ Project handler initialized for user: ${socket.user?.name}`);
};