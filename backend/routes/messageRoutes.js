const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { getMessagesWithUser } = require('../controllers/messageController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/messages/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'msg-' + uniqueSuffix + path.extname(file.originalname));
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
  // Conversations
  getConversations,
  getConversationMessages,
  
  // CRUD
  sendMessage,
  replyToMessage,
  getMessageById,
  
  // Actions
  markAsRead,
  markAllAsRead,
  toggleImportant,
  toggleStar,
  addReaction,
  
  // Organization
  getUnreadCount,
  getImportantMessages,
  getStarredMessages,
  searchMessages,
  
  // Statistics
  getMessageStats,
  
  // Archive & Delete
  archiveMessage,
  deleteMessage,
  archiveConversation,
  
  // Attachments
  uploadAttachment,
  
  // Scheduled
  scheduleMessage,
  getScheduledMessages
} = require('../controllers/messageController');

// ===========================================
// VALIDATION RULES
// ===========================================

const messageValidation = [
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('receiverModel').isIn(['User', 'Client']).withMessage('Valid receiver model is required'),
  body('subject').notEmpty().withMessage('Subject is required').trim(),
  body('content').notEmpty().withMessage('Content is required').trim(),
  body('messageType').optional().isIn(['general', 'project', 'invoice', 'proposal', 'support', 'feedback', 'meeting']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
];

const replyValidation = [
  body('content').notEmpty().withMessage('Reply content is required').trim()
];

const reactionValidation = [
  body('emoji').notEmpty().withMessage('Emoji is required')
];

const scheduleValidation = [
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('receiverModel').isIn(['User', 'Client']).withMessage('Valid receiver model is required'),
  body('subject').notEmpty().withMessage('Subject is required').trim(),
  body('content').notEmpty().withMessage('Content is required').trim(),
  body('scheduledFor').isISO8601().withMessage('Valid scheduled date is required')
];

// ===========================================
// PROTECT ALL ROUTES
// ===========================================
router.use(protect);


// ===========================================
// CHAT ROUTE
// ===========================================

// CHAT
router.get('/chat/:userId', getMessagesWithUser);

// CONVERSATIONS
router.get('/conversations', getConversations);
router.get('/conversations/:conversationId', getConversationMessages);
router.put('/conversations/:conversationId/read-all', markAllAsRead);
router.put('/conversations/:conversationId/archive', archiveConversation);

// ORGANIZATION
router.get('/unread/count', getUnreadCount);
router.get('/important', getImportantMessages);
router.get('/starred', getStarredMessages);
router.get('/search', searchMessages);

// STATS
router.get('/stats', getMessageStats);

// SCHEDULED
router.get('/scheduled', getScheduledMessages);

// ATTACHMENTS
router.post('/attachments', upload.single('file'), uploadAttachment);

// MESSAGE CRUD
router.post('/', messageValidation, sendMessage);
router.post('/:messageId/reply', replyValidation, replyToMessage);

// MESSAGE ACTIONS
router.put('/:messageId/read', markAsRead);
router.put('/:messageId/toggle-important', toggleImportant);
router.put('/:messageId/toggle-star', toggleStar);
router.post('/:messageId/reactions', reactionValidation, addReaction);
router.put('/:messageId/archive', archiveMessage);

// DELETE
router.delete('/:messageId', deleteMessage);

// LAST ROUTE (VERY IMPORTANT)
router.get('/:messageId', getMessageById);


// ===========================================
// MULTER ERROR HANDLER
// ===========================================

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