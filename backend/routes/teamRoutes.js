const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const UserProfile = require('../models/UserProfile');
const path = require('path');
const { validationResult } = require('express-validator');
const TeamInvite = require('../models/TeamInvite');
const User = require('../models/User');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// ===========================================
// MULTER SETUP
// ===========================================
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
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Only images and documents are allowed'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ===========================================
// CONTROLLERS
// ===========================================
const {
  getTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  updateTeamMemberRole,
  updateTeamMemberStatus,
  getTeamStats,
  getTeamPerformance,
  inviteTeamMember,
  getInvitations,
  acceptInvitation,
  declineInvitation,
  resendInvitation,
  cancelInvitation,
  updateTeamSettings,
  getTeamSettings,
  getTeamActivity,
  getMemberActivity,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getTeamHierarchy,
  updateManager,
  getTeamSkills,
  updateMemberSkills,
  getMemberAvailability,
  updateMemberAvailability,
  requestLeave,
  approveLeave,
  createPerformanceReview,
  getPerformanceReviews,
  updatePerformanceReview,
  createTeamGoal,
  updateTeamGoal,
  getTeamGoals,
  completeTeamGoal,
  generateTeamReport,
  exportTeamData,
  sendTeamAnnouncement,
  getTeamAnnouncements,
  uploadTeamDocument,
  getTeamDocuments,
  deleteTeamDocument,
  assignTraining,
  getTrainings,
  completeTraining,
  recognizeTeamMember,
  getRecognitions,
  submitFeedback,
  getFeedback,
  getTeamSchedule,
  updateTeamSchedule
} = require('../controllers/teamController');

// ===========================================
// VALIDATIONS
// ===========================================
const teamMemberValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').optional().isString(),
  body('position').optional().isString(),
  body('department').optional().isString(),
  body('phone').optional().isString(),
  body('skills').optional().isArray()
];

const roleValidation = [
  body('name').notEmpty().withMessage('Role name is required'),
  body('permissions').optional().isArray(),
  body('description').optional().isString()
];

const invitationValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('message').optional().isString()
];

const reviewValidation = [
  body('memberId').notEmpty().withMessage('Member ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
  body('feedback').optional().isString(),
  body('goals').optional().isArray()
];

const goalValidation = [
  body('title').notEmpty().withMessage('Goal title is required'),
  body('description').optional().isString(),
  body('deadline').optional().isISO8601(),
  body('assignedTo').optional().isMongoId()
];

const leaveValidation = [
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('type').isIn(['sick', 'vacation', 'personal', 'other']).withMessage('Valid leave type is required')
];

const trainingValidation = [
  body('title').notEmpty().withMessage('Training title is required'),
  body('description').optional().isString(),
  body('duration').isInt({ min: 1 }).withMessage('Valid duration is required'),
  body('assignedTo').optional().isMongoId()
];

const announcementValidation = [
  body('title').notEmpty().withMessage('Announcement title is required'),
  body('message').notEmpty().withMessage('Announcement message is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('targetRoles').optional().isArray()
];

const feedbackValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5'),
  body('feedback').optional().isString(),
  body('category').optional().isString()
];

const recognitionValidation = [
  body('message').notEmpty().withMessage('Recognition message is required'),
  body('badge').optional().isString()
];

const sendInviteValidation = [
  body('memberId')
    .notEmpty()
    .isMongoId()
    .custom(async (value, { req }) => {
      if (value === req.user.id) throw new Error('You cannot invite yourself');

      const targetUser = await User.findById(value);
      if (!targetUser) throw new Error('User not found');

      const profile = await UserProfile.findOne({
        userId: new mongoose.Types.ObjectId(value)
      });

      if (!profile || !profile.accountType || profile.accountType.toLowerCase() !== 'freelancer') {
        throw new Error('You can only invite freelancers');
      }

      const existing = await TeamInvite.findOne({
        owner: req.user.id,
        member: value,
        status: 'pending'
      });

      if (existing) throw new Error('Invite already pending');
      return true;
    })
];

// ===========================================
// ✅ PUBLIC TEST ROUTE - protect SE PEHLE
// ===========================================
router.get('/test-public', (req, res) => {
  res.json({ success: true, message: 'Public route working' });
});

// ===========================================
// ✅ PROTECT - ISKE BAAD SARE ROUTES PROTECTED
// ===========================================
router.use(protect);

// ===========================================
// ✅ TEST ROUTE AFTER AUTH
// ===========================================
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Protected route working', user: req.user });
});

// ===========================================
// ✅ FREELANCER SPECIFIC ROUTES
// IMPORTANT: Ye sab /:id se PEHLE hone chahiye
// ===========================================

router.get('/freelancers', async (req, res) => {
  console.log("USER:", req.user);

  try {
    console.log("👉 freelancers API hit");
    console.time("freelancers-query");

    // DB ping test
    await mongoose.connection.db.admin().ping();
    console.log("✅ Mongo ping success");

    // very simple query first
    const freelancers = await UserProfile.find({
      accountType: "Freelancer"
    })
      .select(
        "userId firstName lastName mobileNumber city country profilePhoto skills"
      )
      .limit(5)
      .lean();

    console.timeEnd("freelancers-query");
    console.log("✅ freelancers found:", freelancers.length);

    const currentUserId = req.user?.id || "";

    const formattedFreelancers = freelancers
      .filter(f => String(f.userId) !== String(currentUserId))
      .map((f) => ({
        _id: f.userId,

        name:
          `${f.firstName || ""} ${f.lastName || ""}`.trim() ||
          "Unknown User",

        phone: f.mobileNumber || "",

        location:
          `${f.city || ""} ${f.country || ""}`.trim() ||
          "Unknown",

        avatar: f.profilePhoto || "",

        skills: f.skills || []
      }));

    return res.status(200).json({
      success: true,
      count: formattedFreelancers.length,
      data: formattedFreelancers
    });

  } catch (error) {

    console.timeEnd("freelancers-query");
    console.error("❌ freelancers error:", error);

    return res.status(500).json({
      success:false,
      message:"Failed to load freelancers",
      error:error.message
    });
  }
});

