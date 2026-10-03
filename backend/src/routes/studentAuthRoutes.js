const express = require('express');
const {
  studentLogin,
  getStudentProfile,
  updateStudentProfile,
  changeStudentPassword
} = require('../controllers/studentAuthController');
const studentAuth = require('../middleware/studentAuth');

const router = express.Router();

router.post('/login', studentLogin);
router.get('/profile', studentAuth, getStudentProfile);
router.put('/profile', studentAuth, updateStudentProfile);
router.put('/change-password', studentAuth, changeStudentPassword);

module.exports = router;
