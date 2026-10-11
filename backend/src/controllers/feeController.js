const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const Counter = require('../models/Counter');
const AcademicSession = require('../models/AcademicSession');
const logAction = require('../utils/auditLogger');
const { escapeRegex } = require('../utils/sanitize');
const mongoose = require('mongoose');

// Helper to resolve an active academic session safely
const getEffectiveSessionId = async (providedSessionId) => {
  if (providedSessionId && mongoose.Types.ObjectId.isValid(providedSessionId)) {
    return providedSessionId;
  }
  const activeSession = await AcademicSession.findOne({ status: 'active' });
  if (activeSession) return activeSession._id;
  const latestSession = await AcademicSession.findOne().sort({ createdAt: -1 });
  if (latestSession) return latestSession._id;

  const defaultSession = await AcademicSession.create({
    sessionName: '2025-2026',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2026-03-31'),
    admissionOpen: true,
    status: 'active'
  });
  return defaultSession._id;
};

// @desc    Get all fee structures
// @route   GET /api/fees/structures
// @access  Private
const getFeeStructures = async (req, res) => {
  try {
    const { class: studentClass, sessionId } = req.query;
    const query = { status: 'active' };

    if (studentClass && studentClass !== 'all') {
      query.$or = [{ class: studentClass }, { class: 'all' }];
    }
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const structures = await FeeStructure.find(query).sort({ createdAt: -1 });
    res.json(structures);
  } catch (error) {
    console.error('Error in getFeeStructures:', error);
    res.status(500).json({ message: 'Failed to fetch fee structures', error: error.message });
  }
};

// @desc    Create new fee structure
// @route   POST /api/fees/structures
// @access  Private (Super Admin, Admin)
const createFeeStructure = async (req, res) => {
  try {
    let { title, class: studentClass, sessionId, amount, frequency, dueDate, description } = req.body;

    if (!title || !studentClass || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'Title, class, and amount are required' });
    }

    const resolvedSessionId = await getEffectiveSessionId(sessionId);

    const structure = await FeeStructure.create({
      title: title.trim(),
      class: studentClass,
      sessionId: resolvedSessionId,
      amount: Number(amount),
      frequency: frequency || 'monthly',
      dueDate: dueDate || null,
      description: description || ''
    });

    if (req.user) {
      await logAction(req.user._id, 'create', 'FeeStructure', structure._id, null, structure);
    }

    res.status(201).json(structure);
  } catch (error) {
    console.error('Error in createFeeStructure:', error);
    res.status(500).json({ message: 'Failed to create fee structure', error: error.message });
  }
};

// @desc    Delete fee structure
// @route   DELETE /api/fees/structures/:id
// @access  Private (Super Admin, Admin)
const deleteFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findById(req.params.id);
    if (!structure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    await FeeStructure.findByIdAndDelete(req.params.id);
    if (req.user) {
      await logAction(req.user._id, 'delete', 'FeeStructure', req.params.id, structure, null);
    }

    res.json({ message: 'Fee structure deleted successfully' });
  } catch (error) {
    console.error('Error in deleteFeeStructure:', error);
    res.status(500).json({ message: 'Failed to delete fee structure', error: error.message });
  }
};

// @desc    Collect a fee payment
// @route   POST /api/fees/payments
// @access  Private (Super Admin, Admin, Faculty)
const collectFeePayment = async (req, res) => {
  try {
    const { studentId, title, totalAmount, paidAmount, paymentMode, transactionId, remarks, sessionId } = req.body;

    if (!studentId || !title || paidAmount === undefined) {
      return res.status(400).json({ message: 'Student ID, fee title, and paid amount are required' });
    }

    // Flexible student lookup by ObjectId, studentId (STU-XXXX), or admissionNo
    const cleanStudentId = String(studentId || '').trim();
    let student = null;
    if (mongoose.Types.ObjectId.isValid(cleanStudentId)) {
      student = await Student.findById(cleanStudentId);
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { studentId: { $regex: `^${escapeRegex(cleanStudentId)}$`, $options: 'i' } },
          { admissionNo: { $regex: `^${escapeRegex(cleanStudentId)}$`, $options: 'i' } },
          { 'personal.aadhaar': cleanStudentId }
        ]
      });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found with provided ID or Admission No' });
    }

    const resolvedSessionId = await getEffectiveSessionId(sessionId || student.academic?.sessionId);

    const year = new Date().getFullYear();
    let receiptNo = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 20) {
      attempts++;
      const seq = await Counter.getNextSequence(`fee_receipt_${year}`);
      const candidateNo = `REC-${year}-${String(seq).padStart(5, '0')}`;
      const existing = await FeePayment.findOne({ receiptNo: candidateNo });
      if (!existing) {
        receiptNo = candidateNo;
        isUnique = true;
      }
    }
    if (!receiptNo) {
      receiptNo = `REC-${year}-${Date.now().toString().slice(-6)}`;
    }

    const numPaid = Number(paidAmount);
    const candidateTotal = totalAmount !== undefined && totalAmount !== null && Number(totalAmount) > 0 
      ? Number(totalAmount) 
      : numPaid;
    const numTotal = Math.max(candidateTotal, numPaid);
    const status = numPaid >= numTotal ? 'paid' : 'partial';

    const payment = await FeePayment.create({
      receiptNo,
      studentId: student._id,
      sessionId: resolvedSessionId,
      title: title.trim(),
      totalAmount: numTotal,
      paidAmount: numPaid,
      paymentMode: paymentMode || 'cash',
      transactionId: transactionId || '',
      status,
      collectedBy: req.user ? req.user._id : undefined,
      remarks: remarks || ''
    });

    const populatedPayment = await FeePayment.findById(payment._id)
      .populate('studentId', 'studentId admissionNo personal.name personal.mobile academic.class academic.section')
      .populate('collectedBy', 'name email role');

    if (req.user) {
      await logAction(req.user._id, 'collect_fee', 'FeePayment', payment._id, null, {
        receiptNo,
        amount: numPaid,
        student: student.personal?.name
      });
    }

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: populatedPayment
    });
  } catch (error) {
    console.error('Error in collectFeePayment:', error);
    res.status(500).json({ message: 'Failed to record fee payment', error: error.message });
  }
};

