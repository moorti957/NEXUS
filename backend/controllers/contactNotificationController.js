const ContactNotification = require('../models/ContactNotification');

exports.getContacts = async (req, res) => {
  const data = await ContactNotification.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    data
  });
};