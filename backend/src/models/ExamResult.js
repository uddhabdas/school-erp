const mongoose = require('mongoose');

const subjectMarkSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    default: ''
  },
  subjectName: {
    type: String,
    required: true
  },
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  passMarks: {
    type: Number,
    required: true,
    default: 33
  },
  marksObtained: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    default: 'F'
  },
  isAbsent: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const examResultSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  rollNo: {
    type: Number
  },
  name: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: 'A'
  },
  academicSession: {
    type: String,
    required: true
  },
  subjectMarks: {
    type: [subjectMarkSchema],
    default: []
  },
  totalMarksObtained: {
    type: Number,
    default: 0
  },
  totalMaxMarks: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  overallGrade: {
    type: String,
    default: 'F'
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail', 'Compartment', 'Absent'],
    default: 'Pass'
  },
  division: {
    type: String,
    enum: ['Distinction', '1st Division', '2nd Division', '3rd Division', 'Failed'],
    default: '1st Division'
  },
  rank: {
    type: Number
  },
  remarks: {
    type: String,
    default: 'Good performance. Keep striving for excellence.'
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

examResultSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
