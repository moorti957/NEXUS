const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ===========================================
// TEAM MANAGEMENT
// ===========================================

/**
 * @desc    Get all team members
 * @route   GET /api/team
 * @access  Private
 */
const getTeamMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, role, department, search } = req.query;

    // Build filter
    let filter = { isActive: true };
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (department) filter.department = department;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    // Get team statistics
    const stats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          online: {
            $sum: { $cond: [{ $eq: ['$status', 'online'] }, 1, 0] }
          },
          away: {
            $sum: { $cond: [{ $eq: ['$status', 'away'] }, 1, 0] }
          },
          offline: {
            $sum: { $cond: [{ $eq: ['$status', 'offline'] }, 1, 0] }
          },
          busy: {
            $sum: { $cond: [{ $eq: ['$status', 'busy'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        members,
        stats: stats[0] || {
          total: 0,
          online: 0,
          away: 0,
          offline: 0,
          busy: 0
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
    console.error('Get Team Members Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get team member by ID
 * @route   GET /api/team/:id
 * @access  Private
 */
const getTeamMemberById = async (req, res) => {
  try {
    const member = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate({
        path: 'assignedProjects',
        select: 'name status deadline progress',
        populate: {
          path: 'client',
          select: 'name company'
        }
      });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Get member statistics
    const [projectStats, taskStats, recentActivity] = await Promise.all([
      // Project statistics
      Project.aggregate([
        { $match: { 'teamMembers.user': member._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
            }
          }
        }
      ]),

      // Task statistics
      Project.aggregate([
        { $match: { 'teamMembers.user': member._id } },
        { $unwind: '$tasks' },
        { $match: { 'tasks.assignedTo': member._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$tasks.status', 'Done'] }, 1, 0] }
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ['$tasks.status', 'In Progress'] }, 1, 0] }
            }
          }
        }
      ]),

      // Recent activity
      Notification.find({ user: member._id })
        .sort('-createdAt')
        .limit(10)
    ]);

    res.json({
      success: true,
      data: {
        member,
        stats: {
          projects: projectStats[0] || { total: 0, completed: 0, active: 0 },
          tasks: taskStats[0] || { total: 0, completed: 0, inProgress: 0 }
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get Team Member By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Create new team member
 * @route   POST /api/team
 * @access  Private (Admin only)
 */
const createTeamMember = async (req, res) => {
  try {
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

    const { name, email, password, role, position, department, phone, skills } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate temporary password if not provided
    const tempPassword = password || crypto.randomBytes(8).toString('hex');

    // Create user
    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role: role || 'user',
      position,
      department,
      phone,
      skills: skills || [],
      status: 'offline',
      createdBy: req.user._id,
      createdAt: Date.now()
    });

    // Send invitation email (you would implement this)
    // await sendInvitationEmail(user.email, tempPassword);

    // Create notification for admin
    await Notification.createNotification({
      user: req.user._id,
      type: 'success',
      category: 'team',
      title: 'Team Member Added',
      message: `${name} has been added to the team`,
      priority: 'medium'
    });

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: {
        user: {
          ...user.toObject(),
          password: undefined
        }
      }
    });
  } catch (error) {
    console.error('Create Team Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating team member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update team member
 * @route   PUT /api/team/:id
 * @access  Private
 */
const updateTeamMember = async (req, res) => {
  try {
    const { name, position, department, phone, skills, bio, socialLinks } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        position,
        department,
        phone,
        skills,
        bio,
        socialLinks,
        updatedAt: Date.now(),
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Create notification
    await Notification.createNotification({
      user: user._id,
      type: 'info',
      category: 'profile',
      title: 'Profile Updated',
      message: 'Your profile has been updated by an admin',
      priority: 'low'
    });

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: { user }
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

/**
 * @desc    Delete team member (soft delete)
 * @route   DELETE /api/team/:id
 * @access  Private (Admin only)
 */
const deleteTeamMember = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Soft delete
    user.isActive = false;
    user.status = 'offline';
    user.deletedAt = Date.now();
    await user.save();

    // Remove from assigned projects
    await Project.updateMany(
      { 'teamMembers.user': user._id },
      { $pull: { teamMembers: { user: user._id } } }
    );

    // Create notification for admin
    await Notification.createNotification({
      user: req.user._id,
      type: 'warning',
      category: 'team',
      title: 'Team Member Removed',
      message: `${user.name} has been removed from the team`,
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Delete Team Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting team member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM STATISTICS
// ===========================================

/**
 * @desc    Get team statistics
 * @route   GET /api/team/stats
 * @access  Private
 */
const getTeamStats = async (req, res) => {
  try {
    const [
      overview,
      byRole,
      byDepartment,
      byStatus,
      performance,
      recentJoins,
      topPerformers
    ] = await Promise.all([
      // Overview stats
      User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgProjects: { $avg: { $size: '$assignedProjects' } },
            totalProjects: { $sum: { $size: '$assignedProjects' } }
          }
        }
      ]),

      // Stats by role
      User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),

      // Stats by department
      User.aggregate([
        { $match: { isActive: true, department: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        }
      ]),

      // Stats by status
      User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Performance metrics
      Project.aggregate([
        { $unwind: '$teamMembers' },
        {
          $group: {
            _id: '$teamMembers.user',
            projectsCompleted: {
              $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            },
            tasksCompleted: { $sum: { $size: '$tasks' } }
          }
        },
        { $sort: { projectsCompleted: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' }
      ]),

      // Recent joins
      User.find({ isActive: true })
        .sort('-createdAt')
        .limit(5)
        .select('name email avatar role position createdAt'),

      // Top performers (by projects completed)
      User.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: 'teamMembers.user',
            as: 'projects'
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            avatar: 1,
            role: 1,
            projectCount: { $size: '$projects' },
            completedProjects: {
              $size: {
                $filter: {
                  input: '$projects',
                  as: 'project',
                  cond: { $eq: ['$$project.status', 'Completed'] }
                }
              }
            }
          }
        },
        { $sort: { completedProjects: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        overview: overview[0] || { total: 0, avgProjects: 0, totalProjects: 0 },
        byRole,
        byDepartment,
        byStatus,
        performance,
        recentJoins,
        topPerformers
      }
    });
  } catch (error) {
    console.error('Get Team Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get team performance metrics
 * @route   GET /api/team/performance
 * @access  Private
 */
const getTeamPerformance = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch(period) {
      case 'week':
        dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case 'month':
        dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        break;
      case 'quarter':
        dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 3)) };
        break;
      case 'year':
        dateFilter = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
    }

    const performance = await Project.aggregate([
      { $unwind: '$teamMembers' },
      {
        $match: {
          'teamMembers.assignedAt': dateFilter
        }
      },
      {
        $group: {
          _id: '$teamMembers.user',
          projectsAssigned: { $sum: 1 },
          projectsCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          avgProgress: { $avg: '$progress' },
          lastActive: { $max: '$updatedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          'user.name': 1,
          'user.email': 1,
          'user.avatar': 1,
          'user.role': 1,
          projectsAssigned: 1,
          projectsCompleted: 1,
          avgProgress: 1,
          lastActive: 1,
          efficiency: {
            $multiply: [
              { $divide: ['$projectsCompleted', { $max: [1, '$projectsAssigned'] }] },
              100
            ]
          }
        }
      },
      { $sort: { efficiency: -1 } }
    ]);

    res.json({
      success: true,
      data: { performance }
    });
  } catch (error) {
    console.error('Get Team Performance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team performance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM ROLES & PERMISSIONS
// ===========================================

/**
 * @desc    Update team member role
 * @route   PUT /api/team/:id/role
 * @access  Private (Admin only)
 */
const updateTeamMemberRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['admin', 'moderator', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Create notification
    await Notification.createNotification({
      user: user._id,
      type: 'info',
      category: 'team',
      title: 'Role Updated',
      message: `Your role has been updated to ${role}`,
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Team member role updated',
      data: { user }
    });
  } catch (error) {
    console.error('Update Team Member Role Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update team member status (online/away/offline)
 * @route   PUT /api/team/:id/status
 * @access  Private
 */
const updateTeamMemberStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['online', 'away', 'offline', 'busy'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        lastSeen: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Emit socket event for real-time status update
    const io = req.app.get('io');
    if (io) {
      io.emit('userStatusChanged', {
        userId: user._id,
        status: user.status,
        lastSeen: user.lastSeen
      });
    }

    res.json({
      success: true,
      message: 'Status updated',
      data: { status: user.status }
    });
  } catch (error) {
    console.error('Update Team Member Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM INVITATIONS
// ===========================================

/**
 * @desc    Invite team member
 * @route   POST /api/team/invite
 * @access  Private (Admin only)
 */
const inviteTeamMember = async (req, res) => {
  try {
    const { email, role, message } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    
    // Store invitation in database (you'd have an Invitation model)
    // For now, just return success

    // Send invitation email
    // await sendInvitationEmail(email, invitationToken, message);

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      data: { email, role }
    });
  } catch (error) {
    console.error('Invite Team Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all invitations
 * @route   GET /api/team/invitations
 * @access  Private (Admin only)
 */
const getInvitations = async (req, res) => {
  try {
    // This would fetch from Invitation model
    // For now, return mock data
    const invitations = [
      {
        id: '1',
        email: 'pending@example.com',
        role: 'developer',
        status: 'pending',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json({
      success: true,
      data: { invitations }
    });
  } catch (error) {
    console.error('Get Invitations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching invitations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Accept invitation
 * @route   POST /api/team/invitations/:invitationId/accept
 * @access  Public
 */
const acceptInvitation = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validate invitation token and create user
    // This would verify the invitation and create the user

    res.json({
      success: true,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Accept Invitation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Decline invitation
 * @route   POST /api/team/invitations/:invitationId/decline
 * @access  Public
 */
const declineInvitation = async (req, res) => {
  try {
    // Update invitation status to declined

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('Decline Invitation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while declining invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Resend invitation
 * @route   POST /api/team/invitations/:invitationId/resend
 * @access  Private (Admin only)
 */
const resendInvitation = async (req, res) => {
  try {
    // Resend invitation email

    res.json({
      success: true,
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('Resend Invitation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Cancel invitation
 * @route   DELETE /api/team/invitations/:invitationId
 * @access  Private (Admin only)
 */
const cancelInvitation = async (req, res) => {
  try {
    // Delete or mark invitation as cancelled

    res.json({
      success: true,
      message: 'Invitation cancelled'
    });
  } catch (error) {
    console.error('Cancel Invitation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM SKILLS
// ===========================================

/**
 * @desc    Get team skills matrix
 * @route   GET /api/team/skills
 * @access  Private
 */
const getTeamSkills = async (req, res) => {
  try {
    const skills = await User.aggregate([
      { $match: { isActive: true, skills: { $exists: true, $ne: [] } } },
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills',
          count: { $sum: 1 },
          members: {
            $push: {
              id: '$_id',
              name: '$name',
              avatar: '$avatar'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: { skills }
    });
  } catch (error) {
    console.error('Get Team Skills Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team skills',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update member skills
 * @route   PUT /api/team/:id/skills
 * @access  Private
 */
const updateMemberSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { skills, updatedAt: Date.now() },
      { new: true }
    ).select('name skills');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    res.json({
      success: true,
      message: 'Skills updated successfully',
      data: { skills: user.skills }
    });
  } catch (error) {
    console.error('Update Member Skills Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating skills',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM AVAILABILITY
// ===========================================

/**
 * @desc    Get member availability
 * @route   GET /api/team/:id/availability
 * @access  Private
 */
const getMemberAvailability = async (req, res) => {
  try {
    // This would fetch from a Calendar/Schedule model
    // For now, return mock data
    const availability = {
      current: 'available',
      upcoming: [
        {
          date: '2024-03-15',
          status: 'busy',
          reason: 'Meeting'
        }
      ],
      timeOff: []
    };

    res.json({
      success: true,
      data: { availability }
    });
  } catch (error) {
    console.error('Get Member Availability Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update member availability
 * @route   PUT /api/team/:id/availability
 * @access  Private
 */
const updateMemberAvailability = async (req, res) => {
  try {
    const { status, reason } = req.body;

    // Update availability in database
    // This would update a Calendar/Schedule model

    res.json({
      success: true,
      message: 'Availability updated'
    });
  } catch (error) {
    console.error('Update Member Availability Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM LEAVE MANAGEMENT
// ===========================================

/**
 * @desc    Request leave
 * @route   POST /api/team/leave/request
 * @access  Private
 */
const requestLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason, type } = req.body;

    // Create leave request in database
    // This would use a LeaveRequest model

    // Notify manager
    await Notification.createNotification({
      user: req.user.managerId, // You'd need to add manager field to User model
      type: 'info',
      category: 'team',
      title: 'Leave Request',
      message: `${req.user.name} has requested leave from ${startDate} to ${endDate}`,
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Leave request submitted'
    });
  } catch (error) {
    console.error('Request Leave Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting leave request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Approve leave request
 * @route   PUT /api/team/leave/:leaveId/approve
 * @access  Private (Manager/Admin only)
 */
const approveLeave = async (req, res) => {
  try {
    const { approved } = req.body;

    // Update leave request status
    // Notify employee

    res.json({
      success: true,
      message: approved ? 'Leave request approved' : 'Leave request rejected'
    });
  } catch (error) {
    console.error('Approve Leave Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing leave request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM PERFORMANCE REVIEWS
// ===========================================

/**
 * @desc    Create performance review
 * @route   POST /api/team/reviews
 * @access  Private (Manager/Admin only)
 */
const createPerformanceReview = async (req, res) => {
  try {
    const { memberId, rating, feedback, goals } = req.body;

    // Create review in database
    // This would use a PerformanceReview model

    // Notify member
    await Notification.createNotification({
      user: memberId,
      type: 'info',
      category: 'performance',
      title: 'New Performance Review',
      message: 'A new performance review has been created for you',
      priority: 'high',
      actionUrl: `/team/reviews/${memberId}`
    });

    res.json({
      success: true,
      message: 'Performance review created'
    });
  } catch (error) {
    console.error('Create Performance Review Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get performance reviews
 * @route   GET /api/team/reviews
 * @access  Private
 */
const getPerformanceReviews = async (req, res) => {
  try {
    const { memberId } = req.query;

    // Fetch reviews from database
    const reviews = [
      {
        id: '1',
        memberId: 'user123',
        rating: 4.5,
        feedback: 'Excellent performance',
        createdAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: { reviews }
    });
  } catch (error) {
    console.error('Get Performance Reviews Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update performance review
 * @route   PUT /api/team/reviews/:reviewId
 * @access  Private (Manager/Admin only)
 */
const updatePerformanceReview = async (req, res) => {
  try {
    const { rating, feedback, goals } = req.body;

    // Update review in database

    res.json({
      success: true,
      message: 'Performance review updated'
    });
  } catch (error) {
    console.error('Update Performance Review Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM GOALS
// ===========================================

/**
 * @desc    Create team goal
 * @route   POST /api/team/goals
 * @access  Private (Manager/Admin only)
 */
const createTeamGoal = async (req, res) => {
  try {
    const { title, description, deadline, assignedTo } = req.body;

    // Create goal in database
    // This would use a TeamGoal model

    // Notify assigned members
    if (assignedTo && assignedTo.length > 0) {
      for (const memberId of assignedTo) {
        await Notification.createNotification({
          user: memberId,
          type: 'info',
          category: 'goals',
          title: 'New Team Goal',
          message: `New goal assigned: ${title}`,
          priority: 'high',
          actionUrl: '/team/goals'
        });
      }
    }

    res.json({
      success: true,
      message: 'Team goal created'
    });
  } catch (error) {
    console.error('Create Team Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update team goal
 * @route   PUT /api/team/goals/:goalId
 * @access  Private (Manager/Admin only)
 */
const updateTeamGoal = async (req, res) => {
  try {
    const { title, description, deadline, progress } = req.body;

    // Update goal in database

    res.json({
      success: true,
      message: 'Team goal updated'
    });
  } catch (error) {
    console.error('Update Team Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get team goals
 * @route   GET /api/team/goals
 * @access  Private
 */
const getTeamGoals = async (req, res) => {
  try {
    const { status } = req.query;

    // Fetch goals from database
    const goals = [
      {
        id: '1',
        title: 'Q1 Revenue Target',
        description: 'Achieve $1M revenue',
        progress: 75,
        deadline: '2024-03-31',
        status: 'in-progress',
        assignedTo: []
      }
    ];

    res.json({
      success: true,
      data: { goals }
    });
  } catch (error) {
    console.error('Get Team Goals Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching goals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Complete team goal
 * @route   PUT /api/team/goals/:goalId/complete
 * @access  Private (Manager/Admin only)
 */
const completeTeamGoal = async (req, res) => {
  try {
    const { achievement, notes } = req.body;

    // Mark goal as completed
    // Notify team

    res.json({
      success: true,
      message: 'Goal marked as completed'
    });
  } catch (error) {
    console.error('Complete Team Goal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing goal',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM ACTIVITY
// ===========================================

/**
 * @desc    Get team activity feed
 * @route   GET /api/team/activity
 * @access  Private
 */
const getTeamActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Fetch recent team activities
    const activities = await Notification.find({
      category: { $in: ['team', 'project', 'task'] }
    })
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total: await Notification.countDocuments(),
          pages: Math.ceil(await Notification.countDocuments() / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get Team Activity Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get member activity
 * @route   GET /api/team/:id/activity
 * @access  Private
 */
const getMemberActivity = async (req, res) => {
  try {
    const activities = await Notification.find({ user: req.params.id })
      .sort('-createdAt')
      .limit(50);

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Get Member Activity Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching member activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM COMMUNICATION
// ===========================================

/**
 * @desc    Send team announcement
 * @route   POST /api/team/announcements
 * @access  Private (Manager/Admin only)
 */
const sendTeamAnnouncement = async (req, res) => {
  try {
    const { title, message, priority, targetRoles } = req.body;

    // Send announcement to team members
    // This could be via email, push notification, or in-app

    // Create notifications for all team members
    const query = targetRoles && targetRoles.length > 0 
      ? { role: { $in: targetRoles }, isActive: true }
      : { isActive: true };

    const members = await User.find(query).select('_id');

    for (const member of members) {
      await Notification.createNotification({
        user: member._id,
        type: priority === 'high' ? 'alert' : 'info',
        category: 'announcement',
        title,
        message,
        priority: priority || 'medium',
        actionUrl: '/team/announcements'
      });
    }

    res.json({
      success: true,
      message: 'Announcement sent successfully'
    });
  } catch (error) {
    console.error('Send Team Announcement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending announcement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get team announcements
 * @route   GET /api/team/announcements
 * @access  Private
 */
const getTeamAnnouncements = async (req, res) => {
  try {
    // Fetch announcements from database
    const announcements = [
      {
        id: '1',
        title: 'Team Meeting',
        message: 'Weekly sync at 10 AM',
        createdAt: new Date(),
        priority: 'medium'
      }
    ];

    res.json({
      success: true,
      data: { announcements }
    });
  } catch (error) {
    console.error('Get Team Announcements Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching announcements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM DOCUMENTS
// ===========================================

/**
 * @desc    Upload team document
 * @route   POST /api/team/documents
 * @access  Private
 */
const uploadTeamDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Save document metadata to database
    // This would use a TeamDocument model

    const document = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/team/${req.file.filename}`,
      uploadedBy: req.user._id,
      uploadedAt: Date.now(),
      size: req.file.size
    };

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Upload Team Document Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get team documents
 * @route   GET /api/team/documents
 * @access  Private
 */
const getTeamDocuments = async (req, res) => {
  try {
    // Fetch documents from database
    const documents = [
      {
        id: '1',
        name: 'Team Handbook.pdf',
        url: '/uploads/team/handbook.pdf',
        uploadedBy: 'Admin',
        uploadedAt: new Date(),
        size: 2500000
      }
    ];

    res.json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    console.error('Get Team Documents Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete team document
 * @route   DELETE /api/team/documents/:docId
 * @access  Private
 */
const deleteTeamDocument = async (req, res) => {
  try {
    // Delete document from database and storage

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete Team Document Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM TRAINING
// ===========================================

/**
 * @desc    Assign training to team member
 * @route   POST /api/team/trainings
 * @access  Private (Manager/Admin only)
 */
const assignTraining = async (req, res) => {
  try {
    const { title, description, duration, assignedTo, deadline } = req.body;

    // Create training record in database
    // This would use a Training model

    // Notify assigned members
    if (assignedTo && assignedTo.length > 0) {
      for (const memberId of assignedTo) {
        await Notification.createNotification({
          user: memberId,
          type: 'info',
          category: 'training',
          title: 'New Training Assigned',
          message: `Training assigned: ${title}`,
          priority: 'medium',
          actionUrl: '/team/trainings'
        });
      }
    }

    res.json({
      success: true,
      message: 'Training assigned successfully'
    });
  } catch (error) {
    console.error('Assign Training Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while assigning training',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get team trainings
 * @route   GET /api/team/trainings
 * @access  Private
 */
const getTrainings = async (req, res) => {
  try {
    // Fetch trainings from database
    const trainings = [
      {
        id: '1',
        title: 'React Advanced Concepts',
        description: 'Deep dive into React hooks and patterns',
        duration: 120,
        status: 'in-progress',
        progress: 60,
        deadline: '2024-04-01'
      }
    ];

    res.json({
      success: true,
      data: { trainings }
    });
  } catch (error) {
    console.error('Get Trainings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trainings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Complete training
 * @route   PUT /api/team/trainings/:trainingId/complete
 * @access  Private
 */
const completeTraining = async (req, res) => {
  try {
    const { certificate, notes } = req.body;

    // Mark training as completed
    // Award certificate if applicable

    res.json({
      success: true,
      message: 'Training completed successfully'
    });
  } catch (error) {
    console.error('Complete Training Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while completing training',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM RECOGNITION
// ===========================================

/**
 * @desc    Recognize team member
 * @route   POST /api/team/:id/recognize
 * @access  Private
 */
const recognizeTeamMember = async (req, res) => {
  try {
    const { message, badge } = req.body;

    // Create recognition record
    // This would use a Recognition model

    // Notify recognized member
    await Notification.createNotification({
      user: req.params.id,
      type: 'success',
      category: 'recognition',
      title: 'You\'ve Been Recognized! 🎉',
      message: `${req.user.name} recognized you: ${message}`,
      priority: 'high',
      actionUrl: '/team/recognitions'
    });

    res.json({
      success: true,
      message: 'Team member recognized successfully'
    });
  } catch (error) {
    console.error('Recognize Team Member Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recognizing member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get team recognitions
 * @route   GET /api/team/recognitions
 * @access  Private
 */
const getRecognitions = async (req, res) => {
  try {
    // Fetch recognitions from database
    const recognitions = [
      {
        id: '1',
        from: 'John Doe',
        to: 'Jane Smith',
        message: 'Great work on the project!',
        badge: 'star',
        createdAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: { recognitions }
    });
  } catch (error) {
    console.error('Get Recognitions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recognitions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM FEEDBACK
// ===========================================

/**
 * @desc    Submit feedback for team member
 * @route   POST /api/team/:id/feedback
 * @access  Private
 */
const submitFeedback = async (req, res) => {
  try {
    const { rating, feedback, category } = req.body;

    // Save feedback to database
    // This would use a Feedback model

    // Keep feedback anonymous if specified

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Submit Feedback Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get feedback for team member
 * @route   GET /api/team/:id/feedback
 * @access  Private
 */
const getFeedback = async (req, res) => {
  try {
    // Fetch feedback from database
    const feedback = [
      {
        id: '1',
        rating: 5,
        feedback: 'Excellent team player',
        category: 'collaboration',
        createdAt: new Date(),
        anonymous: true
      }
    ];

    res.json({
      success: true,
      data: { feedback }
    });
  } catch (error) {
    console.error('Get Feedback Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM SCHEDULE
// ===========================================

/**
 * @desc    Get team schedule
 * @route   GET /api/team/schedule
 * @access  Private
 */
const getTeamSchedule = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Fetch schedule from database
    const schedule = [
      {
        id: '1',
        title: 'Sprint Planning',
        date: '2024-03-15',
        time: '10:00 AM',
        attendees: ['John', 'Jane', 'Bob'],
        type: 'meeting'
      }
    ];

    res.json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    console.error('Get Team Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update team schedule
 * @route   PUT /api/team/schedule
 * @access  Private (Admin only)
 */
const updateTeamSchedule = async (req, res) => {
  try {
    const { events } = req.body;

    // Update schedule in database

    res.json({
      success: true,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    console.error('Update Team Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM REPORTS
// ===========================================

/**
 * @desc    Generate team report
 * @route   GET /api/team/reports
 * @access  Private (Manager/Admin only)
 */
const generateTeamReport = async (req, res) => {
  try {
    const { type, format, dateRange } = req.query;

    // Generate report based on type
    let reportData = {};

    switch(type) {
      case 'performance':
        // Fetch performance data
        reportData = await getTeamPerformance(req, res);
        break;
      case 'productivity':
        // Fetch productivity data
        break;
      case 'attendance':
        // Fetch attendance data
        break;
    }

    if (format === 'csv') {
      // Generate CSV file
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=team-report.csv');
      return res.send('CSV data here');
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Generate Team Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Export team data
 * @route   GET /api/team/export
 * @access  Private (Admin only)
 */
const exportTeamData = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const members = await User.find({ isActive: true })
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();

    if (format === 'csv') {
      // Convert to CSV
      const fields = ['name', 'email', 'role', 'position', 'status', 'createdAt'];
      const csv = members.map(member => {
        return fields.map(f => member[f] || '').join(',');
      });
      csv.unshift(fields.join(','));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=team-export.csv');
      return res.send(csv.join('\n'));
    }

    res.json({
      success: true,
      data: { members }
    });
  } catch (error) {
    console.error('Export Team Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM SETTINGS
// ===========================================

/**
 * @desc    Get team settings
 * @route   GET /api/team/settings
 * @access  Private (Admin only)
 */
const getTeamSettings = async (req, res) => {
  try {
    // Fetch team settings from database
    const settings = {
      allowSelfRegistration: false,
      defaultRole: 'user',
      requireApproval: true,
      notificationChannels: ['email', 'push'],
      workingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'UTC'
      },
      leavePolicies: {
        annualLeave: 20,
        sickLeave: 10,
        carryOver: 5
      }
    };

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get Team Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update team settings
 * @route   PUT /api/team/settings
 * @access  Private (Admin only)
 */
const updateTeamSettings = async (req, res) => {
  try {
    const settings = req.body;

    // Update settings in database

    res.json({
      success: true,
      message: 'Team settings updated successfully'
    });
  } catch (error) {
    console.error('Update Team Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// TEAM HIERARCHY
// ===========================================

/**
 * @desc    Get team hierarchy
 * @route   GET /api/team/hierarchy
 * @access  Private
 */
const getTeamHierarchy = async (req, res) => {
  try {
    // Build team hierarchy (manager -> members)
    const hierarchy = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$managerId',
          members: {
            $push: {
              id: '$_id',
              name: '$name',
              role: '$role',
              position: '$position',
              avatar: '$avatar'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'manager'
        }
      }
    ]);

    res.json({
      success: true,
      data: { hierarchy }
    });
  } catch (error) {
    console.error('Get Team Hierarchy Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hierarchy',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update team member's manager
 * @route   PUT /api/team/:id/manager
 * @access  Private (Admin only)
 */
const updateManager = async (req, res) => {
  try {
    const { managerId } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { managerId, updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    res.json({
      success: true,
      message: 'Manager updated successfully'
    });
  } catch (error) {
    console.error('Update Manager Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating manager',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// ROLES MANAGEMENT
// ===========================================

/**
 * @desc    Get all roles
 * @route   GET /api/team/roles
 * @access  Private
 */
const getRoles = async (req, res) => {
  try {
    // Fetch roles from database or use defaults
    const roles = [
      {
        name: 'admin',
        permissions: ['*'],
        description: 'Full system access'
      },
      {
        name: 'moderator',
        permissions: ['manage_team', 'manage_projects', 'view_reports'],
        description: 'Team management access'
      },
      {
        name: 'user',
        permissions: ['view_projects', 'update_profile'],
        description: 'Basic user access'
      }
    ];

    res.json({
      success: true,
      data: { roles }
    });
  } catch (error) {
    console.error('Get Roles Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching roles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Create new role
 * @route   POST /api/team/roles
 * @access  Private (Admin only)
 */
const createRole = async (req, res) => {
  try {
    const { name, permissions, description } = req.body;

    // Save role to database
    // This would use a Role model

    res.json({
      success: true,
      message: 'Role created successfully',
      data: { role: { name, permissions, description } }
    });
  } catch (error) {
    console.error('Create Role Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update role
 * @route   PUT /api/team/roles/:roleId
 * @access  Private (Admin only)
 */
const updateRole = async (req, res) => {
  try {
    const { name, permissions, description } = req.body;

    // Update role in database

    res.json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete role
 * @route   DELETE /api/team/roles/:roleId
 * @access  Private (Admin only)
 */
const deleteRole = async (req, res) => {
  try {
    // Delete role from database

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete Role Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===========================================
// EXPORT CONTROLLERS
// ===========================================
module.exports = {
  // Team Management
  getTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  updateTeamMemberRole,
  updateTeamMemberStatus,
  
  // Team Statistics
  getTeamStats,
  getTeamPerformance,
  
  // Team Invitations
  inviteTeamMember,
  getInvitations,
  acceptInvitation,
  declineInvitation,
  resendInvitation,
  cancelInvitation,
  
  // Team Skills
  getTeamSkills,
  updateMemberSkills,
  
  // Team Availability
  getMemberAvailability,
  updateMemberAvailability,
  
  // Team Leave
  requestLeave,
  approveLeave,
  
  // Team Performance Reviews
  createPerformanceReview,
  getPerformanceReviews,
  updatePerformanceReview,
  
  // Team Goals
  createTeamGoal,
  updateTeamGoal,
  getTeamGoals,
  completeTeamGoal,
  
  // Team Activity
  getTeamActivity,
  getMemberActivity,
  
  // Team Communication
  sendTeamAnnouncement,
  getTeamAnnouncements,
  
  // Team Documents
  uploadTeamDocument,
  getTeamDocuments,
  deleteTeamDocument,
  
  // Team Training
  assignTraining,
  getTrainings,
  completeTraining,
  
  // Team Recognition
  recognizeTeamMember,
  getRecognitions,
  
  // Team Feedback
  submitFeedback,
  getFeedback,
  
  // Team Schedule
  getTeamSchedule,
  updateTeamSchedule,
  
  // Team Reports
  generateTeamReport,
  exportTeamData,
  
  // Team Settings
  getTeamSettings,
  updateTeamSettings,
  
  // Team Hierarchy
  getTeamHierarchy,
  updateManager,
  
  // Roles Management
  getRoles,
  createRole,
  updateRole,
  deleteRole
};