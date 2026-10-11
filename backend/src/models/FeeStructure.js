const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true // 'all' or specific class e.g. '8', '9', '10'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['monthly', 'term', 'annual', 'one_time'],
    default: 'monthly'
  },
  dueDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
