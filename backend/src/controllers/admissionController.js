const AdmissionApplication = require('../models/AdmissionApplication');
const AcademicSession = require('../models/AcademicSession');
const Student = require('../models/Student');
const Counter = require('../models/Counter');
const { escapeRegex } = require('../utils/sanitize');
const cloudinary = require('../utils/cloudinary');
const logAction = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

const generateApplicationId = async () => {
  const year = new Date().getFullYear();
  let seq = await Counter.getNextSequence(`app_${year}`);
  let appId = `APP-${year}-${String(seq).padStart(4, '0')}`;
  while (await AdmissionApplication.exists({ applicationId: appId })) {
    seq = await Counter.getNextSequence(`app_${year}`);
    appId = `APP-${year}-${String(seq).padStart(4, '0')}`;
  }
  return appId;
};

const generateStudentId = async () => {
  const year = new Date().getFullYear();
  let seq = await Counter.getNextSequence(`stu_${year}`);
  let stuId = `STU-${year}-${String(seq).padStart(4, '0')}`;
  while (await Student.exists({ studentId: stuId })) {
    seq = await Counter.getNextSequence(`stu_${year}`);
    stuId = `STU-${year}-${String(seq).padStart(4, '0')}`;
  }
  return stuId;
};

const generateAdmissionNo = async () => {
  const year = new Date().getFullYear();
  let seq = await Counter.getNextSequence(`adm_${year}`);
  let admNo = `ADM-${year}-${String(seq).padStart(4, '0')}`;
  while (await Student.exists({ admissionNo: admNo })) {
    seq = await Counter.getNextSequence(`adm_${year}`);
    admNo = `ADM-${year}-${String(seq).padStart(4, '0')}`;
  }
  return admNo;
};

const uploadToCloudinary = async (fileBuffer, mimetype = 'image/jpeg') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    return `data:${mimetype};base64,${fileBuffer.toString('base64')}`;
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'school-erp' },
      (error, result) => {
        if (error) {
          console.warn('Cloudinary upload warning, using inline fallback:', error.message);
          resolve(`data:${mimetype};base64,${fileBuffer.toString('base64')}`);
        } else {
          resolve(result.secure_url);
        }
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
    console.error('createApplication error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getApplications = async (req, res) => {
  try {
    const { status, class: classFilter, search } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (classFilter && classFilter !== 'all') {
      query['academic.class'] = classFilter;
    }
    if (search && search.trim() !== '') {
      const escaped = escapeRegex(search.trim());
      const regex = { $regex: escaped, $options: 'i' };
      query.$or = [
        { applicationId: regex },
        { 'student.name': regex },
        { 'student.mobile': regex },
        { 'parents.fatherName': regex },
        { 'student.aadhaar': regex }
      ];
    }
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
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only Super Admin (Principal) has authorization to approve admission applications' });
    }

    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status === 'approved') {
      return res.status(400).json({ message: 'Application has already been approved' });
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
    if (application.student?.dob) {
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
    const application = await AdmissionApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status === 'approved') {
      return res.status(400).json({ message: 'Cannot reject an application that has already been approved' });
    }

    application.status = 'rejected';
    application.rejectionReason = req.body.reason || 'Application rejected by administration';
    application.verifiedBy = req.user._id;
    application.verifiedAt = new Date();
    await application.save();

    await logAction(req.user._id, 'reject', 'AdmissionApplication', application._id, null, {
      reason: application.rejectionReason,
      rejectedBy: req.user.name
    });

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const trackPublicApplication = async (req, res) => {
  try {
    const { applicationNo, dob } = req.query;
    if (!applicationNo) {
      return res.status(400).json({ message: 'Application registration number is required' });
    }

    const cleanAppNo = String(applicationNo).trim();
    const app = await AdmissionApplication.findOne({
      applicationId: { $regex: new RegExp(`^${escapeRegex(cleanAppNo)}$`, 'i') }
    });

    if (!app) {
      return res.status(404).json({ message: 'No admission application found with this registration number' });
    }

    // If DOB provided, verify match
    if (dob && app.personal?.dob) {
      const inputDate = new Date(dob);
      const appDate = new Date(app.personal.dob);
      if (!isNaN(inputDate.getTime()) && !isNaN(appDate.getTime())) {
        const d1 = `${inputDate.getUTCFullYear()}-${inputDate.getUTCMonth()}-${inputDate.getUTCDate()}`;
        const d2 = `${appDate.getUTCFullYear()}-${appDate.getUTCMonth()}-${appDate.getUTCDate()}`;
        const ld1 = `${inputDate.getFullYear()}-${inputDate.getMonth()}-${inputDate.getDate()}`;
        const ld2 = `${appDate.getFullYear()}-${appDate.getMonth()}-${appDate.getDate()}`;
        if (d1 !== d2 && ld1 !== ld2) {
          return res.status(400).json({ message: 'Date of birth does not match the registered application record' });
        }
      }
    }

    res.json({
      success: true,
      application: {
        applicationId: app.applicationId,
        studentName: app.personal?.name,
        gender: app.personal?.gender,
        dob: app.personal?.dob,
        fatherName: app.parents?.fatherName,
        motherName: app.parents?.motherName,
        mobile: app.parents?.parentMobile || app.personal?.mobile,
        applyingForClass: app.academic?.class,
        sessionName: app.academic?.sessionName,
        status: app.status,
        submissionDate: app.createdAt,
        verifiedAt: app.verifiedAt,
        rejectionReason: app.rejectionReason,
        documentsSubmitted: {
          photo: Boolean(app.documents?.photo),
          aadhaar: Boolean(app.documents?.aadhaar),
          birthCertificate: Boolean(app.documents?.birthCertificate),
          transferCertificate: Boolean(app.documents?.transferCertificate)
        }
      }
    });
  } catch (error) {
    console.error('trackPublicApplication error:', error);
    res.status(500).json({ message: 'Error checking application status', error: error.message });
  }
};

const getPublicApplicationSlip = async (req, res) => {
  try {
    const { applicationNo } = req.params;
    const cleanAppNo = String(applicationNo).trim();

    const app = await AdmissionApplication.findOne({
      applicationId: { $regex: new RegExp(`^${escapeRegex(cleanAppNo)}$`, 'i') }
    });

    if (!app) {
      return res.status(404).json({ message: 'Application record not found' });
    }

    const SchoolSetting = require('../models/SchoolSetting');
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
        schoolCode: '0408102',
        udiseCode: '21080314502'
      },
      application: app
    });
  } catch (error) {
    console.error('getPublicApplicationSlip error:', error);
    res.status(500).json({ message: 'Error generating application acknowledgment slip', error: error.message });
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  approveApplication,
  rejectApplication,
  trackPublicApplication,
  getPublicApplicationSlip
};
