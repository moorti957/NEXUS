const express = require("express");
const router = express.Router();

const { getDashboard, getUsers, getUserProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// get all users
router.get("/", protect, getUsers);

// dashboard
router.get("/dashboard", protect, getDashboard);

// 👇 NEW: get user profile + onboarding data
router.get("/profile", protect, getUserProfile);

module.exports = router;