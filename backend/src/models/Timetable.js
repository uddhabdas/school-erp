const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  periodNo: {
    type: Number,
    required: true
  },
  startTime: {
    type: String,
    default: '10:00 AM'
  },
  endTime: {
    type: String,
    default: '10:45 AM'
  },
  subject: {
    type: String,
    required: true,
    default: 'Mathematics'
  },
  teacherName: {
    type: String,
    default: 'Subject Teacher'
  },
  roomNo: {
    type: String,
    default: ''
  }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  periods: {
    type: [periodSchema],
    default: []
  }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  academicSession: {
    type: String,
    required: true
  },
  class: {
    type: String,
    enum: ['8', '9', '10'],
    required: true
  },
  section: {
    type: String,
    default: 'A'
  },
  classTeacher: {
    type: String,
    default: 'Class Teacher'
  },
  roomNo: {
    type: String,
    default: 'Room 101'
  },
  weeklySchedule: {
    type: [dayScheduleSchema],
    default: []
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

timetableSchema.index({ academicSession: 1, class: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
