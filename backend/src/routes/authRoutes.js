const express = require('express');
const {
  login,
  getMe,
  changeStaffPassword,
  superAdminResetPassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changeStaffPassword);
router.put('/superadmin-reset-password', protect, authorize('super_admin'), superAdminResetPassword);

module.exports = router;
