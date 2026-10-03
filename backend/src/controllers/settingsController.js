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
    const { currentCode, securityCode, schoolName, address } = req.body;
    
    let settings = await SchoolSetting.findOne();
    if (!settings) {
      settings = new SchoolSetting({ securityCode: 'admin123' });
    }
    
    if (securityCode) {
      if (!(await settings.verifySecurityCode(currentCode))) {
        return res.status(403).json({ message: 'Invalid current security code' });
      }
      settings.securityCode = securityCode;
    }

    if (schoolName) settings.schoolName = schoolName;
    if (address) settings.address = address;

    const oldData = settings.toObject();
    await settings.save();

    await logAction(req.user._id, 'update', 'SchoolSetting', settings._id, oldData, settings);
    
    const { securityCode: _, ...rest } = settings.toObject();
    res.json(rest);
  } catch (error) {
    console.error('Error in updateSettings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