router.get('/my-team', async (req, res) => {
  try {
    const acceptedInvites = await TeamInvite.find({
      owner: req.user.id,
      status: 'accepted'
    }).populate('member', 'name email avatar role');
    const members = acceptedInvites.map(inv => inv.member);
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/invitations/pending', async (req, res) => {
  try {
    const pendingInvites = await TeamInvite.find({
      member: req.user.id,
      status: 'pending'
    }).populate('owner', 'name email avatar');
    res.json({ success: true, data: pendingInvites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/invite', sendInviteValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ VALIDATION ERROR:", errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { memberId } = req.body;

    const invite = new TeamInvite({
      owner: req.user.id,
      member: memberId,
      status: 'pending'
    });

    const savedInvite = await invite.save();

    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');

    if (io && onlineUsers) {
      const receiverSocketId = onlineUsers.get(memberId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('invite:received', {
          inviteId: savedInvite._id,
          from: req.user.id,
          fromName: req.user.name,
        });
      }
    }

    res.json({
      success: true,
      message: 'Invite sent successfully',
      data: savedInvite
    });

  } catch (error) {
    console.error("❌ INVITE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/invitations/:inviteId/accept', [
  param('inviteId').isMongoId().withMessage('Invalid invite ID')
], async (req, res) => {
  try {
    const invite = await TeamInvite.findById(req.params.inviteId);
    if (!invite) return res.status(404).json({ success: false, message: 'Invite not found' });
    if (invite.member.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invite already processed' });
    }
    invite.status = 'accepted';
    await invite.save();
    res.json({ success: true, message: 'Invite accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/invitations/:inviteId/reject', [
  param('inviteId').isMongoId().withMessage('Invalid invite ID')
], async (req, res) => {
  try {
    const invite = await TeamInvite.findById(req.params.inviteId);
    if (!invite) return res.status(404).json({ success: false, message: 'Invite not found' });
    if (invite.member.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Invite already processed' });
    }
    invite.status = 'rejected';
    await invite.save();
    res.json({ success: true, message: 'Invite rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// EXISTING TEAM MANAGEMENT ROUTES
// ===========================================
router.get('/', getTeamMembers);
router.get('/stats', getTeamStats);
router.get('/performance', getTeamPerformance);
router.get('/hierarchy', getTeamHierarchy);
router.get('/skills', getTeamSkills);
router.get('/schedule', getTeamSchedule);
router.get('/activity', getTeamActivity);
router.get('/announcements', getTeamAnnouncements);
router.get('/documents', getTeamDocuments);
router.get('/goals', getTeamGoals);
router.get('/trainings', getTrainings);
router.get('/recognitions', getRecognitions);
router.get('/reports', generateTeamReport);
router.get('/export', adminOnly, exportTeamData);
router.get('/settings', adminOnly, getTeamSettings);
router.put('/settings', adminOnly, updateTeamSettings);
router.put('/schedule', adminOnly, updateTeamSchedule);

router.post('/', adminOnly, teamMemberValidation, createTeamMember);
router.put('/:id', teamMemberValidation, updateTeamMember);
router.delete('/:id', adminOnly, deleteTeamMember);
router.put('/:id/role', adminOnly, updateTeamMemberRole);
router.put('/:id/status', updateTeamMemberStatus);
router.put('/:id/manager', adminOnly, updateManager);
router.get('/:id/activity', getMemberActivity);
router.get('/:id/availability', getMemberAvailability);
router.put('/:id/availability', updateMemberAvailability);
router.put('/:id/skills', updateMemberSkills);
router.get('/:id/feedback', getFeedback);
router.post('/:id/feedback', feedbackValidation, submitFeedback);
router.get('/:id/recognitions', getRecognitions);
router.post('/:id/recognize', recognitionValidation, recognizeTeamMember);

router.post('/leave/request', leaveValidation, requestLeave);
router.put('/leave/:leaveId/approve', approveLeave);

router.post('/invite-admin', adminOnly, invitationValidation, inviteTeamMember);
router.get('/invitations', adminOnly, getInvitations);
router.post('/invitations/:invitationId/accept', acceptInvitation);
router.post('/invitations/:invitationId/decline', declineInvitation);
router.post('/invitations/:invitationId/resend', adminOnly, resendInvitation);
router.delete('/invitations/:invitationId', adminOnly, cancelInvitation);

router.get('/roles', getRoles);
router.post('/roles', adminOnly, roleValidation, createRole);
router.put('/roles/:roleId', adminOnly, roleValidation, updateRole);
router.delete('/roles/:roleId', adminOnly, deleteRole);

router.post('/reviews', reviewValidation, createPerformanceReview);
router.get('/reviews', getPerformanceReviews);
router.put('/reviews/:reviewId', reviewValidation, updatePerformanceReview);

router.post('/goals', goalValidation, createTeamGoal);
router.put('/goals/:goalId', goalValidation, updateTeamGoal);
router.put('/goals/:goalId/complete', completeTeamGoal);

router.post('/trainings', trainingValidation, assignTraining);
router.put('/trainings/:trainingId/complete', completeTraining);

router.post('/announcements', announcementValidation, sendTeamAnnouncement);

router.post('/documents', upload.single('file'), uploadTeamDocument);
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
// ✅ /:id ROUTE - SABSE LAST ME
// ===========================================
router.get('/:id', getTeamMemberById);

module.exports = router;