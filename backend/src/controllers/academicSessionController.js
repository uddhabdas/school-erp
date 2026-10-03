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
    const { sessionName, startDate, endDate, admissionOpen, allowedClasses, securityCode } = req.body;

    const settings = await SchoolSetting.findOne();
    if (!settings || !(await settings.verifySecurityCode(securityCode))) {
      return res.status(403).json({ message: 'Invalid security code' });
    }

    const session = await AcademicSession.create({
      sessionName,
      startDate,
      endDate,
      admissionOpen,
      allowedClasses,
      status: 'active'
    });

    await logAction(req.user._id, 'create', 'AcademicSession', session._id, null, session);
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSession = async (req, res) => {
  try {
    const session = await AcademicSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    const oldData = { ...session.toObject() };

    const { securityCode } = req.body;
    const settings = await SchoolSetting.findOne();
    if (!settings || !(await settings.verifySecurityCode(securityCode))) {
      return res.status(403).json({ message: 'Invalid security code' });
    }

    const updated = await AcademicSession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAction(req.user._id, 'update', 'AcademicSession', session._id, oldData, updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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
  closeSession,
  archiveSession
};
