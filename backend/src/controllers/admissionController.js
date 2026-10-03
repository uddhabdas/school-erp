const AdmissionApplication = require('../models/AdmissionApplication');
const AcademicSession = require('../models/AcademicSession');
const Student = require('../models/Student');
const cloudinary = require('../utils/cloudinary');
const logAction = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

const generateApplicationId = async () => {
  const year = new Date().getFullYear();
  const count = await AdmissionApplication.countDocuments({ 
    createdAt: { $gte: new Date(year, 0, 1) } 
  });
  return `APP-${year}-${String(count + 1).padStart(4, '0')}`;
};

const generateStudentId = async () => {
  const year = new Date().getFullYear();
  const count = await Student.countDocuments({ 
    createdAt: { $gte: new Date(year, 0, 1) } 
  });
  return `STU-${year}-${String(count + 1).padStart(4, '0')}`;
};

const generateAdmissionNo = async () => {
  const year = new Date().getFullYear();
  const count = await Student.countDocuments({ 
    createdAt: { $gte: new Date(year, 0, 1) } 
  });
  return `ADM-${year}-${String(count + 1).padStart(4, '0')}`;
};

const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'school-erp' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

const createApplication = async (req, res) => {
  try {
    const activeSession = await AcademicSession.findOne({ status: 'active', admissionOpen: true });
    if (!activeSession) {
      return res.status(400).json({ message: 'Admission not open' });
    }

    const applicationId = await generateApplicationId();
    
    const documents = {};
    if (req.files) {
      for (const key in req.files) {
        documents[key] = await uploadToCloudinary(req.files[key][0].buffer);
      }
    }

    const application = await AdmissionApplication.create({
      applicationId,
      status: 'submitted',
      academic: {
        sessionId: activeSession._id,
        sessionName: activeSession.sessionName,
        class: req.body.class,
        previousSchool: req.body.previousSchool
      },
      student: {
        photo: documents.photo,
        name: req.body.name,
        gender: req.body.gender,
        dob: req.body.dob,
        bloodGroup: req.body.bloodGroup,
        aadhaar: req.body.aadhaar,
        mobile: req.body.mobile
      },
      parents: {
        fatherName: req.body.fatherName,
        motherName: req.body.motherName,
        guardian: req.body.guardian,
        parentMobile: req.body.parentMobile
      },
      address: {
        village: req.body.village,
        post: req.body.post,
        district: req.body.district,
        block: req.body.block,
        state: req.body.state,
        pincode: req.body.pincode
      },
      bankDetails: {
        accountHolderName: req.body.accountHolderName,
        accountNumber: req.body.accountNumber,
        ifscCode: req.body.ifscCode,
        bankName: req.body.bankName,
        branchName: req.body.branchName
      },
      documents,
      submittedAt: new Date()
    });

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const applications = await AdmissionApplication.find(query).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateApplication = async (req, res) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const oldData = { ...application.toObject() };
    const updated = await AdmissionApplication.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.user) {
      await logAction(req.user._id, 'update', 'AdmissionApplication', application._id, oldData, updated);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const approveApplication = async (req, res) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const studentId = await generateStudentId();
    const admissionNo = await generateAdmissionNo();
    
    // Generate roll number: count existing students in the same class and add 1
    const existingStudentsInClass = await Student.countDocuments({
      'academic.class': application.academic.class,
      'academic.sessionId': application.academic.sessionId
    });
    const rollNo = existingStudentsInClass + 1;
    
    // Format DOB as DD-MM-YYYY for default password
    let defaultPassword = 'password123';
    if (application.student.dob) {
      const dob = new Date(application.student.dob);
      const day = String(dob.getDate()).padStart(2, '0');
      const month = String(dob.getMonth() + 1).padStart(2, '0');
      const year = dob.getFullYear();
      defaultPassword = `${day}-${month}-${year}`;
    }
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const student = await Student.create({
      studentId,
      admissionNo,
      admissionApplicationId: application._id,
      academic: {
        sessionId: application.academic.sessionId,
        sessionName: application.academic.sessionName,
        class: application.academic.class,
        rollNo: rollNo
      },
      personal: application.student,
      parents: application.parents,
      address: application.address,
      documents: application.documents,
      bankDetails: application.bankDetails,
      password: hashedPassword,
      createdBy: req.user._id
    });

    await AdmissionApplication.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      verifiedBy: req.user._id,
      verifiedAt: new Date()
    });

    await logAction(req.user._id, 'approve', 'AdmissionApplication', application._id);
    await logAction(req.user._id, 'create', 'Student', student._id, null, student);

    // Return student with roll no and default password for frontend to show
    res.json({
      ...student.toObject(),
      defaultPassword,
      rollNo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const rejectApplication = async (req, res) => {
  try {
    const application = await AdmissionApplication.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: req.body.reason,
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await logAction(req.user._id, 'reject', 'AdmissionApplication', application._id);
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  approveApplication,
  rejectApplication
};
