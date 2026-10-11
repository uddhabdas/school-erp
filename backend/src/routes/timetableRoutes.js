const express = require('express');
const router = express.Router();
const {
  getTimetable,
  saveTimetable,
  getFacultyOptions,
  getMyClassTimetable,
  allocateSubjectFaculty,
  getMyTeachingSchedule
} = require('../controllers/timetableController');
const { protect, authorize } = require('../middleware/auth');
const studentAuth = require('../middleware/studentAuth');

// Student class routine endpoint
router.get('/my-routine', studentAuth, getMyClassTimetable);
router.get('/student/:studentId', getMyClassTimetable);

// Faculty & Admin endpoints
router.get('/my-schedule', protect, getMyTeachingSchedule);
router.get('/faculty-options', protect, getFacultyOptions);
router.get('/', protect, getTimetable);
router.post('/', protect, authorize('super_admin', 'admin', 'faculty'), saveTimetable);
router.post('/allocate-subject', protect, authorize('super_admin', 'admin'), allocateSubjectFaculty);

module.exports = router;
