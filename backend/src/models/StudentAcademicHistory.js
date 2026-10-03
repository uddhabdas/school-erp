const mongoose = require('mongoose');

const studentAcademicHistorySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  oldSession: String,
  oldClass: String,
  newSession: String,
  newClass: String,
  passedOutBatch: String,
  promotedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  promotedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentAcademicHistory', studentAcademicHistorySchema);
