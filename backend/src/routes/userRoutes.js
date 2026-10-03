const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.post('/', protect, authorize('super_admin'), createUser);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorize('super_admin'), deleteUser);

module.exports = router;
