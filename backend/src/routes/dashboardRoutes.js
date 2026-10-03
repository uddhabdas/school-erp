const express = require('express');
const { getDashboardStats, getAuditLogs, clearAuditLogs } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/audit-logs', protect, authorize('super_admin', 'admin'), getAuditLogs);
router.delete('/audit-logs', protect, authorize('super_admin'), clearAuditLogs);

module.exports = router;
