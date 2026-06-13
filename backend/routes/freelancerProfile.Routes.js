const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
  getFreelancerProfile,
  updateFreelancerProfile,
  getPublicFreelancerProfile   
} = require('../controllers/freelancerProfileController');

router.get('/full-profile', protect, getFreelancerProfile);

router.put('/update-profile', protect, updateFreelancerProfile);

router.get('/public/:id', getPublicFreelancerProfile);

module.exports = router;