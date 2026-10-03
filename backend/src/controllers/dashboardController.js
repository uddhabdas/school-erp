const Student = require('../models/Student');
const User = require('../models/User');
const AdmissionApplication = require('../models/AdmissionApplication');
const AcademicSession = require('../models/AcademicSession');
const AuditLog = require('../models/AuditLog');

const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ status: 'active' });
    const totalFaculty = await User.countDocuments({ role: { $in: ['faculty', 'admin', 'super_admin'] }, status: 'active' });
    const pendingVerifications = await AdmissionApplication.countDocuments({ status: 'submitted' });
    const approvedAdmissions = await AdmissionApplication.countDocuments({ status: 'approved' });
    const activeSession = await AcademicSession.findOne({ status: 'active' });
    const passedOut = await Student.countDocuments({ status: 'passed_out' });

    res.json({
      totalStudents,
      totalFaculty,
      pendingVerifications,
      approvedAdmissions,
      activeSession,
      passedOut
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('user', 'name role');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getAuditLogs
};
