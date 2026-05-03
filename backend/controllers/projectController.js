const Project = require('../models/Project');
const Client = require('../models/Client');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// ===========================================
// PROJECT CRUD OPERATIONS
// ===========================================

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, category, client, priority, search } = req.query;

    // Build filter query
    let filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (client) filter.client = client;
    if (priority) filter.priority = priority;
    
    // Search by name or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by team member if user is not admin
    if (req.user.role !== 'admin') {
      filter['teamMembers.user'] = req.user._id;
    }

    const projects = await Project.find(filter)
      .populate('client', 'name email company avatar')
      .populate('projectManager', 'name email avatar')
      .populate('teamMembers.user', 'name email avatar role')
      .populate('createdBy', 'name email')
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(filter);

    // Get stats for filtered results
    const stats = await Project.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBudget: { $sum: '$budget' },
          totalPaid: { $sum: '$totalPaid' },
          avgProgress: { $avg: '$progress' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        projects,
        stats: stats[0] || {
          totalBudget: 0,
          totalPaid: 0,
          avgProgress: 0,
          activeCount: 0,
          completedCount: 0
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Projects Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email company phone avatar')
      .populate('projectManager', 'name email avatar role')
      .populate('teamMembers.user', 'name email avatar role status')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('tasks.assignedTo', 'name email avatar')
      .populate('messages', 'content sender createdAt')
      .populate('invoices', 'invoiceNumber amount status dueDate');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    if (req.user.role !== 'admin') {
      const isTeamMember = project.teamMembers.some(
        member => member.user._id.toString() === req.user._id.toString()
      );
      const isManager = project.projectManager._id.toString() === req.user._id.toString();

      if (!isTeamMember && !isManager) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this project'
        });
      }
    }

    // Increment views
    project.views += 1;
    await project.save();

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Get Project By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res) => {
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

    const client = await Client.findById(req.body.client);

if (!client) {
  return res.status(400).json({
    success: false,
    message: 'Client not found'
  });
}

const projectData = {
  ...req.body,
  clientName: client.name,
  clientEmail: client.email,
  createdBy: req.user._id,
  projectManager: req.body.projectManager || req.user._id
};

    // Create project
    const project = await Project.create(projectData);

    // Add timeline event
    project.timeline.push({
      event: 'Project Created',
      description: `Project created by ${req.user.name}`,
      createdBy: req.user._id,
      createdAt: Date.now()
    });

    await project.save();

    // Update client's projects
    await Client.findByIdAndUpdate(projectData.client, {
      $push: { projects: project._id },
      $inc: { totalProjects: 1, activeProjects: 1 },
      status: 'Active'
    });

    // Add project to team members
    if (projectData.teamMembers && projectData.teamMembers.length > 0) {
      for (const member of projectData.teamMembers) {
        await User.findByIdAndUpdate(member.user, {
          $push: { assignedProjects: project._id }
        });
      }
    }
     
  const manager = await User.findById(project.projectManager);

    // Create notifications for team members
if (projectData.teamMembers && projectData.teamMembers.length > 0) {
  for (const member of projectData.teamMembers) {

    const user = await User.findById(member.user);

    if (!user) continue;

    await Notification.createNotification({
      user: user._id,
      userEmail: user.email,
      userName: user.name,
      type: 'info',
      category: 'project',
      title: 'New Project Assignment',
      message: `You have been added to project: ${project.name} as ${member.role}`,
      actionUrl: `/projects/${project._id}`,
      relatedProject: project._id,
      priority: 'medium'
    });

  }
}

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    console.error('Create Project Error:', error);
    
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
      message: 'Server error while creating project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      const isManager = project.projectManager.toString() === req.user._id.toString();
      if (!isManager) {
        return res.status(403).json({
          success: false,
          message: 'Only project manager or admin can update project'
        });
      }
    }

    // Track changes for timeline
    const changes = [];
    Object.keys(req.body).forEach(key => {
      if (project[key] !== req.body[key]) {
        changes.push({
          field: key,
          oldValue: project[key],
          newValue: req.body[key]
        });
      }
    });

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    // Add timeline event for major changes
    if (changes.length > 0) {
      if (req.body.status && req.body.status !== project.status) {
        // Status changed
        updatedProject.timeline.push({
          event: 'Status Changed',
          description: `Project status changed from ${project.status} to ${req.body.status}`,
          createdBy: req.user._id,
          createdAt: Date.now()
        });

        // Create notification for team
        if (updatedProject.teamMembers.length > 0) {
          for (const member of updatedProject.teamMembers) {
            await Notification.createNotification({
              user: member.user,
              type: 'info',
              category: 'project',
              title: 'Project Status Updated',
              message: `Project "${project.name}" status changed to ${req.body.status}`,
              actionUrl: `/projects/${project._id}`,
              relatedProject: project._id,
              priority: 'medium'
            });
          }
        }
      }

      if (req.body.progress && req.body.progress !== project.progress) {
        // Progress changed
        updatedProject.timeline.push({
          event: 'Progress Updated',
          description: `Project progress updated from ${project.progress}% to ${req.body.progress}%`,
          createdBy: req.user._id,
          createdAt: Date.now()
        });

        // Check if project completed
        if (req.body.progress === 100) {
          updatedProject.status = 'Completed';
          updatedProject.completedAt = Date.now();

          // Update client stats
          await Client.findByIdAndUpdate(project.client, {
            $inc: { completedProjects: 1, activeProjects: -1 }
          });

          // Create notification for completion
          await Notification.createNotification({
            user: project.projectManager,
            type: 'success',
            category: 'project',
            title: 'Project Completed! 🎉',
            message: `Project "${project.name}" has been completed successfully!`,
            actionUrl: `/projects/${project._id}`,
            relatedProject: project._id,
            priority: 'high'
          });
        }
      }
    }

    await updatedProject.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project: updatedProject }
    });
  } catch (error) {
    console.error('Update Project Error:', error);
    
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
      message: 'Server error while updating project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin only)
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only admin can delete projects
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete projects'
      });
    }

    // Remove project from client
    await Client.findByIdAndUpdate(project.client, {
      $pull: { projects: project._id },
      $inc: { totalProjects: -1 }
    });

    // Remove project from team members
    if (project.teamMembers.length > 0) {
      for (const member of project.teamMembers) {
        await User.findByIdAndUpdate(member.user, {
          $pull: { assignedProjects: project._id }
        });
      }
    }

    // Soft delete
    project.isActive = false;
    project.isArchived = true;
    project.deletedAt = Date.now();
    await project.save();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete Project Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// PROJECT STATISTICS
