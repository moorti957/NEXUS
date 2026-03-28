// routes/contactNotificationRoutes.js

const express = require('express');
const router = express.Router();
const ContactNotification = require('../models/ContactNotification');

router.get('/', async (req, res) => {
  try {
    const data = await ContactNotification.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;