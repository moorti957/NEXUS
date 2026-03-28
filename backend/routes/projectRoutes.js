const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Import controllers
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
  getProjectTimeline,
  addTeamMember,
  removeTeamMember,
  updateTeamMember,
  addMilestone,
  updateMilestone,
  completeMilestone,
  addTask,
  updateTask,
  deleteTask,
  addPayment
} = require('../controllers/projectController');

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ===========================================
// FILE UPLOAD CONFIGURATION
// ===========================================

// Configure multer for project file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/projects/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, documents, and zip files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// ===========================================
// VALIDATION RULES
// ===========================================

// Project ID validation
const validateProjectId = [
  param('id').isMongoId().withMessage('Invalid project ID')
];

// Create project validation
const createProjectValidation = [
  body('name')
    .notEmpty().withMessage('Project name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Project name must be between 3 and 100 characters')
    .trim()
    .escape(),

  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters')
    .trim()
    .escape(),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'Web Development',
      'Mobile App',
      'UI/UX Design',
      'Brand Identity',
      'Digital Marketing',
      'E-commerce',
      'Consulting',
      'Custom Software'
    ]).withMessage('Invalid category'),

  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Invalid start date format'),

  body('deadline')
    .notEmpty().withMessage('Deadline is required')
    .isISO8601().withMessage('Invalid deadline format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('Deadline must be after start date');
      }
      return true;
    }),

  body('budget')
    .notEmpty().withMessage('Budget is required')
    .isNumeric().withMessage('Budget must be a number')
    .custom(value => value >= 0).withMessage('Budget cannot be negative'),

  body('client')
    .notEmpty().withMessage('Client is required')
    .isMongoId().withMessage('Invalid client ID'),

  body('projectManager')
    .optional()
    .isMongoId().withMessage('Invalid project manager ID'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),

  body('technologies')
    .optional()
    .isArray().withMessage('Technologies must be an array'),

  body('features')
    .optional()
    .isArray().withMessage('Features must be an array'),
];

// Update project validation
const updateProjectValidation = [
  ...validateProjectId,
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Project name must be between 3 and 100 characters')
    .trim()
    .escape(),

  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters')
    .trim()
    .escape(),

  body('status')
    .optional()
    .isIn(['Planning', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'])
    .withMessage('Invalid status'),

  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),

  body('paymentStatus')
    .optional()
    .isIn(['Pending', 'Partial', 'Paid', 'Overdue']).withMessage('Invalid payment status'),
];

// Team member validation
const addTeamMemberValidation = [
  ...validateProjectId,
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['Lead', 'Developer', 'Designer', 'Strategist', 'Tester'])
    .withMessage('Invalid role'),

  body('hoursAllocated')
    .optional()
    .isInt({ min: 0 }).withMessage('Hours must be a positive number'),
];

const removeTeamMemberValidation = [
  ...validateProjectId,
  param('userId').isMongoId().withMessage('Invalid user ID')
];

// Milestone validation
const addMilestoneValidation = [
  ...validateProjectId,
  body('title')
    .notEmpty().withMessage('Milestone title is required')
    .isLength({ max: 200 }).withMessage('Title too long')
    .trim()
    .escape(),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description too long')
    .trim()
    .escape(),

  body('dueDate')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format'),

  body('amount')
    .optional()
    .isNumeric().withMessage('Amount must be a number')
    .custom(value => value >= 0).withMessage('Amount cannot be negative'),
];

const updateMilestoneValidation = [
  ...validateProjectId,
  param('milestoneId').isMongoId().withMessage('Invalid milestone ID'),
  body('title').optional().isLength({ max: 200 }).trim().escape(),
  body('description').optional().isLength({ max: 500 }).trim().escape(),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed']),
];

// Task validation
const addTaskValidation = [
  ...validateProjectId,
  body('title')
    .notEmpty().withMessage('Task title is required')
    .isLength({ max: 200 }).withMessage('Title too long')
    .trim()
    .escape(),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description too long')
    .trim()
    .escape(),

  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
];

const updateTaskValidation = [
  ...validateProjectId,
  param('taskId').isMongoId().withMessage('Invalid task ID'),
  body('status').optional().isIn(['Todo', 'In Progress', 'Review', 'Done']),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
];

