const express = require("express");
const router = express.Router();

const { getDashboard, getUsers } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// get all users
router.get("/", protect, getUsers);

// dashboard
router.get("/dashboard", protect, getDashboard);

module.exports = router;