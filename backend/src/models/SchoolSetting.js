const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schoolSettingSchema = new mongoose.Schema({
  securityCode: {
    type: String,
    required: true
  },
  schoolName: {
    type: String,
    default: 'DULICHAND SONADEVI HIGH SCHOOL'
  },
  address: {
    type: String,
    default: 'Ranamunduli, Basta'
  }
}, {
  timestamps: true
});

schoolSettingSchema.pre('save', async function(next) {
  if (!this.isModified('securityCode')) return next();
  this.securityCode = await bcrypt.hash(this.securityCode, 12);
  next();
});

schoolSettingSchema.methods.verifySecurityCode = async function(candidateCode) {
  return await bcrypt.compare(candidateCode, this.securityCode);
};

module.exports = mongoose.model('SchoolSetting', schoolSettingSchema);
