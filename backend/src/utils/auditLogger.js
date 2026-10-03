const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, collection, documentId, oldData = null, newData = null) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      collection,
      documentId,
      oldData,
      newData
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = logAction;
