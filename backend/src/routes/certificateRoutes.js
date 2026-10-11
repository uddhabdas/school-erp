const express = require('express');
const router = express.Router();
const {
  getCertificates,
  getCertificateById,
  issueCertificate,
  cancelCertificate
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

// Public or student-verifiable print endpoint
router.get('/:id/print', getCertificateById);

// Staff Certificate Management
router.get('/', protect, authorize('super_admin', 'admin'), getCertificates);
router.get('/:id', protect, authorize('super_admin', 'admin'), getCertificateById);
router.post('/issue', protect, authorize('super_admin', 'admin'), issueCertificate);
router.patch('/:id/cancel', protect, authorize('super_admin', 'admin'), cancelCertificate);

module.exports = router;
