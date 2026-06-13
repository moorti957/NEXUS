const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');

const {
  acceptFreelancer,
  getMyCollaborations,
} = require('../controllers/collaborationController');

router.post('/accept', protect, acceptFreelancer);

router.get('/mine', protect, getMyCollaborations);

module.exports = router;