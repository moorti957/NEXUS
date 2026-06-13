const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require('../controllers/notificationController');

router.use(protect);

router.get('/', getNotifications);

router.get('/unread-count', getUnreadCount);

router.put('/mark-all-read', markAllAsRead);

router.get('/:id', getNotificationById);

router.put('/:id', markAsRead);

router.put('/:id/read', markAsRead);

router.delete('/:id', deleteNotification);

module.exports = router;