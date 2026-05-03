const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');



// Import controllers
const {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  addContactHistory,
  getContactHistory,
  addNote,
  getNotes,
  updateNote,
  deleteNote,
  addFeedback,
  getPaymentHistory,
  addReferral,
  updateReferralStatus,
  uploadDocument,
  deleteDocument,
  searchClients
} = require('../controllers/clientController');

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ===========================================
// FILE UPLOAD CONFIGURATION
// ===========================================

// Configure multer for client document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/clients/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'client-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, documents, and spreadsheets are allowed'));
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

// Client ID validation
const validateClientId = [
  param('id').isMongoId().withMessage('Invalid client ID')
];

// Create client validation
const createClientValidation = [
  body('name')
    .notEmpty().withMessage('Client name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes')
    .trim()
    .escape(),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid phone number'),

  body('company')
    .optional()
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters')
    .trim()
    .escape(),

  body('position')
    .optional()
    .isLength({ max: 100 }).withMessage('Position cannot exceed 100 characters')
    .trim()
    .escape(),

  body('website')
    .optional()
    .isURL().withMessage('Please provide a valid website URL'),

  body('industry')
    .optional()
    .isLength({ max: 100 }).withMessage('Industry cannot exceed 100 characters')
    .trim()
    .escape(),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Lead', 'Past Client']).withMessage('Invalid status'),

  body('clientType')
    .optional()
    .isIn(['New', 'Regular', 'VIP', 'Enterprise']).withMessage('Invalid client type'),

  body('leadSource')
    .optional()
    .isIn(['Website', 'Referral', 'Social Media', 'Google', 'Direct', 'Other'])
    .withMessage('Invalid lead source'),

  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),

  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),

  body('socialLinks')
    .optional()
    .isObject().withMessage('Social links must be an object'),
];

// Update client validation
const updateClientValidation = [
  ...validateClientId,
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes')
    .trim()
    .escape(),

  body('email')
    .optional()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid phone number'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Lead', 'Past Client']).withMessage('Invalid status'),

  body('clientType')
    .optional()
    .isIn(['New', 'Regular', 'VIP', 'Enterprise']).withMessage('Invalid client type'),

  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),

  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
];

// Contact history validation
const addContactValidation = [
  ...validateClientId,
  body('type')
    .notEmpty().withMessage('Contact type is required')
    .isIn(['Call', 'Email', 'Meeting', 'Message']).withMessage('Invalid contact type'),

  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
    .trim()
    .escape(),

  body('projectId')
    .optional()
    .isMongoId().withMessage('Invalid project ID'),
];

// Note validation
const addNoteValidation = [
  ...validateClientId,
  body('title')
    .notEmpty().withMessage('Note title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters')
    .trim()
    .escape(),

  body('content')
    .notEmpty().withMessage('Note content is required')
    .isLength({ max: 1000 }).withMessage('Content cannot exceed 1000 characters')
    .trim()
    .escape(),

  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean'),
];

const updateNoteValidation = [
  ...validateClientId,
  param('noteId').isMongoId().withMessage('Invalid note ID'),
  body('title').optional().isLength({ max: 200 }).trim().escape(),
  body('content').optional().isLength({ max: 1000 }).trim().escape(),
  body('isPrivate').optional().isBoolean(),
];

// Feedback validation
const addFeedbackValidation = [
  ...validateClientId,
  body('projectId')
    .notEmpty().withMessage('Project ID is required')
    .isMongoId().withMessage('Invalid project ID'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('review')
    .optional()
    .isLength({ max: 500 }).withMessage('Review cannot exceed 500 characters')
    .trim()
    .escape(),
];

// Referral validation
const addReferralValidation = [
  ...validateClientId,
  body('clientId')
    .notEmpty().withMessage('Referred client ID is required')
    .isMongoId().withMessage('Invalid client ID'),
];

const updateReferralValidation = [
  ...validateClientId,
  param('referralId').isMongoId().withMessage('Invalid referral ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Pending', 'Converted', 'Lost']).withMessage('Invalid status'),
];

// Document validation
const uploadDocumentValidation = [
  ...validateClientId,
  body('name')
    .notEmpty().withMessage('Document name is required')
    .isLength({ max: 200 }).withMessage('Name too long')
    .trim()
    .escape(),

  body('type')
    .notEmpty().withMessage('Document type is required')
    .isIn(['Contract', 'Brief', 'Invoice', 'Other']).withMessage('Invalid document type'),
];

