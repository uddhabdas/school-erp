const Certificate = require('../models/Certificate');
const Student = require('../models/Student');
const Counter = require('../models/Counter');
const SchoolSetting = require('../models/SchoolSetting');
const { dateToWords } = require('../utils/dateToWords');

// 1. Get list of all issued certificates
const getCertificates = async (req, res) => {
  try {
    const { certificateType, search, academicSession, status } = req.query;
    const filter = {};

    if (certificateType && certificateType !== 'all') {
      filter.certificateType = certificateType;
    }
    if (academicSession && academicSession !== 'all') {
      filter.academicSession = academicSession;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      const q = String(search).trim();
      filter.$or = [
        { certificateNo: { $regex: q, $options: 'i' } },
        { studentName: { $regex: q, $options: 'i' } },
        { admissionNo: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } }
      ];
    }

    const certificates = await Certificate.find(filter)
      .sort({ createdAt: -1 })
      .populate('issuedBy', 'name email role');

    res.json({ success: true, count: certificates.length, certificates });
  } catch (error) {
    console.error('getCertificates error:', error);
    res.status(500).json({ message: 'Error retrieving certificates register', error: error.message });
  }
};

// 2. Get single certificate with full print layout data
const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student')
      .populate('issuedBy', 'name email role');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate record not found' });
    }

    const schoolSetting = await SchoolSetting.findOne() || {
      schoolName: 'DULICHAND SONADEVI HIGH SCHOOL',
      address: 'Ranamunduli, Basta, Balasore, Odisha - 756029'
    };

    res.json({
      success: true,
      school: {
        name: schoolSetting.schoolName || 'DULICHAND SONADEVI HIGH SCHOOL',
        address: schoolSetting.address || 'Ranamunduli, Basta, Balasore, Odisha - 756029',
        tagline: '5T High School Transformation Initiative | Govt. of Odisha Recognized',
        board: 'Board of Secondary Education (BSE), Odisha',
        schoolCode: '0408102',
        udiseCode: '21080314502'
      },
      certificate
    });
  } catch (error) {
    console.error('getCertificateById error:', error);
    res.status(500).json({ message: 'Error retrieving certificate', error: error.message });
  }
};

// 3. Issue a new Certificate (TC, Bonafide, Character)
const issueCertificate = async (req, res) => {
  try {
    const {
      studentIdentifier,
      certificateType,
      reasonForLeaving,
      generalConduct,
      lastExamPassed,
      qualifiedForPromotion,
      monthUptoDuesPaid,
      totalAttendanceDays,
      totalWorkingDays,
      remarks,
      updateStudentStatus
    } = req.body;

    if (!studentIdentifier || !certificateType) {
      return res.status(400).json({ message: 'Student identifier and certificate type are required' });
    }

    const cleanId = String(studentIdentifier).trim();

    // Find student by _id, studentId, or admissionNo
    const student = await Student.findOne({
      $or: [
        { _id: cleanId.match(/^[0-9a-fA-F]{24}$/) ? cleanId : null },
        { studentId: cleanId },
        { admissionNo: cleanId }
      ].filter(Boolean)
    });

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const currentYear = new Date().getFullYear();
    const typePrefixMap = {
      transfer_certificate: 'TC',
      bonafide: 'BON',
      character: 'CHAR'
    };
    const prefix = typePrefixMap[certificateType] || 'CERT';

    const counterKey = `cert_${prefix.toLowerCase()}_${currentYear}`;
    const seq = await Counter.getNextSequence(counterKey);
    const certificateNo = `${prefix}-${currentYear}-${String(seq).padStart(4, '0')}`;

    const dobWords = student.personal?.dob ? dateToWords(student.personal.dob) : '';

    const newCert = new Certificate({
      certificateType,
      certificateNo,
      bookNo: '1',
      student: student._id,
      studentId: student.studentId,
      admissionNo: student.admissionNo,
      studentName: student.personal?.name || 'N/A',
      fatherName: student.parents?.fatherName || 'N/A',
      motherName: student.parents?.motherName || 'N/A',
      nationality: 'Indian',
      category: 'General',
      dob: student.personal?.dob,
      dobInWords: dobWords,
      admissionDate: student.admissionDate || student.createdAt,
      admissionClass: '8',
      currentClass: student.academic?.class || '10',
      section: student.academic?.section || 'A',
      academicSession: student.academic?.sessionName || `${currentYear}-${currentYear + 1}`,
      lastExamPassed: lastExamPassed || `Class ${student.academic?.class || 10} Annual Examination`,
      qualifiedForPromotion: qualifiedForPromotion || 'Yes, Qualified',
      monthUptoDuesPaid: monthUptoDuesPaid || 'All dues cleared up to date',
      feeConcession: 'Nil',
      totalAttendanceDays: Number(totalAttendanceDays) || 215,
      totalWorkingDays: Number(totalWorkingDays) || 240,
      nccCadetOrScout: 'Scout & Guide / Junior Red Cross',
      generalConduct: generalConduct || 'Good & Exemplary',
      dateOfApplication: new Date(),
      dateOfIssue: new Date(),
      reasonForLeaving: reasonForLeaving || (certificateType === 'transfer_certificate' ? 'Completed High School Studies' : 'For Higher Education / Scholarship Verification'),
      remarks: remarks || 'A diligent, sincere, and disciplined student.',
      issuedBy: req.user?._id
    });

    await newCert.save();

    // If TC is issued and flag is true, update student's enrollment status
    if (certificateType === 'transfer_certificate' && updateStudentStatus) {
      student.status = 'transferred';
      await student.save();
    }

    res.status(201).json({
      success: true,
      message: `${certificateType.replace('_', ' ').toUpperCase()} successfully issued with serial ${certificateNo}`,
      certificate: newCert
    });
  } catch (error) {
    console.error('issueCertificate error:', error);
    res.status(500).json({ message: 'Failed to issue certificate', error: error.message });
  }
};

// 4. Cancel / Revoke a Certificate
const cancelCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    cert.status = 'cancelled';
    cert.remarks = `${cert.remarks || ''} [REVOKED/CANCELLED by ${req.user?.name || 'Admin'} on ${new Date().toLocaleDateString()}]`;
    await cert.save();

    res.json({ success: true, message: `Certificate ${cert.certificateNo} has been marked as cancelled` });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling certificate', error: error.message });
  }
};

module.exports = {
  getCertificates,
  getCertificateById,
  issueCertificate,
  cancelCertificate
};
