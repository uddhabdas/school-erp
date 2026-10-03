const express = require('express');
const {
  getSessions,
  getActiveSession,
  createSession,
  updateSession,
  closeSession,
  archiveSession
} = require('../controllers/academicSessionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getSessions);
router.get('/active', getActiveSession);
router.post('/', protect, authorize('super_admin'), createSession);
router.put('/:id', protect, authorize('super_admin'), updateSession);
router.put('/:id/close', protect, authorize('super_admin'), closeSession);
router.put('/:id/archive', protect, authorize('super_admin'), archiveSession);

module.exports = router;