// Payment history validation
const paymentHistoryValidation = [
  ...validateClientId,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

// ===========================================
// CLIENT ROUTES
// ===========================================

// All client routes are protected
router.use(protect);

/**
 * @route   GET /api/clients
 * @desc    Get all clients with filters
 * @access  Private
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isString(),
  query('type').optional().isString(),
  query('search').optional().isString().trim().escape(),
  query('assignedTo').optional().isMongoId(),
  query('sort').optional().isString()
], getClients);

/**
 * @route   GET /api/clients/stats
 * @desc    Get client statistics
 * @access  Private
 */
router.get('/stats', getClientStats);

/**
 * @route   GET /api/clients/search
 * @desc    Search clients
 * @access  Private
 */
router.get('/search', [
  query('q').notEmpty().withMessage('Search query is required').trim().escape()
], searchClients);



/**
 * @route   GET /api/clients/export
 * @desc    Export clients data
 * @access  Private (Admin only)
 */
// router.get('/export', adminOnly, [
//   query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format')
// ], exportClients);





/**
 * @route   POST /api/clients
 * @desc    Create new client
 * @access  Private
 */
router.post('/', createClientValidation, createClient);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update client
 * @access  Private
 */
router.put('/:id', updateClientValidation, updateClient);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete client (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', adminOnly, [
  ...validateClientId,
  body('force').optional().isBoolean()
], deleteClient);

// ===========================================
// CONTACT HISTORY ROUTES
// ===========================================

/**
 * @route   POST /api/clients/:id/contact
 * @desc    Add contact history
 * @access  Private
 */
router.post('/:id/contact', addContactValidation, addContactHistory);

/**
 * @route   GET /api/clients/:id/contact
 * @desc    Get contact history
 * @access  Private
 */
router.get('/:id/contact', validateClientId, getContactHistory);

// ===========================================
// NOTES ROUTES
// ===========================================

/**
 * @route   POST /api/clients/:id/notes
 * @desc    Add note to client
 * @access  Private
 */
router.post('/:id/notes', addNoteValidation, addNote);

/**
 * @route   GET /api/clients/:id/notes
 * @desc    Get client notes
 * @access  Private
 */
router.get('/:id/notes', validateClientId, getNotes);

/**
 * @route   PUT /api/clients/:id/notes/:noteId
 * @desc    Update note
 * @access  Private
 */
router.put('/:id/notes/:noteId', updateNoteValidation, updateNote);

/**
 * @route   DELETE /api/clients/:id/notes/:noteId
 * @desc    Delete note
 * @access  Private
 */
router.delete('/:id/notes/:noteId', [
  ...validateClientId,
  param('noteId').isMongoId().withMessage('Invalid note ID')
], deleteNote);

// ===========================================
// FEEDBACK ROUTES
// ===========================================

/**
 * @route   POST /api/clients/:id/feedback
 * @desc    Add client feedback
 * @access  Private
 */
router.post('/:id/feedback', addFeedbackValidation, addFeedback);

// ===========================================
// PAYMENT ROUTES
// ===========================================

/**
 * @route   GET /api/clients/:id/payments
 * @desc    Get client payment history
 * @access  Private
 */
router.get('/:id/payments', paymentHistoryValidation, getPaymentHistory);

// ===========================================
// REFERRAL ROUTES
// ===========================================

/**
 * @route   POST /api/clients/:id/referrals
 * @desc    Add referral
 * @access  Private
 */
router.post('/:id/referrals', addReferralValidation, addReferral);

/**
 * @route   PUT /api/clients/:id/referrals/:referralId
 * @desc    Update referral status
 * @access  Private
 */
router.put('/:id/referrals/:referralId', updateReferralValidation, updateReferralStatus);

// ===========================================
// DOCUMENT ROUTES
// ===========================================

/**
 * @route   POST /api/clients/:id/documents
 * @desc    Upload client document
 * @access  Private
 */
router.post('/:id/documents', [
  ...validateClientId,
  upload.single('document'),
  body('name').notEmpty().withMessage('Document name is required').trim().escape(),
  body('type').isIn(['Contract', 'Brief', 'Invoice', 'Other']).withMessage('Invalid document type')
], (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }
  next();
}, uploadDocument);

/**
 * @route   DELETE /api/clients/:id/documents/:docId
 * @desc    Delete document
 * @access  Private
 */
router.delete('/:id/documents/:docId', [
  ...validateClientId,
  param('docId').isMongoId().withMessage('Invalid document ID')
], deleteDocument);

// ===========================================
// BULK OPERATIONS (Admin only)
// ===========================================

/**
 * @route   POST /api/clients/bulk/delete
 * @desc    Bulk delete clients
 * @access  Private/Admin
 */
