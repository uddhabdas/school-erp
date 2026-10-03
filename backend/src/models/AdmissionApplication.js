const mongoose = require('mongoose');

const admissionApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'pending_verification', 'approved', 'rejected'],
    default: 'draft'
  },
  rejectionReason: {
    type: String
  },
  academic: {
    sessionId: mongoose.Schema.Types.ObjectId,
    sessionName: String,
    class: {
      type: String,
      enum: ['8', '9', '10']
    },
    previousSchool: String
  },
  student: {
    photo: String,
    name: String,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    dob: Date,
    bloodGroup: String,
    aadhaar: String,
    mobile: String
  },
  parents: {
    fatherName: String,
    motherName: String,
    guardian: String,
    parentMobile: String
  },
  address: {
    village: String,
    post: String,
    district: String,
    block: String,
    state: String,
    pincode: String
  },
  documents: {
    photo: String,
    aadhaar: String,
    birthCertificate: String,
    transferCertificate: String
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  submittedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('AdmissionApplication', admissionApplicationSchema);
