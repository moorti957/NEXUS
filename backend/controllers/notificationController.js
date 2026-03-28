const Notification = require('../models/Notification');

// Get all notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const { type, isRead, page = 1, limit = 10 } = req.query;
  const filter = {
  $or: [
    { user: req.user.id },
    { user: null }
  ]
}; // ✅ FIX
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
  user: req.user.id, // ✅ FIX
  isRead: false
});

    res.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total },
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single notification
exports.getNotificationById = async (req, res) => {
  try {
   const notification = await Notification.findOne({
  _id: req.params.id,
  user: req.user.id, // ✅ FIX
});
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
  { _id: req.params.id, user: req.user.id }, // ✅ FIX
  { isRead: true },
  { new: true }
);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
   await Notification.updateMany(
  { user: req.user.id, isRead: false }, // ✅ FIX
  { isRead: true }
);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
  const notification = await Notification.findOneAndDelete({
  _id: req.params.id,
  user: req.user.id, // ✅ FIX
});
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};