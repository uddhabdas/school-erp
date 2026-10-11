const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    trim: true,
    default: ''
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100,
    min: 10
  },
  passMarks: {
    type: Number,
    required: true,
    default: 33,
    min: 0
  }
}, { _id: false });

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  academicSession: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    enum: ['8', '9', '10'],
    required: true
  },
  examType: {
    type: String,
    enum: ['unit_test', 'half_yearly', 'annual', 'pre_board', 'terminal'],
    default: 'annual'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  subjects: {
    type: [subjectSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  instructions: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);
