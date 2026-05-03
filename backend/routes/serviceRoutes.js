const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} = require('../controllers/serviceController');

// ── Middleware (adjust import path to match your project) ──
// If your project uses a different auth middleware name/path, update these imports.
const { protect } = require('../middleware/auth'); // adjust path as needed

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

// GET /api/services  – list all active services (or filtered)
router.get('/', getAllServices);

// GET /api/services/:id  – single service
router.get('/:id', getServiceById);

// ─────────────────────────────────────────────
// PROTECTED ROUTES (require login)
// ─────────────────────────────────────────────

// POST /api/services  – create new service
router.post('/', protect, createService);

// PUT /api/services/:id  – update service
router.put('/:id', protect, updateService);

// DELETE /api/services/:id  – delete service
router.delete('/:id', protect, deleteService);

// PATCH /api/services/:id/status  – toggle active/inactive
router.patch('/:id/status', protect, toggleServiceStatus);

module.exports = router;