// @desc    Get all payments with search / filters
// @route   GET /api/fees/payments
// @access  Private
const getFeePayments = async (req, res) => {
  try {
    const { search, paymentMode, status, startDate, endDate, page = 1, limit = 25 } = req.query;
    const query = {};

    if (paymentMode && paymentMode !== 'all') {
      query.paymentMode = paymentMode;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    if (search && search.trim() !== '') {
      const term = escapeRegex(search.trim());
      const students = await Student.find({
        $or: [
          { 'personal.name': { $regex: term, $options: 'i' } },
          { studentId: { $regex: term, $options: 'i' } },
          { admissionNo: { $regex: term, $options: 'i' } }
        ]
      }).select('_id');

      const studentIds = students.map(s => s._id);

      query.$or = [
        { receiptNo: { $regex: term, $options: 'i' } },
        { title: { $regex: term, $options: 'i' } },
        { transactionId: { $regex: term, $options: 'i' } },
        { studentId: { $in: studentIds } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      FeePayment.find(query)
        .populate('studentId', 'studentId admissionNo personal.name academic.class academic.section')
        .populate('collectedBy', 'name')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limitNum),
      FeePayment.countDocuments(query)
    ]);

    res.json({
      payments,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error in getFeePayments:', error);
    res.status(500).json({ message: 'Failed to fetch fee payments', error: error.message });
  }
};

// @desc    Get fee summary and payment history for a student
// @route   GET /api/fees/student/:studentId
// @access  Private (Admin, Student, Parent)
const getStudentFeeDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    const cleanId = String(studentId || '').trim();

    let student = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      student = await Student.findById(cleanId);
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { studentId: { $regex: `^${escapeRegex(cleanId)}$`, $options: 'i' } },
          { admissionNo: { $regex: `^${escapeRegex(cleanId)}$`, $options: 'i' } },
          { 'personal.aadhaar': cleanId }
        ]
      });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find applicable fee structures for student's class
    const structures = await FeeStructure.find({
      $or: [
        { class: student.academic?.class },
        { class: 'all' }
      ],
      status: 'active'
    }).sort({ amount: -1 });

    // Find all payment history for this student
    const payments = await FeePayment.find({ studentId: student._id })
      .populate('collectedBy', 'name email role')
      .sort({ paymentDate: -1 });

    const totalPaid = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    // Compute breakdown per applicable fee head
    const headsBreakdown = structures.map((st) => {
      // Find payments matching this title
      const matchingPayments = payments.filter((p) => {
        const pTitle = (p.title || '').toLowerCase().trim();
        const sTitle = (st.title || '').toLowerCase().trim();
        return pTitle === sTitle || pTitle.includes(sTitle) || sTitle.includes(pTitle);
      });

      const headPaid = matchingPayments.reduce((s, p) => s + (p.paidAmount || 0), 0);
      const headDue = Math.max(0, st.amount - headPaid);
      let status = 'unpaid';
      if (headPaid >= st.amount) {
        status = 'paid';
      } else if (headPaid > 0) {
        status = 'partial';
      }

      return {
        _id: st._id,
        title: st.title,
        amount: st.amount,
        frequency: st.frequency,
        description: st.description || '',
        paidAmount: headPaid,
        balanceDue: headDue,
        status,
        lastPaymentDate: matchingPayments.length > 0 ? matchingPayments[0].paymentDate : null
      };
    });

    const totalStructurePayable = structures.reduce((sum, item) => sum + item.amount, 0);
    const totalPayable = Math.max(totalStructurePayable, totalPaid);
    const balanceDue = Math.max(0, totalStructurePayable - totalPaid);

    res.json({
      student: {
        id: student._id,
        studentId: student.studentId,
        admissionNo: student.admissionNo,
        name: student.personal?.name,
        mobile: student.personal?.mobile,
        class: student.academic?.class,
        section: student.academic?.section,
        rollNo: student.academic?.rollNo
      },
      totalPayable,
      totalPaid,
      balanceDue,
      structures,
      headsBreakdown,
      payments
    });
  } catch (error) {
    console.error('Error in getStudentFeeDetails:', error);
    res.status(500).json({ message: 'Failed to fetch student fee details', error: error.message });
  }
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  deleteFeeStructure,
  collectFeePayment,
  getFeePayments,
  getStudentFeeDetails
};
