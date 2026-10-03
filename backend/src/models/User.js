const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'faculty'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  photo: {
    type: String
  },
  dob: {
    type: Date
  },
  doj: {
    type: Date
  },
  aadhaar: {
    type: String
  },
  pan: {
    type: String
  },
  address: {
    type: String
  },
  salary: {
    type: Number
  },
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    bankName: String
  },
  designation: {
    type: String
  },
  subject: {
    type: String
  },
  qualification: {
    type: String
  },
  salaryHistory: [{
    amount: Number,
    month: String,
    year: Number,
    paidAt: Date
  }],
  certificates: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  leaveRecords: [{
    type: String,
    fromDate: Date,
    toDate: Date,
    reason: String,
    status: String
  }],
  internalNotes: [{
    note: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    createdAt: Date
  }]
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
