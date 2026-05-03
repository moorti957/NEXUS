import socketService from '../index';

/**
 * Project Events Handler
 * Manages all real-time project-related socket events
 */

// ===========================================
// PROJECT CRUD EVENTS
// ===========================================

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @param {Function} callback - Optional callback
 */
export const emitCreateProject = (projectData, callback) => {
  socketService.emit('project:create', {
    ...projectData,
    createdBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log('📁 Project creation emitted:', projectData.name);
};

/**
 * Update project details
 * @param {string} projectId - Project ID
 * @param {Object} updates - Updated fields
 * @param {Function} callback - Optional callback
 */
export const emitUpdateProject = (projectId, updates, callback) => {
  socketService.emit('project:update', {
    projectId,
    updates,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`📁 Project update emitted: ${projectId}`);
};

/**
 * Delete a project
 * @param {string} projectId - Project ID
 * @param {Function} callback - Optional callback
 */
export const emitDeleteProject = (projectId, callback) => {
  socketService.emit('project:delete', {
    projectId,
    deletedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`📁 Project deletion emitted: ${projectId}`);
};

/**
 * Archive a project
 * @param {string} projectId - Project ID
 * @param {Function} callback - Optional callback
 */
export const emitArchiveProject = (projectId, callback) => {
  socketService.emit('project:archive', {
    projectId,
    archivedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

/**
 * Restore an archived project
 * @param {string} projectId - Project ID
 * @param {Function} callback - Optional callback
 */
export const emitRestoreProject = (projectId, callback) => {
  socketService.emit('project:restore', {
    projectId,
    restoredBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

// ===========================================
// PROJECT STATUS EVENTS
// ===========================================

/**
 * Update project status
 * @param {string} projectId - Project ID
 * @param {string} newStatus - New status (Planning, In Progress, Review, Completed, On Hold, Cancelled)
 * @param {string} oldStatus - Previous status
 * @param {Function} callback - Optional callback
 */
export const emitUpdateProjectStatus = (projectId, newStatus, oldStatus, callback) => {
  socketService.emit('project:status-update', {
    projectId,
    newStatus,
    oldStatus,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`📊 Project status updated: ${oldStatus} → ${newStatus}`);
};

/**
 * Update project progress
 * @param {string} projectId - Project ID
 * @param {number} progress - Progress percentage (0-100)
 * @param {Function} callback - Optional callback
 */
export const emitUpdateProjectProgress = (projectId, progress, callback) => {
  socketService.emit('project:progress-update', {
    projectId,
    progress,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

/**
 * Update project priority
 * @param {string} projectId - Project ID
 * @param {string} priority - New priority (Low, Medium, High, Critical)
 * @param {Function} callback - Optional callback
 */
export const emitUpdateProjectPriority = (projectId, priority, callback) => {
  socketService.emit('project:priority-update', {
    projectId,
    priority,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

// ===========================================
// PROJECT ROOM MANAGEMENT
// ===========================================

/**
 * Join a project room
 * @param {string} projectId - Project ID
 */
export const emitJoinProject = (projectId) => {
  socketService.emit('project:join', projectId);
  console.log(`🚪 Joined project room: ${projectId}`);
};

/**
 * Leave a project room
 * @param {string} projectId - Project ID
 */
export const emitLeaveProject = (projectId) => {
  socketService.emit('project:leave', projectId);
  console.log(`🚪 Left project room: ${projectId}`);
};

// ===========================================
// TEAM MANAGEMENT EVENTS
// ===========================================

/**
 * Add team member to project
 * @param {string} projectId - Project ID
 * @param {Object} member - Team member data
 * @param {string} member.userId - User ID
 * @param {string} member.role - Member role
 * @param {number} member.hoursAllocated - Allocated hours
 * @param {Function} callback - Optional callback
 */
export const emitAddTeamMember = (projectId, member, callback) => {
  socketService.emit('project:add-member', {
    projectId,
    member,
    addedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`👤 Team member added to project ${projectId}:`, member);
};

/**
 * Remove team member from project
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID to remove
 * @param {Function} callback - Optional callback
 */
export const emitRemoveTeamMember = (projectId, userId, callback) => {
  socketService.emit('project:remove-member', {
    projectId,
    userId,
    removedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

/**
 * Update team member role
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @param {string} newRole - New role
 * @param {Function} callback - Optional callback
 */
export const emitUpdateTeamMemberRole = (projectId, userId, newRole, callback) => {
  socketService.emit('project:update-member-role', {
    projectId,
    userId,
    newRole,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

// ===========================================
// MILESTONE EVENTS
// ===========================================

/**
 * Add milestone to project
 * @param {string} projectId - Project ID
 * @param {Object} milestone - Milestone data
 * @param {Function} callback - Optional callback
 */
export const emitAddMilestone = (projectId, milestone, callback) => {
  socketService.emit('project:add-milestone', {
    projectId,
    milestone,
    addedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`🏆 Milestone added to project ${projectId}:`, milestone.title);
};

/**
 * Update milestone
 * @param {string} projectId - Project ID
 * @param {string} milestoneId - Milestone ID
 * @param {Object} updates - Updated fields
 * @param {Function} callback - Optional callback
 */
export const emitUpdateMilestone = (projectId, milestoneId, updates, callback) => {
  socketService.emit('project:update-milestone', {
    projectId,
    milestoneId,
    updates,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

/**
 * Complete milestone
 * @param {string} projectId - Project ID
 * @param {string} milestoneId - Milestone ID
 * @param {Function} callback - Optional callback
 */
export const emitCompleteMilestone = (projectId, milestoneId, callback) => {
  socketService.emit('project:complete-milestone', {
    projectId,
    milestoneId,
    completedBy: socketService.getSocketId(),
    completedAt: new Date(),
    timestamp: new Date()
  }, callback);
  console.log(`✅ Milestone completed: ${milestoneId}`);
};

/**
 * Delete milestone
 * @param {string} projectId - Project ID
 * @param {string} milestoneId - Milestone ID
 * @param {Function} callback - Optional callback
 */
export const emitDeleteMilestone = (projectId, milestoneId, callback) => {
  socketService.emit('project:delete-milestone', {
    projectId,
    milestoneId,
    deletedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

// ===========================================
// TASK MANAGEMENT EVENTS
// ===========================================

/**
 * Add task to project
 * @param {string} projectId - Project ID
 * @param {Object} task - Task data
 * @param {Function} callback - Optional callback
 */
export const emitAddTask = (projectId, task, callback) => {
  socketService.emit('project:add-task', {
    projectId,
    task,
    addedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`📋 Task added to project ${projectId}:`, task.title);
};

/**
 * Update task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {Object} updates - Updated fields
 * @param {Function} callback - Optional callback
 */
export const emitUpdateTask = (projectId, taskId, updates, callback) => {
  socketService.emit('project:update-task', {
    projectId,
    taskId,
    updates,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

/**
 * Complete task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {Function} callback - Optional callback
 */
export const emitCompleteTask = (projectId, taskId, callback) => {
  socketService.emit('project:complete-task', {
    projectId,
    taskId,
    completedBy: socketService.getSocketId(),
    completedAt: new Date(),
    timestamp: new Date()
  }, callback);
  console.log(`✅ Task completed: ${taskId}`);
};

/**
 * Delete task
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {Function} callback - Optional callback
 */
export const emitDeleteTask = (projectId, taskId, callback) => {
  socketService.emit('project:delete-task', {
    projectId,
    taskId,
    deletedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

/**
 * Assign task to user
 * @param {string} projectId - Project ID
 * @param {string} taskId - Task ID
 * @param {string} assignedTo - User ID
 * @param {Function} callback - Optional callback
 */
export const emitAssignTask = (projectId, taskId, assignedTo, callback) => {
  socketService.emit('project:assign-task', {
    projectId,
    taskId,
    assignedTo,
    assignedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`👤 Task ${taskId} assigned to user ${assignedTo}`);
};

// ===========================================
// PAYMENT EVENTS
// ===========================================

/**
 * Add payment to project
 * @param {string} projectId - Project ID
 * @param {Object} payment - Payment data
 * @param {Function} callback - Optional callback
 */
export const emitAddPayment = (projectId, payment, callback) => {
  socketService.emit('project:add-payment', {
    projectId,
    payment,
    addedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`💰 Payment added to project ${projectId}: $${payment.amount}`);
};

/**
 * Update payment status
 * @param {string} projectId - Project ID
 * @param {string} paymentId - Payment ID
 * @param {string} status - New status
 * @param {Function} callback - Optional callback
 */
export const emitUpdatePaymentStatus = (projectId, paymentId, status, callback) => {
  socketService.emit('project:update-payment', {
    projectId,
    paymentId,
    status,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

// ===========================================
// COMMENT/DISCUSSION EVENTS
// ===========================================

/**
 * Add comment to project
 * @param {string} projectId - Project ID
 * @param {string} content - Comment content
 * @param {Function} callback - Optional callback
 */
export const emitAddComment = (projectId, content, callback) => {
  socketService.emit('project:add-comment', {
    projectId,
    content,
    userId: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`💬 Comment added to project ${projectId}`);
};

/**
 * Delete comment
 * @param {string} projectId - Project ID
 * @param {string} commentId - Comment ID
 * @param {Function} callback - Optional callback
 */
export const emitDeleteComment = (projectId, commentId, callback) => {
  socketService.emit('project:delete-comment', {
    projectId,
    commentId,
    deletedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

// ===========================================
// FILE ATTACHMENT EVENTS
// ===========================================

/**
 * Upload file to project
 * @param {string} projectId - Project ID
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback
 * @param {Function} onComplete - Complete callback
 */
export const emitUploadProjectFile = (projectId, file, onProgress, onComplete) => {
  const reader = new FileReader();
  
  reader.onprogress = (event) => {
    if (event.lengthComputable && onProgress) {
      const percentLoaded = (event.loaded / event.total) * 100;
      onProgress(percentLoaded);
    }
  };

  reader.onload = () => {
    socketService.emit('project:upload-file', {
      projectId,
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
      data: reader.result,
      uploadedBy: socketService.getSocketId(),
      timestamp: new Date()
    }, (response) => {
      if (onComplete) {
        onComplete(response);
      }
    });
  };

  reader.readAsDataURL(file);
};

/**
 * Delete file from project
 * @param {string} projectId - Project ID
 * @param {string} fileId - File ID
 * @param {Function} callback - Optional callback
 */
export const emitDeleteProjectFile = (projectId, fileId, callback) => {
  socketService.emit('project:delete-file', {
    projectId,
    fileId,
    deletedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
};

// ===========================================
// DEADLINE EVENTS
// ===========================================

/**
 * Extend project deadline
 * @param {string} projectId - Project ID
 * @param {Date} newDeadline - New deadline date
 * @param {Function} callback - Optional callback
 */
export const emitExtendDeadline = (projectId, newDeadline, callback) => {
  socketService.emit('project:extend-deadline', {
    projectId,
    newDeadline,
    extendedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`📅 Project deadline extended: ${projectId}`);
};

/**
 * Notify about approaching deadline
 * @param {string} projectId - Project ID
 * @param {number} daysLeft - Days remaining
 */
export const emitDeadlineApproaching = (projectId, daysLeft) => {
  socketService.emit('project:deadline-approaching', {
    projectId,
    daysLeft,
    timestamp: new Date()
  });
};

// ===========================================
// BUDGET EVENTS
// ===========================================

/**
 * Update project budget
 * @param {string} projectId - Project ID
 * @param {number} newBudget - New budget amount
 * @param {Function} callback - Optional callback
 */
export const emitUpdateBudget = (projectId, newBudget, callback) => {
  socketService.emit('project:update-budget', {
    projectId,
    newBudget,
    updatedBy: socketService.getSocketId(),
    timestamp: new Date()
  }, callback);
  console.log(`💰 Project budget updated: $${newBudget}`);
};

// ===========================================
// EVENT LISTENERS
// ===========================================

/**
 * Listen for project creation
 * @param {Function} callback - Callback function
 */
export const onProjectCreated = (callback) => {
  socketService.on('project:created', (data) => {
    console.log('📁 New project created:', data.project.name);
    callback(data);
  });
};

/**
 * Listen for project updates
 * @param {Function} callback - Callback function
 */
export const onProjectUpdated = (callback) => {
  socketService.on('project:updated', (data) => {
    console.log(`📁 Project updated: ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for project deletion
 * @param {Function} callback - Callback function
 */
export const onProjectDeleted = (callback) => {
  socketService.on('project:deleted', (data) => {
    console.log(`🗑️ Project deleted: ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for project status updates
 * @param {Function} callback - Callback function
 */
export const onProjectStatusUpdated = (callback) => {
  socketService.on('project:status-updated', (data) => {
    console.log(`📊 Project status updated: ${data.projectId} → ${data.newStatus}`);
    callback(data);
  });
};

/**
 * Listen for project progress updates
 * @param {Function} callback - Callback function
 */
export const onProjectProgressUpdated = (callback) => {
  socketService.on('project:progress-updated', (data) => {
    console.log(`📈 Project progress: ${data.projectId} → ${data.progress}%`);
    callback(data);
  });
};

/**
 * Listen for team member additions
 * @param {Function} callback - Callback function
 */
export const onTeamMemberAdded = (callback) => {
  socketService.on('project:member-added', (data) => {
    console.log(`👤 Team member added to project ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for team member removals
 * @param {Function} callback - Callback function
 */
export const onTeamMemberRemoved = (callback) => {
  socketService.on('project:member-removed', (data) => {
    console.log(`👤 Team member removed from project ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for milestone additions
 * @param {Function} callback - Callback function
 */
export const onMilestoneAdded = (callback) => {
  socketService.on('project:milestone-added', (data) => {
    console.log(`🏆 Milestone added: ${data.milestone.title}`);
    callback(data);
  });
};

/**
 * Listen for milestone completion
 * @param {Function} callback - Callback function
 */
export const onMilestoneCompleted = (callback) => {
  socketService.on('project:milestone-completed', (data) => {
    console.log(`✅ Milestone completed: ${data.milestoneId}`);
    callback(data);
  });
};

/**
 * Listen for task additions
 * @param {Function} callback - Callback function
 */
export const onTaskAdded = (callback) => {
  socketService.on('project:task-added', (data) => {
    console.log(`📋 New task: ${data.task.title}`);
    callback(data);
  });
};

/**
 * Listen for task updates
 * @param {Function} callback - Callback function
 */
export const onTaskUpdated = (callback) => {
  socketService.on('project:task-updated', (data) => {
    console.log(`📋 Task updated: ${data.taskId}`);
    callback(data);
  });
};

/**
 * Listen for task completion
 * @param {Function} callback - Callback function
 */
export const onTaskCompleted = (callback) => {
  socketService.on('project:task-completed', (data) => {
    console.log(`✅ Task completed: ${data.taskId}`);
    callback(data);
  });
};

/**
 * Listen for task assignments
 * @param {Function} callback - Callback function
 */
export const onTaskAssigned = (callback) => {
  socketService.on('project:task-assigned', (data) => {
    console.log(`👤 Task ${data.taskId} assigned to user ${data.assignedTo}`);
    callback(data);
  });
};

/**
 * Listen for payment additions
 * @param {Function} callback - Callback function
 */
export const onPaymentAdded = (callback) => {
  socketService.on('project:payment-added', (data) => {
    console.log(`💰 Payment added: $${data.payment.amount}`);
    callback(data);
  });
};

/**
 * Listen for new comments
 * @param {Function} callback - Callback function
 */
export const onCommentAdded = (callback) => {
  socketService.on('project:comment-added', (data) => {
    console.log(`💬 New comment on project ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for file uploads
 * @param {Function} callback - Callback function
 */
export const onFileUploaded = (callback) => {
  socketService.on('project:file-uploaded', (data) => {
    console.log(`📎
         File uploaded: ${data.filename}`);
    callback(data);
  });
};

/**
 * Listen for deadline extensions
 * @param {Function} callback - Callback function
 */
export const onDeadlineExtended = (callback) => {
  socketService.on('project:deadline-extended', (data) => {
    console.log(`📅 Deadline extended for project ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for deadline approaching alerts
 * @param {Function} callback - Callback function
 */
export const onDeadlineApproaching = (callback) => {
  socketService.on('project:deadline-approaching', (data) => {
    console.log(`⚠️ Deadline approaching: ${data.projectId} (${data.daysLeft} days left)`);
    callback(data);
  });
};

/**
 * Listen for budget updates
 * @param {Function} callback - Callback function
 */
export const onBudgetUpdated = (callback) => {
  socketService.on('project:budget-updated', (data) => {
    console.log(`💰 Budget updated for project ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for project archive events
 * @param {Function} callback - Callback function
 */
export const onProjectArchived = (callback) => {
  socketService.on('project:archived', (data) => {
    console.log(`📦 Project archived: ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for project restore events
 * @param {Function} callback - Callback function
 */
export const onProjectRestored = (callback) => {
  socketService.on('project:restored', (data) => {
    console.log(`🔄 Project restored: ${data.projectId}`);
    callback(data);
  });
};

/**
 * Listen for error events
 * @param {Function} callback - Callback function
 */
export const onProjectError = (callback) => {
  socketService.on('project:error', (data) => {
    console.error('❌ Project error:', data);
    callback(data);
  });
};

// ===========================================
// REMOVE LISTENERS
// ===========================================

/**
 * Remove all project event listeners
 */
export const removeAllProjectListeners = () => {
  socketService.off('project:created');
  socketService.off('project:updated');
  socketService.off('project:deleted');
  socketService.off('project:status-updated');
  socketService.off('project:progress-updated');
  socketService.off('project:member-added');
  socketService.off('project:member-removed');
  socketService.off('project:milestone-added');
  socketService.off('project:milestone-completed');
  socketService.off('project:task-added');
  socketService.off('project:task-updated');
  socketService.off('project:task-completed');
  socketService.off('project:task-assigned');
  socketService.off('project:payment-added');
  socketService.off('project:comment-added');
  socketService.off('project:file-uploaded');
  socketService.off('project:deadline-extended');
  socketService.off('project:deadline-approaching');
  socketService.off('project:budget-updated');
  socketService.off('project:archived');
  socketService.off('project:restored');
  socketService.off('project:error');
  console.log('🧹 All project listeners removed');
};