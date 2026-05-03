const mongoose = require('mongoose');

const contactNotificationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  company: String,
  service: String,
  budget: String,
  message: String,

  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model(
  'ContactNotification',
  contactNotificationSchema
);