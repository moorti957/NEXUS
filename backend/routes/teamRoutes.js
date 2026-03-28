const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for team document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/team/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

const {
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
  
  // Team Settings
  updateTeamSettings,
  getTeamSettings,
  
  // Team Activity
  getTeamActivity,
  getMemberActivity,
  
  // Team Roles & Permissions
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  
  // Team Hierarchy
  getTeamHierarchy,
  updateManager,
  
  // Team Skills & Expertise
  getTeamSkills,
  updateMemberSkills,
  
  // Team Leave & Availability
  getMemberAvailability,
  updateMemberAvailability,
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
  
  // Team Reports
  generateTeamReport,
  exportTeamData,
  
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
  updateTeamSchedule
} = require('../controllers/teamController');

// ===========================================
// VALIDATION RULES
// ===========================================

// Team member validation
const teamMemberValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isString(),
  body('position').optional().isString(),
  body('department').optional().isString(),
  body('phone').optional().isString(),
  body('skills').optional().isArray()
];

// Role validation
const roleValidation = [
  body('name').notEmpty().withMessage('Role name is required'),
  body('permissions').optional().isArray(),
  body('description').optional().isString()
];

// Invitation validation
const invitationValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('message').optional().isString()
];

// Performance review validation
const reviewValidation = [
  body('memberId').notEmpty().withMessage('Member ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
  body('feedback').optional().isString(),
  body('goals').optional().isArray()
];

// Goal validation
const goalValidation = [
  body('title').notEmpty().withMessage('Goal title is required'),
  body('description').optional().isString(),
  body('deadline').optional().isISO8601(),
  body('assignedTo').optional().isMongoId()
];

// Leave request validation
const leaveValidation = [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('type').isIn(['sick', 'vacation', 'personal', 'other']).withMessage('Valid leave type is required')
];

// Training validation
const trainingValidation = [
  body('title').notEmpty().withMessage('Training title is required'),
  body('description').optional().isString(),
  body('duration').isInt({ min: 1 }).withMessage('Valid duration is required'),
  body('assignedTo').optional().isMongoId()
];

// Announcement validation
const announcementValidation = [
  body('title').notEmpty().withMessage('Announcement title is required'),
  body('message').notEmpty().withMessage('Announcement message is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('targetRoles').optional().isArray()
];

// Feedback validation
const feedbackValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
  body('feedback').optional().isString(),
  body('category').optional().isString()
];

// Recognition validation
const recognitionValidation = [
  body('message').notEmpty().withMessage('Recognition message is required'),
  body('badge').optional().isString()
];

// ===========================================
// PROTECT ALL ROUTES
// ===========================================
router.use(protect);

// ===========================================
// TEAM MANAGEMENT ROUTES
// ===========================================

/**
 * @route   GET /api/team
 * @desc    Get all team members
 * @access  Private
 */
router.get('/', getTeamMembers);

/**
 * @route   GET /api/team/stats
 * @desc    Get team statistics
 * @access  Private
 */
router.get('/stats', getTeamStats);

/**
 * @route   GET /api/team/performance
 * @desc    Get team performance metrics
 * @access  Private
 */
router.get('/performance', getTeamPerformance);

/**
 * @route   GET /api/team/hierarchy
 * @desc    Get team hierarchy
 * @access  Private
 */
router.get('/hierarchy', getTeamHierarchy);

/**
 * @route   GET /api/team/skills
 * @desc    Get team skills matrix
 * @access  Private
 */
router.get('/skills', getTeamSkills);

/**
 * @route   GET /api/team/schedule
 * @desc    Get team schedule
 * @access  Private
 */
router.get('/schedule', getTeamSchedule);

/**
 * @route   GET /api/team/activity
 * @desc    Get team activity feed
 * @access  Private
 */
router.get('/activity', getTeamActivity);

/**
 * @route   GET /api/team/announcements
 * @desc    Get team announcements
 * @access  Private
 */
router.get('/announcements', getTeamAnnouncements);

/**
 * @route   GET /api/team/documents
 * @desc    Get team documents
 * @access  Private
 */
router.get('/documents', getTeamDocuments);

/**
 * @route   GET /api/team/goals
 * @desc    Get team goals
 * @access  Private
 */
router.get('/goals', getTeamGoals);

/**
 * @route   GET /api/team/trainings
 * @desc    Get team trainings
 * @access  Private
 */
router.get('/trainings', getTrainings);

/**
 * @route   GET /api/team/recognitions
 * @desc    Get team recognitions
 * @access  Private
 */
router.get('/recognitions', getRecognitions);

/**
 * @route   GET /api/team/reports
 * @desc    Generate team report
 * @access  Private (Admin/Manager only)
 */
router.get('/reports', generateTeamReport);

/**
 * @route   GET /api/team/export
 * @desc    Export team data
 * @access  Private (Admin only)
 */
router.get('/export', adminOnly, exportTeamData);

/**
 * @route   GET /api/team/settings
 * @desc    Get team settings
 * @access  Private (Admin only)
 */
router.get('/settings', adminOnly, getTeamSettings);

/**
 * @route   PUT /api/team/settings
 * @desc    Update team settings
 * @access  Private (Admin only)
 */
router.put('/settings', adminOnly, updateTeamSettings);

/**
 * @route   PUT /api/team/schedule
 * @desc    Update team schedule
 * @access  Private (Admin only)
 */
router.put('/schedule', adminOnly, updateTeamSchedule);

// ===========================================
// INDIVIDUAL MEMBER ROUTES
// ===========================================

/**
 * @route   POST /api/team
 * @desc    Create new team member
 * @access  Private (Admin only)
 */
router.post('/', adminOnly, teamMemberValidation, createTeamMember);

/**
 * @route   GET /api/team/:id
 * @desc    Get team member by ID
 * @access  Private
 */
router.get('/:id', getTeamMemberById);

/**
 * @route   PUT /api/team/:id
 * @desc    Update team member
 * @access  Private
 */
router.put('/:id', teamMemberValidation, updateTeamMember);

/**
 * @route   DELETE /api/team/:id
 * @desc    Delete team member
 * @access  Private (Admin only)
 */
router.delete('/:id', adminOnly, deleteTeamMember);

/**
 * @route   PUT /api/team/:id/role
 * @desc    Update team member role
 * @access  Private (Admin only)
 */
router.put('/:id/role', adminOnly, updateTeamMemberRole);

/**
 * @route   PUT /api/team/:id/status
 * @desc    Update team member status
 * @access  Private
 */
router.put('/:id/status', updateTeamMemberStatus);

/**
 * @route   PUT /api/team/:id/manager
 * @desc    Update team member's manager
 * @access  Private (Admin only)
 */
router.put('/:id/manager', adminOnly, updateManager);

/**
 * @route   GET /api/team/:id/activity
 * @desc    Get member activity
 * @access  Private
 */
router.get('/:id/activity', getMemberActivity);

/**
 * @route   GET /api/team/:id/availability
 * @desc    Get member availability
 * @access  Private
 */
router.get('/:id/availability', getMemberAvailability);

/**
 * @route   PUT /api/team/:id/availability
 * @desc    Update member availability
 * @access  Private
 */
router.put('/:id/availability', updateMemberAvailability);

/**
 * @route   PUT /api/team/:id/skills
 * @desc    Update member skills
 * @access  Private
 */
router.put('/:id/skills', updateMemberSkills);

/**
 * @route   GET /api/team/:id/feedback
 * @desc    Get member feedback
 * @access  Private
 */
router.get('/:id/feedback', getFeedback);

/**
 * @route   POST /api/team/:id/feedback
 * @desc    Submit feedback for member
 * @access  Private
 */
router.post('/:id/feedback', feedbackValidation, submitFeedback);

/**
 * @route   GET /api/team/:id/recognitions
 * @desc    Get member recognitions
 * @access  Private
 */
router.get('/:id/recognitions', getRecognitions);

/**
 * @route   POST /api/team/:id/recognize
 * @desc    Recognize team member
 * @access  Private
 */
router.post('/:id/recognize', recognitionValidation, recognizeTeamMember);

// ===========================================
// AVAILABILITY & LEAVE ROUTES
// ===========================================

/**
 * @route   POST /api/team/leave/request
 * @desc    Request leave
 * @access  Private
 */
router.post('/leave/request', leaveValidation, requestLeave);

/**
 * @route   PUT /api/team/leave/:leaveId/approve
 * @desc    Approve leave request
 * @access  Private (Admin/Manager only)
 */
router.put('/leave/:leaveId/approve', approveLeave);

// ===========================================
// INVITATION ROUTES
// ===========================================

/**
 * @route   POST /api/team/invite
 * @desc    Invite new team member
 * @access  Private (Admin only)
 */
router.post('/invite', adminOnly, invitationValidation, inviteTeamMember);

/**
 * @route   GET /api/team/invitations
 * @desc    Get all invitations
 * @access  Private (Admin only)
 */
router.get('/invitations', adminOnly, getInvitations);

/**
 * @route   POST /api/team/invitations/:invitationId/accept
 * @desc    Accept invitation
 * @access  Public (with token)
 */
router.post('/invitations/:invitationId/accept', acceptInvitation);

/**
 * @route   POST /api/team/invitations/:invitationId/decline
 * @desc    Decline invitation
 * @access  Public (with token)
 */
router.post('/invitations/:invitationId/decline', declineInvitation);

/**
 * @route   POST /api/team/invitations/:invitationId/resend
 * @desc    Resend invitation
 * @access  Private (Admin only)
 */
router.post('/invitations/:invitationId/resend', adminOnly, resendInvitation);

/**
 * @route   DELETE /api/team/invitations/:invitationId
 * @desc    Cancel invitation
 * @access  Private (Admin only)
 */
router.delete('/invitations/:invitationId', adminOnly, cancelInvitation);

// ===========================================
// ROLE MANAGEMENT ROUTES (Admin Only)
// ===========================================

/**
 * @route   GET /api/team/roles
 * @desc    Get all roles
 * @access  Private
 */
router.get('/roles', getRoles);

/**
 * @route   POST /api/team/roles
 * @desc    Create new role
 * @access  Private (Admin only)
 */
router.post('/roles', adminOnly, roleValidation, createRole);

/**
 * @route   PUT /api/team/roles/:roleId
 * @desc    Update role
 * @access  Private (Admin only)
 */
router.put('/roles/:roleId', adminOnly, roleValidation, updateRole);

/**
 * @route   DELETE /api/team/roles/:roleId
 * @desc    Delete role
 * @access  Private (Admin only)
 */
router.delete('/roles/:roleId', adminOnly, deleteRole);

// ===========================================
// PERFORMANCE REVIEW ROUTES
// ===========================================

/**
 * @route   POST /api/team/reviews
 * @desc    Create performance review
 * @access  Private (Admin/Manager only)
 */
router.post('/reviews', reviewValidation, createPerformanceReview);

/**
 * @route   GET /api/team/reviews
 * @desc    Get all performance reviews
 * @access  Private
 */
router.get('/reviews', getPerformanceReviews);

/**
 * @route   PUT /api/team/reviews/:reviewId
 * @desc    Update performance review
 * @access  Private (Admin/Manager only)
 */
router.put('/reviews/:reviewId', reviewValidation, updatePerformanceReview);

// ===========================================
// TEAM GOALS ROUTES
// ===========================================

/**
 * @route   POST /api/team/goals
 * @desc    Create team goal
 * @access  Private (Admin/Manager only)
 */
router.post('/goals', goalValidation, createTeamGoal);

/**
 * @route   PUT /api/team/goals/:goalId
 * @desc    Update team goal
 * @access  Private (Admin/Manager only)
 */
router.put('/goals/:goalId', goalValidation, updateTeamGoal);

/**
 * @route   PUT /api/team/goals/:goalId/complete
 * @desc    Complete team goal
 * @access  Private (Admin/Manager only)
 */
router.put('/goals/:goalId/complete', completeTeamGoal);

// ===========================================
// TRAINING ROUTES
// ===========================================

/**
 * @route   POST /api/team/trainings
 * @desc    Assign training
 * @access  Private (Admin/Manager only)
 */
router.post('/trainings', trainingValidation, assignTraining);

/**
 * @route   PUT /api/team/trainings/:trainingId/complete
 * @desc    Complete training
 * @access  Private
 */
router.put('/trainings/:trainingId/complete', completeTraining);

// ===========================================
// ANNOUNCEMENT ROUTES
// ===========================================

/**
 * @route   POST /api/team/announcements
 * @desc    Send team announcement
 * @access  Private (Admin/Manager only)
 */
router.post('/announcements', announcementValidation, sendTeamAnnouncement);

// ===========================================
// DOCUMENT ROUTES
// ===========================================

/**
 * @route   POST /api/team/documents
 * @desc    Upload team document
 * @access  Private
 */
router.post('/documents', upload.single('file'), uploadTeamDocument);

/**
 * @route   DELETE /api/team/documents/:docId
 * @desc    Delete team document
 * @access  Private
 */
router.delete('/documents/:docId', deleteTeamDocument);

// ===========================================
// ERROR HANDLING FOR MULTER
// ===========================================
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next(error);
});

// ===========================================
// EXPORT ROUTER
// ===========================================
module.exports = router;