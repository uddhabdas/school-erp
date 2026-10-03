const express = require('express');
const { getDashboardStats, getAuditLogs } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/audit-logs', protect, authorize('super_admin', 'admin'), getAuditLogs);

module.exports = router;
