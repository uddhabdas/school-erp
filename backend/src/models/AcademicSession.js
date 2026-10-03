const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: true,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  admissionOpen: {
    type: Boolean,
    default: false
  },
  allowedClasses: [{
    type: String,
    enum: ['8', '9', '10']
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
