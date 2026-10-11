const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateType: {
    type: String,
    enum: ['transfer_certificate', 'bonafide', 'character'],
    required: true
  },
  certificateNo: {
    type: String,
    required: true,
    unique: true
  },
  bookNo: {
    type: String,
    default: '1'
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
  admissionNo: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    trim: true
  },
  motherName: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    default: 'Indian'
  },
  category: {
    type: String,
    default: 'General'
  },
  dob: {
    type: Date
  },
  dobInWords: {
    type: String,
    trim: true
  },
  admissionDate: {
    type: Date
  },
  admissionClass: {
    type: String,
    default: '8'
  },
  currentClass: {
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
  lastExamPassed: {
    type: String,
    default: 'Class 10 High School Certificate (HSC) Examination'
  },
  whetherFailedOnce: {
    type: Boolean,
    default: false
  },
  subjectsStudied: {
    type: [String],
    default: ['Odia', 'English', 'Mathematics', 'General Science', 'Social Science', 'Sanskrit/Hindi']
  },
  qualifiedForPromotion: {
    type: String,
    default: 'Yes, Qualified'
  },
  monthUptoDuesPaid: {
    type: String,
    default: 'All dues cleared up to date'
  },
  feeConcession: {
    type: String,
    default: 'Nil'
  },
  totalAttendanceDays: {
    type: Number,
    default: 215
  },
  totalWorkingDays: {
    type: Number,
    default: 240
  },
  nccCadetOrScout: {
    type: String,
    default: 'Junior Red Cross / Scout & Guide'
  },
  generalConduct: {
    type: String,
    default: 'Good & Exemplary'
  },
  dateOfApplication: {
    type: Date,
    default: Date.now
  },
  dateOfIssue: {
    type: Date,
    default: Date.now
  },
  reasonForLeaving: {
    type: String,
    default: 'Completed Secondary School Education (Passed Out)'
  },
  remarks: {
    type: String,
    default: 'A well-behaved, diligent and sincere student.'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled'],
    default: 'active'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
