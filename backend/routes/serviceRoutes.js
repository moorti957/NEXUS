const express = require('express');
const router  = express.Router();

const {
  getAllServices,
  getPublicServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} = require('../controllers/serviceController');

const { protect } = require('../middleware/auth');

// ──────────────────────────────────────────────────────────
// PUBLIC ROUTES — login की जरूरत नहीं
// Homepage, Services Page, Marketplace के लिए
// ──────────────────────────────────────────────────────────

// GET /api/services/public — सभी active services (public website)
router.get('/public', getPublicServices);

// GET /api/services/:id — single service detail page
router.get('/:id', getServiceById);

// ──────────────────────────────────────────────────────────
// PROTECTED ROUTES — login जरूरी है
// Dashboard के लिए — हर user सिर्फ अपना data देखे
// ──────────────────────────────────────────────────────────

// GET /api/services — dashboard: अपनी services
router.get('/', protect, getAllServices);

// POST /api/services — नई service बनाएं
router.post('/', protect, createService);

// PUT /api/services/:id — service update करें (ownership check controller में)
router.put('/:id', protect, updateService);

// DELETE /api/services/:id — service delete करें (ownership check controller में)
router.delete('/:id', protect, deleteService);

// PATCH /api/services/:id/status — toggle active/inactive (ownership check controller में)
router.patch('/:id/status', protect, toggleServiceStatus);

module.exports = router;