router.post('/bulk/delete', adminOnly, [
  body('clientIds').isArray().withMessage('Client IDs must be an array'),
  body('clientIds.*').isMongoId().withMessage('Invalid client ID')
], async (req, res) => {
  try {
    const { clientIds } = req.body;
    const Client = require('../models/Client');
    const Project = require('../models/Project');
    
    // Check if clients have active projects
    const activeProjects = await Project.countDocuments({
      client: { $in: clientIds },
      status: { $in: ['In Progress', 'Planning'] }
    });

    if (activeProjects > 0 && !req.body.force) {
      return res.status(400).json({
        success: false,
        message: `${activeProjects} clients have active projects. Use force=true to delete anyway`
      });
    }

    await Client.updateMany(
      { _id: { $in: clientIds } },
      { isActive: false, isDeleted: true, deletedAt: Date.now() }
    );

    res.json({
      success: true,
      message: `${clientIds.length} clients deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting clients',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/clients/bulk/status
 * @desc    Bulk update client status
 * @access  Private/Admin
 */
router.post('/bulk/status', adminOnly, [
  body('clientIds').isArray().withMessage('Client IDs must be an array'),
  body('clientIds.*').isMongoId().withMessage('Invalid client ID'),
  body('status').isIn(['Active', 'Inactive', 'Lead', 'Past Client']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const { clientIds, status } = req.body;
    const Client = require('../models/Client');
    
    await Client.updateMany(
      { _id: { $in: clientIds } },
      { status, updatedAt: Date.now() }
    );

    res.json({
      success: true,
      message: `${clientIds.length} clients updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating clients',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/clients/bulk/assign
 * @desc    Bulk assign account manager
 * @access  Private/Admin
 */
router.post('/bulk/assign', adminOnly, [
  body('clientIds').isArray().withMessage('Client IDs must be an array'),
  body('clientIds.*').isMongoId().withMessage('Invalid client ID'),
  body('userId').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const { clientIds, userId } = req.body;
    const Client = require('../models/Client');
    const User = require('../models/User');
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await Client.updateMany(
      { _id: { $in: clientIds } },
      { assignedTo: userId, updatedAt: Date.now() }
    );

    res.json({
      success: true,
      message: `${clientIds.length} clients assigned to ${user.name}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning clients',
      error: error.message
    });
  }
});

// ===========================================
// EXPORT ROUTES
// ===========================================

/**
 * @route   GET /api/clients/export/csv
 * @desc    Export clients as CSV
 * @access  Private
 */
router.get('/export/csv', protect, async (req, res) => {
  try {
    const Client = require('../models/Client');
    const { Parser } = require('json2csv');

    const clients = await Client.find({ isActive: true })
      .populate('assignedTo', 'name email')
      .populate('projects', 'name status')
      .lean();

    const fields = [
      'name',
      'email',
      'phone',
      'company',
      'position',
      'status',
      'clientType',
      'totalSpent',
      'totalProjects',
      'leadSource',
      'assignedTo.name',
      'createdAt'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(clients);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting clients',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/clients/export/excel
 * @desc    Export clients as Excel
 * @access  Private
 */
router.get('/export/excel', protect, async (req, res) => {
  try {
    const Client = require('../models/Client');
    const ExcelJS = require('exceljs');

    const clients = await Client.find({ isActive: true })
      .populate('assignedTo', 'name email')
      .populate('projects', 'name status')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clients');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Type', key: 'clientType', width: 15 },
      { header: 'Total Spent', key: 'totalSpent', width: 15 },
      { header: 'Projects', key: 'totalProjects', width: 15 },
      { header: 'Lead Source', key: 'leadSource', width: 15 },
      { header: 'Account Manager', key: 'managerName', width: 20 },
      { header: 'Created Date', key: 'createdAt', width: 15 }
    ];

    clients.forEach(client => {
      worksheet.addRow({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        position: client.position,
        status: client.status,
        clientType: client.clientType,
        totalSpent: client.totalSpent,
        totalProjects: client.projects?.length || 0,
        leadSource: client.leadSource,
        managerName: client.assignedTo?.name || '',
        createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting clients',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/clients/:id
 * @desc    Get single client by ID
 * @access  Private
 */
router.get('/:id', validateClientId, getClientById);

// ===========================================
// RECENT ACTIVITY ROUTE
// ===========================================

/**
 * @route   GET /api/clients/:id/activity
 * @desc    Get client recent activity
 * @access  Private
 */
router.get('/:id/activity', validateClientId, async (req, res) => {
  try {
    const Client = require('../models/Client');
    const Project = require('../models/Project');
    const Message = require('../models/Message');

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const [projects, messages, payments] = await Promise.all([
      Project.find({ client: client._id })
        .sort('-updatedAt')
        .limit(5)
        .select('name status updatedAt'),

      Message.find({ receiver: client._id })
        .sort('-createdAt')
        .limit(5)
        .select('subject content createdAt read'),

      // Get recent payments from client's payment history
      Promise.resolve(client.paymentHistory.slice(-5).reverse())
    ]);

    const activity = [
      ...projects.map(p => ({
        type: 'project',
        title: p.name,
        description: `Project ${p.status}`,
        date: p.updatedAt,
        icon: '📁'
      })),
      ...messages.map(m => ({
        type: 'message',
        title: m.subject,
        description: m.content.substring(0, 100),
        date: m.createdAt,
        icon: '💬'
      })),
      ...payments.map(p => ({
        type: 'payment',
        title: `Payment of $${p.amount}`,
        description: `Via ${p.method}`,
        date: p.paidAt,
        icon: '💰'
      }))
    ].sort((a, b) => b.date - a.date).slice(0, 10);

    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching client activity',
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