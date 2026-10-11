const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  receiptNo: {
    type: String,
    required: true,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'online'],
    default: 'cash'
  },
  transactionId: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['paid', 'partial'],
    default: 'paid'
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeePayment', feePaymentSchema);
