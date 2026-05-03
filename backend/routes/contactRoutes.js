const express = require('express');
const router = express.Router();
const ContactNotification = require('../models/ContactNotification');

console.log("🔥 CONTACT ROUTE LOADED");

router.post('/', async (req, res) => {
  try {
    console.log("🔥 CONTACT ROUTE HIT");

    const { name, email, phone, message, company, service, budget } = req.body;

    console.log("📩 CONTACT FORM 👉", req.body);

    const newContact = await ContactNotification.create({
      name,
      email,
      phone,
      message,
      company,
      service,
      budget
    });

    console.log("✅ SAVED 👉", newContact);

    res.json({
      success: true,
      message: "Saved successfully"
    });

  } catch (err) {
    console.error("❌ ERROR 👉", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;