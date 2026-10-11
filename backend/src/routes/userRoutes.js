const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignFacultyClassAndTeacher
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.post('/', protect, authorize('super_admin', 'admin'), createUser);
router.put('/:id', protect, updateUser);
router.patch('/:id/status', protect, authorize('super_admin', 'admin'), toggleUserStatus);
router.put('/:id/assign-class', protect, authorize('super_admin', 'admin'), assignFacultyClassAndTeacher);
router.delete('/:id', protect, authorize('super_admin'), deleteUser);

module.exports = router;
