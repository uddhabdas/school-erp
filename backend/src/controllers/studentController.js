const Student = require('../models/Student');
const StudentAcademicHistory = require('../models/StudentAcademicHistory');
const logAction = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

const { escapeRegex } = require('../utils/sanitize');

// @desc    Get all students with search & filter (and optional pagination)
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res) => {
  try {
    const { search, status, class: studentClass, sessionId, page, limit } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (studentClass && studentClass !== 'all') {
      query['academic.class'] = studentClass;
    }

    if (sessionId) {
      query['academic.sessionId'] = sessionId;
    }

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: escapeRegex(search.trim()), $options: 'i' };
      query.$or = [
        { 'personal.name': searchRegex },
        { studentId: searchRegex },
        { admissionNo: searchRegex },
        { 'personal.mobile': searchRegex },
        { 'personal.aadhaar': searchRegex }
      ];
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;

      const [students, total] = await Promise.all([
        Student.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        Student.countDocuments(query)
      ]);

      return res.json({
        students,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      });
    }

    let studentQuery = Student.find(query)
      .select('-password')
      .sort({ 'academic.class': 1, 'academic.rollNo': 1, 'personal.name': 1 });

    if (limit) {
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
      studentQuery = studentQuery.limit(limitNum);
    }

    const students = await studentQuery;
    res.json(students);
  } catch (error) {
    console.error('Error in getStudents:', error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error in getStudentById:', error);
    res.status(500).json({ message: 'Server error fetching student' });
  }
};

// @desc    Get academic history of student
// @route   GET /api/students/:id/history
// @access  Private
const getStudentHistory = async (req, res) => {
  try {
    const history = await StudentAcademicHistory.find({ studentId: req.params.id })
      .populate('promotedBy', 'name email')
      .sort({ promotedAt: -1, createdAt: -1 });

    res.json(history);
  } catch (error) {
    console.error('Error in getStudentHistory:', error);
    res.status(500).json({ message: 'Server error fetching student history' });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Super Admin, Admin)
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const oldData = { ...student.toObject() };
    const updateData = { ...req.body };

    // If password update requested, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    // Automatically record pass out event in academic history
    if (updateData.status === 'passed_out' && oldData.status !== 'passed_out') {
      try {
        await StudentAcademicHistory.create({
          studentId: student._id,
          oldSession: student.academic?.sessionName,
          oldClass: student.academic?.class,
          newSession: student.academic?.sessionName,
          newClass: student.academic?.class,
          passedOutBatch: student.academic?.sessionName || new Date().getFullYear().toString(),
          promotedBy: req.user._id,
          promotedAt: new Date()
        });
      } catch (histErr) {
        console.error('Error recording pass out history:', histErr);
      }
    }

    await logAction(
      req.user._id,
      'update',
      'Student',
      student._id,
      oldData,
      updatedStudent
    );

    res.json(updatedStudent);
  } catch (error) {
    console.error('Error in updateStudent:', error);
    res.status(500).json({ message: 'Server error updating student' });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Super Admin)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id);
    await StudentAcademicHistory.deleteMany({ studentId: req.params.id });

    await logAction(req.user._id, 'delete', 'Student', student._id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    res.status(500).json({ message: 'Server error deleting student' });
  }
};

// @desc    Promote students
// @route   POST /api/students/promote
// @access  Private (Super Admin)
const promoteStudents = async (req, res) => {
  try {
    const { studentIds, newSession, newSessionId, newClass, status } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'studentIds array is required' });
    }

    const students = await Student.find({ _id: { $in: studentIds } });
    const promotedStudents = [];

    for (const student of students) {
      const oldSession = student.academic?.sessionName;
      const oldClass = student.academic?.class;
      const targetClass = newClass || (oldClass === '10' ? '10' : String(Number(oldClass) + 1));
      const targetStatus = status || (oldClass === '10' ? 'passed_out' : student.status);

      await StudentAcademicHistory.create({
        studentId: student._id,
        oldSession,
        oldClass,
        newSession: newSession || oldSession,
        newClass: targetClass,
        passedOutBatch: targetStatus === 'passed_out' ? (newSession || oldSession) : undefined,
        promotedBy: req.user._id,
        promotedAt: new Date()
      });

      student.academic.class = targetClass;
      if (newSession) student.academic.sessionName = newSession;
      if (newSessionId) student.academic.sessionId = newSessionId;
      if (targetStatus) student.status = targetStatus;

      await student.save();
      promotedStudents.push(student._id);

      await logAction(req.user._id, 'promote', 'Student', student._id, {
        oldSession,
        oldClass
      }, {
        newSession: newSession || oldSession,
        newClass: targetClass,
        status: targetStatus
      });
    }

    res.json({
      message: `Successfully promoted ${promotedStudents.length} students`,
      count: promotedStudents.length
    });
  } catch (error) {
    console.error('Error in promoteStudents:', error);
    res.status(500).json({ message: 'Server error promoting students' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getStudentHistory,
  updateStudent,
  deleteStudent,
  promoteStudents
};
