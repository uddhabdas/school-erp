const express = require('express');
const router = express.Router();
const {
  getExams,
  createExam,
  getExamById,
  updateExam,
  deleteExam,
  togglePublish,
  getMarksGrid,
  saveBulkMarks,
  getStudentReportCard,
  getMyExamResults,
  getClassWiseStudents
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');
const studentAuth = require('../middleware/studentAuth');
const parentAuth = require('../middleware/parentAuth');

// Student & Parent Result Endpoints
router.get('/my-results/student', studentAuth, getMyExamResults);
router.get('/my-results/parent', parentAuth, getMyExamResults);

// Class-wise Students with Marksheet summaries (independent of session)
router.get('/class-students', protect, authorize('super_admin', 'admin', 'faculty'), getClassWiseStudents);

// Report Card View & Print Endpoint (accessible by exam and student ID)
router.get('/:examId/report-card/:studentId', getStudentReportCard);

// Admin & Faculty Exam Management
router.get('/', protect, authorize('super_admin', 'admin', 'faculty'), getExams);
router.post('/', protect, authorize('super_admin', 'admin'), createExam);
router.get('/:id', protect, authorize('super_admin', 'admin', 'faculty'), getExamById);
router.put('/:id', protect, authorize('super_admin', 'admin'), updateExam);
router.delete('/:id', protect, authorize('super_admin', 'admin'), deleteExam);
router.patch('/:id/publish', protect, authorize('super_admin', 'admin'), togglePublish);

// Marks Evaluation & Grid
router.get('/:id/marks-grid', protect, authorize('super_admin', 'admin', 'faculty'), getMarksGrid);
router.post('/:id/marks', protect, authorize('super_admin', 'admin', 'faculty'), saveBulkMarks);

module.exports = router;
