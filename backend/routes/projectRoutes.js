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
  addPayment,

  // ADD THESE
  getClientProjects,
  getProjectMilestones,
  getProjectTasks,
  updateProjectProgress

} = require('../controllers/projectController');

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ===========================================
// FILE UPLOAD CONFIGURATION
// ===========================================
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
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Only images, documents, and zip files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

// ===========================================
// FREELANCER ACCESS CONTROL MIDDLEWARE
// ===========================================
const checkProjectAccess = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projectId = req.params.id;
    const userId = req.user.id;

    const project = await Project.findById(projectId).select('createdBy members');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user is creator OR a member
    const isCreator = project.createdBy.toString() === userId;
    const isMember = project.members.some(m => m.toString() === userId);

    if (!isCreator && !isMember) {
      return res.status(403).json({ success: false, message: 'You do not have access to this project' });
    }

    req.project = project; // attach for later use if needed
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// VALIDATION RULES (unchanged)
// ===========================================
const validateProjectId = [
  param('id').isMongoId().withMessage('Invalid project ID')
];

const createProjectValidation = [
  body('name').notEmpty().withMessage('Project name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Project name must be between 3 and 100 characters')
    .trim().escape(),
  body('description').notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters')
    .trim().escape(),
  body('category').notEmpty().withMessage('Category is required')
    .isIn(['Web Development','Mobile App','UI/UX Design','Brand Identity','Digital Marketing','E-commerce','Consulting','Custom Software'])
    .withMessage('Invalid category'),
  body('startDate').notEmpty().withMessage('Start date is required').isISO8601(),
  body('deadline').notEmpty().withMessage('Deadline is required').isISO8601()
    .custom((value, { req }) => new Date(value) > new Date(req.body.startDate) || 'Deadline must be after start date'),
  body('budget').notEmpty().withMessage('Budget is required').isNumeric().custom(v => v >= 0),
  body('client').notEmpty().withMessage('Client is required').isMongoId(),
  body('projectManager').optional().isMongoId(),
  body('priority').optional().isIn(['Low','Medium','High','Critical']),
  body('technologies').optional().isArray(),
  body('features').optional().isArray(),
];

const updateProjectValidation = [
  ...validateProjectId,
  body('name').optional().isLength({ min: 3, max: 100 }).trim().escape(),
  body('description').optional().isLength({ min: 10, max: 2000 }).trim().escape(),
  body('status').optional().isIn(['Planning','In Progress','Review','Completed','On Hold','Cancelled']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('priority').optional().isIn(['Low','Medium','High','Critical']),
  body('paymentStatus').optional().isIn(['Pending','Partial','Paid','Overdue']),
];

const addTeamMemberValidation = [
  ...validateProjectId,
  body('userId').notEmpty().isMongoId(),
  body('role').notEmpty().isIn(['Lead','Developer','Designer','Strategist','Tester']),
  body('hoursAllocated').optional().isInt({ min: 0 }),
];

const removeTeamMemberValidation = [
  ...validateProjectId,
  param('userId').isMongoId()
];

const addMilestoneValidation = [
  ...validateProjectId,
  body('title').notEmpty().isLength({ max: 200 }).trim().escape(),
  body('description').optional().isLength({ max: 500 }).trim().escape(),
  body('dueDate').notEmpty().isISO8601(),
  body('amount').optional().isNumeric().custom(v => v >= 0),
];

const updateMilestoneValidation = [
  ...validateProjectId,
  param('milestoneId').isMongoId(),
  body('title').optional().isLength({ max: 200 }).trim().escape(),
  body('description').optional().isLength({ max: 500 }).trim().escape(),
  body('status').optional().isIn(['Pending','In Progress','Completed']),
];

const addTaskValidation = [
  ...validateProjectId,
  body('title').notEmpty().isLength({ max: 200 }).trim().escape(),
  body('description').optional().isLength({ max: 500 }).trim().escape(),
  body('assignedTo').optional().isMongoId(),
  body('dueDate').optional().isISO8601(),
  body('priority').optional().isIn(['Low','Medium','High']),
];

const updateTaskValidation = [
  ...validateProjectId,
  param('taskId').isMongoId(),
  body('status').optional().isIn(['Todo','In Progress','Review','Done']),
  body('priority').optional().isIn(['Low','Medium','High']),
];

const addPaymentValidation = [
  ...validateProjectId,
  body('amount').notEmpty().isNumeric().custom(v => v > 0),
  body('method').notEmpty().isIn(['Bank Transfer','Credit Card','PayPal','Cash','Check']),
  body('transactionId').optional().trim().escape(),
  body('milestoneId').optional().isMongoId(),
];

// ===========================================
// PROJECT ROUTES (with access control)
// ===========================================
router.use(protect); // all routes require authentication

// GET / – filter projects for the logged-in freelancer
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isString(),
  query('category').optional().isString(),
  query('priority').optional().isString(),
  query('search').optional().isString().trim().escape(),
  query('sort').optional().isString()
], async (req, res, next) => {
  // Attach a filter object to req so the controller only sees the user's projects
  req.userProjectFilter = {
    $or: [
      { createdBy: req.user.id },
      { members: req.user.id }
    ]
  };
  next();
}, getProjects);