// ===========================================

/**
 * @desc    Get project statistics
 * @route   GET /api/projects/stats
 * @access  Private
 */
const getProjectStats = async (req, res) => {
  try {
    const [overall, byStatus, byCategory, monthly, upcoming] = await Promise.all([
      // Overall stats
      Project.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalBudget: { $sum: '$budget' },
            totalPaid: { $sum: '$totalPaid' },
            avgProgress: { $avg: '$progress' },
            avgBudget: { $avg: '$budget' },
            minBudget: { $min: '$budget' },
            maxBudget: { $max: '$budget' }
          }
        }
      ]),

      // Stats by status
      Project.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget' },
            avgProgress: { $avg: '$progress' }
          }
        }
      ]),

      // Stats by category
      Project.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget' }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Monthly trends
      Project.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget' },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]),

      // Upcoming deadlines
      Project.find({
        status: { $ne: 'Completed' },
        deadline: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      })
      .select('name deadline status progress clientName')
      .populate('client', 'name company')
      .sort('deadline')
      .limit(10)
    ]);

    // Calculate completion rate
    const totalProjects = overall[0]?.total || 0;
    const completedProjects = byStatus.find(s => s._id === 'Completed')?.count || 0;
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    // Calculate overdue projects
    const overdueCount = await Project.countDocuments({
      status: { $ne: 'Completed' },
      deadline: { $lt: new Date() }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total: overall[0]?.total || 0,
          totalBudget: overall[0]?.totalBudget || 0,
          totalPaid: overall[0]?.totalPaid || 0,
          avgProgress: Math.round(overall[0]?.avgProgress || 0),
          avgBudget: overall[0]?.avgBudget || 0,
          minBudget: overall[0]?.minBudget || 0,
          maxBudget: overall[0]?.maxBudget || 0,
          completionRate: Math.round(completionRate),
          overdueCount
        },
        byStatus,
        byCategory,
        monthlyTrends: monthly,
        upcomingDeadlines: upcoming
      }
    });
  } catch (error) {
    console.error('Get Project Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get project timeline
 * @route   GET /api/projects/:id/timeline
 * @access  Private
 */
const getProjectTimeline = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .select('timeline name')
      .populate('timeline.createdBy', 'name avatar');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: {
        timeline: project.timeline.sort((a, b) => b.createdAt - a.createdAt)
      }
    });
  } catch (error) {
    console.error('Get Project Timeline Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching timeline',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM MANAGEMENT
// ===========================================

/**
 * @desc    Add team member to project
 * @route   POST /api/projects/:id/team
 * @access  Private
 */
const addTeamMember = async (req, res) => {
  try {
    const { userId, role, hoursAllocated } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and role'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user already in team
    const existingMember = project.teamMembers.find(
      member => member.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add to team
    await project.addTeamMember(userId, role, hoursAllocated);

    // Add to user's assigned projects
    await User.findByIdAndUpdate(userId, {
      $push: { assignedProjects: project._id }
    });

    // Create notification
    await Notification.createNotification({
      user: userId,
      type: 'info',
      category: 'project',
      title: 'Added to Project',
      message: `You have been added to project: ${project.name} as ${role}`,
      actionUrl: `/projects/${project._id}`,
      relatedProject: project._id
    });

    res.json({
      success: true,
      message: 'Team member added successfully',
      data: { teamMembers: project.teamMembers }
    });
  } catch (error) {
    console.error('Add Team Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding team member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Remove team member from project
 * @route   DELETE /api/projects/:id/team/:userId
 * @access  Private
 */
const removeTeamMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const { userId } = req.params;

    // Remove from team
    await project.removeTeamMember(userId);

    // Remove from user's assigned projects
    await User.findByIdAndUpdate(userId, {
      $pull: { assignedProjects: project._id }
    });

    // Create notification
    await Notification.createNotification({
      user: userId,
      type: 'warning',
      category: 'project',
      title: 'Removed from Project',
      message: `You have been removed from project: ${project.name}`,
      actionUrl: `/projects/${project._id}`,
      relatedProject: project._id
    });

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Remove Team Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing team member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update team member role
 * @route   PUT /api/projects/:id/team/:userId
 * @access  Private
 */
const updateTeamMember = async (req, res) => {
  try {
    const { role, hoursAllocated } = req.body;
    const { id, userId } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const memberIndex = project.teamMembers.findIndex(
      m => m.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    if (role) project.teamMembers[memberIndex].role = role;
    if (hoursAllocated) project.teamMembers[memberIndex].hoursAllocated = hoursAllocated;

    await project.save();

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: { teamMembers: project.teamMembers }
    });
  } catch (error) {
    console.error('Update Team Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating team member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// MILESTONE MANAGEMENT
// ===========================================

/**
 * @desc    Add milestone to project
 * @route   POST /api/projects/:id/milestones
 * @access  Private
 */
const addMilestone = async (req, res) => {
  try {
    const { title, description, dueDate, amount } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and due date'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.addMilestone({
      title,
      description,
      dueDate,
      payment: amount ? { amount, paid: false } : undefined
    });

    // Create notification for project manager
    await Notification.createNotification({
      user: project.projectManager,
      type: 'info',
      category: 'project',
      title: 'New Milestone Added',
      message: `New milestone "${title}" added to project: ${project.name}`,
      actionUrl: `/projects/${project._id}`,
      relatedProject: project._id
    });

    res.json({
      success: true,
      message: 'Milestone added successfully',
      data: { milestones: project.milestones }
    });
  } catch (error) {
    console.error('Add Milestone Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update milestone
 * @route   PUT /api/projects/:id/milestones/:milestoneId
 * @access  Private
 */
const updateMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const milestone = project.milestones.id(req.params.milestoneId);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    Object.assign(milestone, req.body);
    await project.save();

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: { milestone }
    });
  } catch (error) {
    console.error('Update Milestone Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Complete milestone
 * @route   POST /api/projects/:id/milestones/:milestoneId/complete
 * @access  Private
 */
const completeMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.completeMilestone(req.params.milestoneId);

    // Check if all milestones completed
    const allCompleted = project.milestones.every(m => m.status === 'Completed');
    if (allCompleted) {
      project.status = 'Review';
      await project.save();
    }

    res.json({
      success: true,
      message: 'Milestone completed successfully',
      data: {
        progress: project.progress,
        milestoneProgress: project.milestoneProgress,
        status: project.status
      }
    });
  } catch (error) {
    console.error('Complete Milestone Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing milestone',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TASK MANAGEMENT
// ===========================================

/**
 * @desc    Add task to project
 * @route   POST /api/projects/:id/tasks
 * @access  Private
 */
const addTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task title'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const task = {
      title,
      description,
      assignedTo,
      dueDate,
      priority: priority || 'Medium',
      createdAt: Date.now()
    };

    project.tasks.push(task);
    await project.save();

    // Create notification for assigned user
    if (assignedTo) {
      await Notification.createNotification({
        user: assignedTo,
        type: 'info',
        category: 'task',
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${title}`,
        actionUrl: `/projects/${project._id}`,
        relatedProject: project._id,
        priority: priority === 'High' ? 'high' : 'medium'
      });
    }

    res.json({
      success: true,
      message: 'Task added successfully',
      data: { task: project.tasks[project.tasks.length - 1] }
    });
  } catch (error) {
    console.error('Add Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update task status
 * @route   PUT /api/projects/:id/tasks/:taskId
 * @access  Private
 */
const updateTask = async (req, res) => {
  try {
    const { status, title, description, assignedTo, dueDate, priority } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const task = project.tasks.id(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update task fields
    if (status) task.status = status;
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;

    // If task completed
    if (status === 'Done' && !task.completedAt) {
      task.completedAt = Date.now();

      // Update user stats
      if (task.assignedTo) {
        await User.findByIdAndUpdate(task.assignedTo, {
          $inc: { 'stats.tasksCompleted': 1 }
        });
      }

      // Create notification
      await Notification.createNotification({
        user: project.projectManager,
        type: 'success',
        category: 'task',
        title: 'Task Completed',
        message: `Task "${task.title}" has been completed`,
        actionUrl: `/projects/${project._id}`,
        relatedProject: project._id
      });
    }

    await project.save();

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/projects/:id/tasks/:taskId
 * @access  Private
 */
const deleteTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.tasks = project.tasks.filter(
      t => t._id.toString() !== req.params.taskId
    );

    await project.save();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// PAYMENT MANAGEMENT
// ===========================================

/**
 * @desc    Add payment to project
 * @route   POST /api/projects/:id/payments
 * @access  Private
 */
const addPayment = async (req, res) => {
  try {
    const { amount, method, transactionId, milestoneId } = req.body;

    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Please provide amount and payment method'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.addPayment(amount);

    // If payment is for a specific milestone
    if (milestoneId) {
      const milestone = project.milestones.id(milestoneId);
      if (milestone) {
        milestone.payment.paid = true;
        milestone.payment.paidAt = Date.now();
      }
    }

    // Add to payment history
    project.paymentHistory.push({
      amount,
      method,
      transactionId,
      paidAt: Date.now()
    });

    await project.save();

    // Create notification
    await Notification.createNotification({
      user: project.projectManager,
      type: 'success',
      category: 'payment',
      title: 'Payment Received',
      message: `Payment of $${amount} received for project: ${project.name}`,
      actionUrl: `/projects/${project._id}`,
      relatedProject: project._id
    });

    res.json({
      success: true,
      message: 'Payment added successfully',
      data: {
        totalPaid: project.totalPaid,
        remainingBudget: project.remainingBudget,
        paymentStatus: project.paymentStatus
      }
    });
  } catch (error) {
    console.error('Add Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// EXPORT CONTROLLERS
// ===========================================
module.exports = {
  // CRUD
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  
  // Statistics
  getProjectStats,
  getProjectTimeline,
  
  // Team Management
  addTeamMember,
  removeTeamMember,
  updateTeamMember,
  
  // Milestone Management
  addMilestone,
  updateMilestone,
  completeMilestone,
  
  // Task Management
  addTask,
  updateTask,
  deleteTask,
  
  // Payment Management
  addPayment
};