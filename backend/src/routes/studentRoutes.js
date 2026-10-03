const express = require('express');
const {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  promoteStudents,
  getStudentHistory
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getStudents);
router.get('/:id', protect, getStudentById);
router.get('/:id/history', protect, getStudentHistory);
router.put('/:id', protect, authorize('super_admin', 'admin'), updateStudent);
router.delete('/:id', protect, authorize('super_admin'), deleteStudent);
router.post('/promote', protect, authorize('super_admin'), promoteStudents);

module.exports = router;
