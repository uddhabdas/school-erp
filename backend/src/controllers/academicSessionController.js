const AcademicSession = require('../models/AcademicSession');
const SchoolSetting = require('../models/SchoolSetting');
const logAction = require('../utils/auditLogger');

const getSessions = async (req, res) => {
  try {
    const sessions = await AcademicSession.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const session = await AcademicSession.findOne({ status: 'active' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createSession = async (req, res) => {
  try {
    const {
      sessionName,
      startDate,
      endDate,
      admissionOpen,
      allowedClasses,
      classConfigs,
      securityCode
    } = req.body;

    const settings = await SchoolSetting.findOne();
    if (securityCode) {
      if (!settings || !(await settings.verifySecurityCode(securityCode))) {
        return res.status(403).json({ message: 'Invalid security code' });
      }
    } else if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Invalid security code or unauthorized' });
    }

    // Resolve allowedClasses: either explicit or extracted from classConfigs
    let resolvedAllowedClasses = Array.isArray(allowedClasses) && allowedClasses.length > 0
      ? allowedClasses
      : [];

    if (resolvedAllowedClasses.length === 0 && Array.isArray(classConfigs) && classConfigs.length > 0) {
      resolvedAllowedClasses = classConfigs.map(c => c.className);
    }
    if (resolvedAllowedClasses.length === 0) {
      resolvedAllowedClasses = ['8', '9', '10'];
    }

    const session = await AcademicSession.create({
      sessionName,
      startDate,
      endDate,
      admissionOpen: admissionOpen !== undefined ? admissionOpen : true,
      allowedClasses: resolvedAllowedClasses,
      classConfigs: Array.isArray(classConfigs) ? classConfigs : [],
      status: 'active'
    });

    await logAction(req.user._id, 'create', 'AcademicSession', session._id, null, session);
    res.status(201).json(session);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An academic session with this name already exists' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const updateSession = async (req, res) => {
  try {
    const session = await AcademicSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const oldData = { ...session.toObject() };

    const { securityCode, ...updateData } = req.body;
    if (securityCode) {
      const settings = await SchoolSetting.findOne();
      if (!settings || !(await settings.verifySecurityCode(securityCode))) {
        return res.status(403).json({ message: 'Invalid security code' });
      }
    } else if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Invalid security code or unauthorized' });
    }

    // If classConfigs is updated, ensure allowedClasses is also synchronized
    if (Array.isArray(updateData.classConfigs)) {
      if (!updateData.allowedClasses || updateData.allowedClasses.length === 0) {
        updateData.allowedClasses = updateData.classConfigs.map(c => c.className);
      }
    }

    const updated = await AcademicSession.findByIdAndUpdate(req.params.id, updateData, { new: true });
    await logAction(req.user._id, 'update', 'AcademicSession', session._id, oldData, updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const updateSessionClasses = async (req, res) => {
  try {
    const session = await AcademicSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const oldData = { ...session.toObject() };
    const { classConfigs, allowedClasses, securityCode } = req.body;

    if (securityCode) {
      const settings = await SchoolSetting.findOne();
      if (!settings || !(await settings.verifySecurityCode(securityCode))) {
        return res.status(403).json({ message: 'Invalid security code' });
      }
    } else if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const configs = Array.isArray(classConfigs) ? classConfigs : [];
    const resolvedAllowed = Array.isArray(allowedClasses) && allowedClasses.length > 0
      ? allowedClasses
      : configs.map(c => c.className);

    session.classConfigs = configs;
    session.allowedClasses = resolvedAllowed;
    await session.save();

    await logAction(req.user._id, 'update_classes', 'AcademicSession', session._id, oldData, session);
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const closeSession = async (req, res) => {
  try {
    const { securityCode } = req.body;

    const settings = await SchoolSetting.findOne();
    if (!settings || !(await settings.verifySecurityCode(securityCode))) {
      return res.status(403).json({ message: 'Invalid security code' });
    }

    const session = await AcademicSession.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive', admissionOpen: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await logAction(req.user._id, 'close', 'AcademicSession', session._id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const archiveSession = async (req, res) => {
  try {
    const { securityCode } = req.body;

    const settings = await SchoolSetting.findOne();
    if (!settings || !(await settings.verifySecurityCode(securityCode))) {
      return res.status(403).json({ message: 'Invalid security code' });
    }

    const session = await AcademicSession.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', archived: true },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await logAction(req.user._id, 'archive', 'AcademicSession', session._id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSessions,
  getActiveSession,
  createSession,
  updateSession,
  updateSessionClasses,
  closeSession,
  archiveSession
};
