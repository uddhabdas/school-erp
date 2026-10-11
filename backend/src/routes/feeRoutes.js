const express = require('express');
const router = express.Router();
const {
  getFeeStructures,
  createFeeStructure,
  deleteFeeStructure,
  collectFeePayment,
  getFeePayments,
  getStudentFeeDetails
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');
const { allowStudentParentOrStaff } = require('../middleware/multiAuth');

router.get('/structures', protect, authorize('super_admin', 'admin'), getFeeStructures);
router.post('/structures', protect, authorize('super_admin', 'admin'), createFeeStructure);
router.delete('/structures/:id', protect, authorize('super_admin', 'admin'), deleteFeeStructure);

router.get('/payments', protect, authorize('super_admin', 'admin'), getFeePayments);
router.post('/payments', protect, authorize('super_admin', 'admin'), collectFeePayment);
router.get('/student/:studentId', allowStudentParentOrStaff, getStudentFeeDetails);

module.exports = router;
