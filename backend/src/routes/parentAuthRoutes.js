const express = require('express');
const {
  parentLogin,
  getParentProfile,
  getParentNotices,
  changeParentPassword
} = require('../controllers/parentAuthController');
const parentAuth = require('../middleware/parentAuth');

const router = express.Router();

router.post('/login', parentLogin);
router.get('/profile', parentAuth, getParentProfile);
router.get('/notices', parentAuth, getParentNotices);
router.put('/change-password', parentAuth, changeParentPassword);

module.exports = router;
