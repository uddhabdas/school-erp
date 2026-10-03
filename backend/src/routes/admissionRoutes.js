const express = require('express');
const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  approveApplication,
  rejectApplication
} = require('../controllers/admissionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'transferCertificate', maxCount: 1 }
]), createApplication);
router.get('/', protect, getApplications);
router.get('/:id', protect, getApplicationById);
router.put('/:id', protect, updateApplication);
router.put('/:id/approve', protect, authorize('super_admin', 'admin', 'faculty'), approveApplication);
router.put('/:id/reject', protect, authorize('super_admin', 'admin', 'faculty'), rejectApplication);

module.exports = router;
