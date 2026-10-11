const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getRbacMatrix,
  updateRbacMatrix,
  resetRbacMatrix
} = require('../controllers/rbacController');

// Super Admin and Admin can view the active RBAC matrix
router.get('/', protect, authorize('super_admin', 'admin'), getRbacMatrix);

// Only Super Admin can modify or reset the RBAC matrix manually
router.put('/', protect, authorize('super_admin'), updateRbacMatrix);
router.post('/reset', protect, authorize('super_admin'), resetRbacMatrix);

module.exports = router;