// Payment validation
const addPaymentValidation = [
  ...validateProjectId,
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isNumeric().withMessage('Amount must be a number')
    .custom(value => value > 0).withMessage('Amount must be positive'),

  body('method')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['Bank Transfer', 'Credit Card', 'PayPal', 'Cash', 'Check'])
    .withMessage('Invalid payment method'),

  body('transactionId')
    .optional()
    .trim()
    .escape(),

  body('milestoneId')
    .optional()
    .isMongoId().withMessage('Invalid milestone ID'),
];

// ===========================================
// PROJECT ROUTES
// ===========================================

// All project routes are protected
router.use(protect);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with filters
 * @access  Private
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isString(),
  query('category').optional().isString(),
  query('priority').optional().isString(),
  query('search').optional().isString().trim().escape(),
  query('sort').optional().isString()
], getProjects);

/**
 * @route   GET /api/projects/stats
 * @desc    Get project statistics
 * @access  Private
 */
router.get('/stats', getProjectStats);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Private
 */
router.get('/:id', validateProjectId, getProjectById);

/**
 * @route   GET /api/projects/:id/timeline
 * @desc    Get project timeline
 * @access  Private
 */
router.get('/:id/timeline', validateProjectId, getProjectTimeline);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
router.post('/', createProjectValidation, createProject);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private
 */
