const SchoolSetting = require('../models/SchoolSetting');
const logAction = require('../utils/auditLogger');

const getSettings = async (req, res) => {
  try {
    let settings = await SchoolSetting.findOne();
    if (!settings) {
      settings = await SchoolSetting.create({
        securityCode: 'admin123'
      });
    }
    const { securityCode, ...rest } = settings.toObject();
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { currentCode, securityCode, ...otherSettings } = req.body;
    
    let settings = await SchoolSetting.findOne();
    
    if (securityCode) {
      if (!settings || !(await settings.verifySecurityCode(currentCode))) {
        return res.status(403).json({ message: 'Invalid current security code' });
      }
      otherSettings.securityCode = securityCode;
    }

    const oldData = settings ? { ...settings.toObject() } : null;
    settings = await SchoolSetting.findOneAndUpdate(
      {},
      otherSettings,
      { new: true, upsert: true }
    );

    await logAction(req.user._id, 'update', 'SchoolSetting', settings._id, oldData, settings);
    
    const { securityCode: _, ...rest } = settings.toObject();
    res.json(rest);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
