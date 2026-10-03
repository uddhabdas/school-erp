const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    required: true
  },
  admissionNo: {
    type: String,
    unique: true,
    required: true
  },
  admissionApplicationId: mongoose.Schema.Types.ObjectId,
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'passed_out'],
    default: 'active'
  },
  academic: {
    sessionId: mongoose.Schema.Types.ObjectId,
    sessionName: String,
    class: {
      type: String,
      enum: ['8', '9', '10']
    },
    section: String,
    rollNo: Number
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  personal: {
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
  password: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