router.put('/:id', updateProjectValidation, updateProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', adminOnly, validateProjectId, deleteProject);

// ===========================================
// TEAM MEMBER ROUTES
// ===========================================

/**
 * @route   POST /api/projects/:id/team
 * @desc    Add team member to project
 * @access  Private
 */
router.post('/:id/team', addTeamMemberValidation, addTeamMember);

/**
 * @route   PUT /api/projects/:id/team/:userId
 * @desc    Update team member role
 * @access  Private
 */
router.put('/:id/team/:userId', [
  ...validateProjectId,
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').optional().isIn(['Lead', 'Developer', 'Designer', 'Strategist', 'Tester']),
  body('hoursAllocated').optional().isInt({ min: 0 })
], updateTeamMember);

/**
 * @route   DELETE /api/projects/:id/team/:userId
 * @desc    Remove team member from project
 * @access  Private
 */
router.delete('/:id/team/:userId', removeTeamMemberValidation, removeTeamMember);

// ===========================================
// MILESTONE ROUTES
// ===========================================

/**
 * @route   POST /api/projects/:id/milestones
 * @desc    Add milestone to project
 * @access  Private
 */
router.post('/:id/milestones', addMilestoneValidation, addMilestone);

/**
 * @route   PUT /api/projects/:id/milestones/:milestoneId
 * @desc    Update milestone
 * @access  Private
 */
router.put('/:id/milestones/:milestoneId', updateMilestoneValidation, updateMilestone);

/**
 * @route   POST /api/projects/:id/milestones/:milestoneId/complete
 * @desc    Complete milestone
 * @access  Private
 */
router.post('/:id/milestones/:milestoneId/complete', [
  ...validateProjectId,
  param('milestoneId').isMongoId().withMessage('Invalid milestone ID')
], completeMilestone);

// ===========================================
// TASK ROUTES
// ===========================================

/**
 * @route   POST /api/projects/:id/tasks
 * @desc    Add task to project
 * @access  Private
 */
router.post('/:id/tasks', addTaskValidation, addTask);

/**
 * @route   PUT /api/projects/:id/tasks/:taskId
 * @desc    Update task
 * @access  Private
 */
router.put('/:id/tasks/:taskId', updateTaskValidation, updateTask);

/**
 * @route   DELETE /api/projects/:id/tasks/:taskId
 * @desc    Delete task
 * @access  Private
 */
router.delete('/:id/tasks/:taskId', [
  ...validateProjectId,
  param('taskId').isMongoId().withMessage('Invalid task ID')
], deleteTask);

// ===========================================
// PAYMENT ROUTES
// ===========================================

/**
 * @route   POST /api/projects/:id/payments
 * @desc    Add payment to project
 * @access  Private
 */
router.post('/:id/payments', addPaymentValidation, addPayment);

// ===========================================
// FILE UPLOAD ROUTES
// ===========================================

/**
 * @route   POST /api/projects/:id/documents
 * @desc    Upload project document
 * @access  Private
 */
router.post('/:id/documents', [
  ...validateProjectId,
  upload.single('document'),
  body('name').optional().trim().escape(),
  body('type').optional().isIn(['Contract', 'Brief', 'Invoice', 'Other'])
], (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/projects/${req.file.filename}`,
      size: req.file.size
    }
  });
});

// ===========================================
// BULK OPERATIONS (Admin only)
// ===========================================

/**
 * @route   POST /api/projects/bulk/delete
 * @desc    Bulk delete projects
 * @access  Private/Admin
 */
router.post('/bulk/delete', adminOnly, [
  body('projectIds').isArray().withMessage('Project IDs must be an array'),
  body('projectIds.*').isMongoId().withMessage('Invalid project ID')
], async (req, res) => {
  try {
    const { projectIds } = req.body;
    const Project = require('../models/Project');
    
    await Project.updateMany(
      { _id: { $in: projectIds } },
      { isActive: false, isArchived: true, deletedAt: Date.now() }
    );

    res.json({
      success: true,
      message: `${projectIds.length} projects deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting projects',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/projects/bulk/status
 * @desc    Bulk update project status
 * @access  Private/Admin
 */
router.post('/bulk/status', adminOnly, [
  body('projectIds').isArray().withMessage('Project IDs must be an array'),
  body('projectIds.*').isMongoId().withMessage('Invalid project ID'),
  body('status').isIn(['Planning', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'])
], async (req, res) => {
  try {
    const { projectIds, status } = req.body;
    const Project = require('../models/Project');
    
    await Project.updateMany(
      { _id: { $in: projectIds } },
      { status, updatedAt: Date.now() }
    );

    res.json({
      success: true,
      message: `${projectIds.length} projects updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating projects',
      error: error.message
    });
  }
});

// ===========================================
// EXPORT ROUTES
// ===========================================

/**
 * @route   GET /api/projects/export/csv
 * @desc    Export projects as CSV
 * @access  Private
 */
router.get('/export/csv', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const { Parser } = require('json2csv');

    const projects = await Project.find({ isActive: true })
      .populate('client', 'name company')
      .populate('projectManager', 'name email')
      .lean();

    const fields = [
      'name',
      'status',
      'category',
      'progress',
      'budget',
      'totalPaid',
      'startDate',
      'deadline',
      'client.name',
      'client.company',
      'projectManager.name'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(projects);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=projects.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting projects',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/projects/export/excel
 * @desc    Export projects as Excel
 * @access  Private
 */
router.get('/export/excel', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const ExcelJS = require('exceljs');

    const projects = await Project.find({ isActive: true })
      .populate('client', 'name company')
      .populate('projectManager', 'name email')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Projects');

    worksheet.columns = [
      { header: 'Project Name', key: 'name', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Progress (%)', key: 'progress', width: 15 },
      { header: 'Budget', key: 'budget', width: 15 },
      { header: 'Paid', key: 'totalPaid', width: 15 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'Deadline', key: 'deadline', width: 15 },
      { header: 'Client', key: 'clientName', width: 25 },
      { header: 'Company', key: 'clientCompany', width: 25 },
      { header: 'Project Manager', key: 'managerName', width: 25 }
    ];

    projects.forEach(project => {
      worksheet.addRow({
        name: project.name,
        status: project.status,
        category: project.category,
        progress: project.progress,
        budget: project.budget,
        totalPaid: project.totalPaid,
        startDate: project.startDate ? new Date(project.startDate).toLocaleDateString() : '',
        deadline: project.deadline ? new Date(project.deadline).toLocaleDateString() : '',
        clientName: project.client?.name || '',
        clientCompany: project.client?.company || '',
        managerName: project.projectManager?.name || ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=projects.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting projects',
      error: error.message
    });
  }
});

// ===========================================
// ERROR HANDLING FOR MULTER
// ===========================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
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