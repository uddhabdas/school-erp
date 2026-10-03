const Student = require('../models/Student');
const User = require('../models/User');
const AdmissionApplication = require('../models/AdmissionApplication');
const AcademicSession = require('../models/AcademicSession');
const AuditLog = require('../models/AuditLog');

const SchoolSetting = require('../models/SchoolSetting');
const logAction = require('../utils/auditLogger');
const mongoose = require('mongoose');

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
    const {
      page = 1,
      limit = 50,
      search,
      action,
      collection,
      startDate,
      endDate,
      format
    } = req.query;

    const query = {};

    // Filter by action
    if (action && action.trim() !== '') {
      query.action = action.toLowerCase().trim();
    }

    // Filter by collection / entity
    if (collection && collection.trim() !== '') {
      query.collection = collection.trim();
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          query.timestamp.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          query.timestamp.$lte = end;
        }
      }
    }

    // Search query
    if (search && search.trim() !== '') {
      const term = search.trim();
      const searchConditions = [
        { action: { $regex: term, $options: 'i' } },
        { collection: { $regex: term, $options: 'i' } }
      ];

      // Check if search might match an ObjectId
      if (mongoose.Types.ObjectId.isValid(term)) {
        searchConditions.push({ documentId: new mongoose.Types.ObjectId(term) });
        searchConditions.push({ _id: new mongoose.Types.ObjectId(term) });
      }

      // Find users matching search term to match their logs
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { email: { $regex: term, $options: 'i' } },
          { employeeId: { $regex: term, $options: 'i' } }
        ]
      }).select('_id');

      if (matchingUsers.length > 0) {
        searchConditions.push({ user: { $in: matchingUsers.map(u => u._id) } });
      }

      query.$or = searchConditions;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name role email employeeId'),
      AuditLog.countDocuments(query)
    ]);

    // Backward compatibility: if caller explicitly requests raw array format
    if (format === 'array') {
      return res.json(logs);
    }

    // Calculate quick statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalAll, todayCount, actionStats, collectionStats] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ timestamp: { $gte: today } }),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$collection', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      logs,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
      stats: {
        totalAll,
        todayCount,
        actions: actionStats,
        collections: collectionStats
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error fetching audit logs' });
  }
};

const clearAuditLogs = async (req, res) => {
  try {
    const { securityCode, retentionDays } = req.body;

    if (!securityCode) {
      return res.status(400).json({ message: 'Master security code is required to clear audit logs' });
    }

    const settings = await SchoolSetting.findOne();
    if (!settings || !(await settings.verifySecurityCode(securityCode))) {
      return res.status(403).json({ message: 'Invalid master security code' });
    }

    let filter = {};
    if (retentionDays && Number(retentionDays) > 0) {
      const cutoffDate = new Date(Date.now() - Number(retentionDays) * 24 * 60 * 60 * 1000);
      filter.timestamp = { $lt: cutoffDate };
    }

    const result = await AuditLog.deleteMany(filter);

    // Record the clearance event in audit logs
    await logAction(req.user._id, 'clear', 'AuditLog', null, null, {
      clearedCount: result.deletedCount,
      retentionDays: retentionDays ? Number(retentionDays) : 'all',
      clearedAt: new Date()
    });

    res.json({
      message: `Successfully cleared ${result.deletedCount} audit log records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing audit logs:', error);
    res.status(500).json({ message: 'Server error while clearing audit logs' });
  }
};

module.exports = {
  getDashboardStats,
  getAuditLogs,
  clearAuditLogs
};