router.get(
 '/client-projects',
 protect,
 getClientProjects
);

router.get(
 '/:id/milestones',
 validateProjectId,
 checkProjectAccess,
 getProjectMilestones
);

router.get(
 '/:id/tasks',
 validateProjectId,
 checkProjectAccess,
 getProjectTasks
);


// ===========================================
// MY DASHBOARD (Freelancer specific)
// ===========================================
router.get('/my-dashboard', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');

    const userId = req.user.id;

    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { members: userId }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        stats: {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'In Progress').length,
          completedProjects: projects.filter(p => p.status === 'Completed').length,
        },
        recentProjects: projects
      }
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

router.get('/stats', getProjectStats);


router.post('/', createProjectValidation, createProject);
router.put('/:id', updateProjectValidation, checkProjectAccess, updateProject);
router.delete('/:id', adminOnly, validateProjectId, checkProjectAccess, deleteProject);

// ===========================================
// TEAM MEMBER ROUTES (access controlled)
// ===========================================
router.post('/:id/team', addTeamMemberValidation, checkProjectAccess, addTeamMember);
router.put('/:id/team/:userId', [
  ...validateProjectId,
  param('userId').isMongoId(),
  body('role').optional().isIn(['Lead','Developer','Designer','Strategist','Tester']),
  body('hoursAllocated').optional().isInt({ min: 0 })
], checkProjectAccess, updateTeamMember);
router.delete('/:id/team/:userId', removeTeamMemberValidation, checkProjectAccess, removeTeamMember);

// ===========================================
// MILESTONE ROUTES
// ===========================================


// ===========================================
// PAYMENT ROUTES
// ===========================================
router.post('/:id/payments', addPaymentValidation, checkProjectAccess, addPayment);

// ===========================================
// FILE UPLOAD
// ===========================================
router.post('/:id/documents', [
  ...validateProjectId,
  upload.single('document'),
  body('name').optional().trim().escape(),
  body('type').optional().isIn(['Contract','Brief','Invoice','Other'])
], checkProjectAccess, (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a file' });
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
// BULK OPERATIONS (Admin only – already restricted)
// ===========================================
router.post('/bulk/delete', adminOnly, [
  body('projectIds').isArray(),
  body('projectIds.*').isMongoId()
], async (req, res) => {
  try {
    const { projectIds } = req.body;
    const Project = require('../models/Project');
    await Project.updateMany(
      { _id: { $in: projectIds } },
      { isActive: false, isArchived: true, deletedAt: Date.now() }
    );
    res.json({ success: true, message: `${projectIds.length} projects deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/bulk/status', adminOnly, [
  body('projectIds').isArray(),
  body('projectIds.*').isMongoId(),
  body('status').isIn(['Planning','In Progress','Review','Completed','On Hold','Cancelled'])
], async (req, res) => {
  try {
    const { projectIds, status } = req.body;
    const Project = require('../models/Project');
    await Project.updateMany({ _id: { $in: projectIds } }, { status, updatedAt: Date.now() });
    res.json({ success: true, message: `${projectIds.length} projects updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// EXPORT ROUTES (CSV/Excel) – also filter by user
// ===========================================
router.get('/export/csv', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const { Parser } = require('json2csv');
    const projects = await Project.find({
      $or: [{ createdBy: req.user.id }, { members: req.user.id }],
      isActive: true
    })
      .populate('client', 'name company')
      .populate('projectManager', 'name email')
      .lean();
    const fields = ['name','status','category','progress','budget','totalPaid','startDate','deadline','client.name','client.company','projectManager.name'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(projects);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=projects.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/export/excel', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const ExcelJS = require('exceljs');
    const projects = await Project.find({
      $or: [{ createdBy: req.user.id }, { members: req.user.id }],
      isActive: true
    })
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
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/milestones', addMilestoneValidation, checkProjectAccess, addMilestone);
router.put('/:id/milestones/:milestoneId', updateMilestoneValidation, checkProjectAccess, updateMilestone);
router.post('/:id/milestones/:milestoneId/complete', [
  ...validateProjectId,
  param('milestoneId').isMongoId()
], checkProjectAccess, completeMilestone);

// ===========================================
// TASK ROUTES
// ===========================================
router.post('/:id/tasks', addTaskValidation, checkProjectAccess, addTask);
router.put('/:id/tasks/:taskId', updateTaskValidation, checkProjectAccess, updateTask);
router.delete('/:id/tasks/:taskId', [
  ...validateProjectId,
  param('taskId').isMongoId()
], checkProjectAccess, deleteTask);


router.put(
 '/:id/progress',
 validateProjectId,
 checkProjectAccess,
 updateProjectProgress
);
router.get('/:id/timeline', validateProjectId, checkProjectAccess, getProjectTimeline);

router.get('/:id', validateProjectId, checkProjectAccess, getProjectById);

// ===========================================
// MULTER ERROR HANDLING
// ===========================================
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
  next(error);
});

module.exports = router;