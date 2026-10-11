require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const SchoolSetting = require("../models/SchoolSetting");
const AcademicSession = require("../models/AcademicSession");
const AdmissionApplication = require("../models/AdmissionApplication");
const Student = require("../models/Student");
const FeeStructure = require("../models/FeeStructure");
const FeePayment = require("../models/FeePayment");
const Exam = require("../models/Exam");
const ExamResult = require("../models/ExamResult");
const Timetable = require("../models/Timetable");

const seedDatabase = async () => {
  // 1. Settings
  const settings = await SchoolSetting.findOne();
  if (!settings || !(await settings.verifySecurityCode("admin123"))) {
    await SchoolSetting.deleteMany({});
    await SchoolSetting.create({
      securityCode: "admin123",
      schoolName: "Dulichand Sonadevi High School",
      address: "Ranamunduli, Basta",
    });
  }

  // 2. Users (Super Admin, Admin, and Faculty)
  const principal = await User.findOne({ email: "principal@school.com" });
  if (!principal || !(await principal.comparePassword("admin123"))) {
    await User.deleteMany({ email: { $in: ["principal@school.com", "admin@school.com"] } });
    await User.create({
      _id: new mongoose.Types.ObjectId("660000000000000000000001"),
      employeeId: "EMP-2024-0001",
      name: "Principal",
      email: "principal@school.com",
      mobile: "9876543210",
      password: "admin123",
      role: "super_admin",
      status: "active",
    });

    await User.create({
      _id: new mongoose.Types.ObjectId("660000000000000000000002"),
      employeeId: "EMP-2024-0002",
      name: "Admin User",
      email: "admin@school.com",
      mobile: "9876543211",
      password: "admin123",
      role: "admin",
      status: "active",
    });
  }

  // Ensure Faculty accounts exist with valid credentials
  const facultyAnshuman = await User.findOne({ email: "anshuman@school.com" });
  if (!facultyAnshuman || !(await facultyAnshuman.comparePassword("password123"))) {
    await User.deleteMany({ email: "anshuman@school.com" });
    await User.create({
      _id: new mongoose.Types.ObjectId("660000000000000000000003"),
      employeeId: "EMP-2024-0003",
      name: "Anshuman Das",
      email: "anshuman@school.com",
      mobile: "9876543220",
      password: "password123",
      role: "faculty",
      designation: "Senior Faculty (Mathematics & Science)",
      subject: "Mathematics",
      assignedSubjects: ["Mathematics", "General Science"],
      assignedClasses: ["9", "10"],
      isClassTeacher: true,
      classTeacherOf: { class: "10", section: "A" },
      status: "active",
      teachingAssignments: [
        { class: "10", section: "A", subject: "Mathematics" },
        { class: "9", section: "A", subject: "General Science" }
      ]
    });
    console.log("Seeded faculty user: anshuman@school.com");
  }

  const facultyDefault = await User.findOne({ email: "faculty@school.com" });
  if (!facultyDefault || !(await facultyDefault.comparePassword("password123"))) {
    await User.deleteMany({ email: "faculty@school.com" });
    await User.create({
      _id: new mongoose.Types.ObjectId("660000000000000000000004"),
      employeeId: "EMP-2024-0004",
      name: "Dr. Rajesh Mohapatra",
      email: "faculty@school.com",
      mobile: "9876543221",
      password: "password123",
      role: "faculty",
      designation: "Faculty (Odia & Social Science)",
      subject: "First Language (Odia)",
      assignedSubjects: ["First Language (Odia)", "Social Science"],
      assignedClasses: ["8", "9"],
      isClassTeacher: true,
      classTeacherOf: { class: "8", section: "A" },
      status: "active",
      teachingAssignments: [
        { class: "8", section: "A", subject: "First Language (Odia)" },
        { class: "9", section: "A", subject: "Social Science" }
      ]
    });
    console.log("Seeded faculty user: faculty@school.com");
  }

  // 3. Active Academic Session with Complete High School ClassConfigs
  const currentYear = new Date().getFullYear();
  const anshumanId = new mongoose.Types.ObjectId("660000000000000000000003");
  const rajeshId = new mongoose.Types.ObjectId("660000000000000000000004");

  const defaultClassConfigs = [
    {
      className: "8",
      sections: ["A", "B"],
      subjects: [
        { subjectCode: "FLO", subjectName: "First Language (Odia)", isOptional: false, assignedTeacher: "Dr. Rajesh Mohapatra", assignedTeacherId: rajeshId },
        { subjectCode: "SLE", subjectName: "Second Language (English)", isOptional: false },
        { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false },
        { subjectCode: "GSC", subjectName: "General Science", isOptional: false },
        { subjectCode: "SSC", subjectName: "Social Science", isOptional: false, assignedTeacher: "Dr. Rajesh Mohapatra", assignedTeacherId: rajeshId },
        { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", isOptional: false },
        { subjectCode: "PET", subjectName: "Physical Education", isOptional: false }
      ],
      admissionOpen: true,
      capacity: 60
    },
    {
      className: "9",
      sections: ["A", "B"],
      subjects: [
        { subjectCode: "FLO", subjectName: "First Language (Odia)", isOptional: false, assignedTeacher: "Dr. Rajesh Mohapatra", assignedTeacherId: rajeshId },
        { subjectCode: "SLE", subjectName: "Second Language (English)", isOptional: false },
        { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false, assignedTeacher: "Anshuman Das", assignedTeacherId: anshumanId },
        { subjectCode: "GSC", subjectName: "General Science", isOptional: false, assignedTeacher: "Anshuman Das", assignedTeacherId: anshumanId },
        { subjectCode: "SSC", subjectName: "Social Science", isOptional: false, assignedTeacher: "Dr. Rajesh Mohapatra", assignedTeacherId: rajeshId },
        { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", isOptional: false },
        { subjectCode: "ICT", subjectName: "ICT & Computer Lab", isOptional: false }
      ],
      admissionOpen: true,
      capacity: 60
    },
    {
      className: "10",
      sections: ["A", "B"],
      subjects: [
        { subjectCode: "FLO", subjectName: "First Language (Odia)", isOptional: false, assignedTeacher: "Dr. Rajesh Mohapatra", assignedTeacherId: rajeshId },
        { subjectCode: "SLE", subjectName: "Second Language (English)", isOptional: false },
        { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false, assignedTeacher: "Anshuman Das", assignedTeacherId: anshumanId },
        { subjectCode: "GSC", subjectName: "General Science", isOptional: false, assignedTeacher: "Anshuman Das", assignedTeacherId: anshumanId },
        { subjectCode: "SSC", subjectName: "Social Science", isOptional: false, assignedTeacher: "Dr. Rajesh Mohapatra", assignedTeacherId: rajeshId },
        { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", isOptional: false }
      ],
      admissionOpen: true,
      capacity: 60
    }
  ];

  let session = await AcademicSession.findOne({ status: "active" });
  if (!session) {
    session = await AcademicSession.create({
      sessionName: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(currentYear, 3, 1),
      endDate: new Date(currentYear + 1, 2, 31),
      admissionOpen: true,
      allowedClasses: ["8", "9", "10"],
      classConfigs: defaultClassConfigs,
      status: "active",
    });
  } else {
    session.classConfigs = defaultClassConfigs;
    session.allowedClasses = ["8", "9", "10"];
    await session.save();
  }

  // 4. Default Seeded Students (Matches test input 2345678903)
  const student = await Student.findOne({
    $or: [{ "personal.aadhaar": "2345678903" }, { admissionNo: "2345678903" }]
  });

  if (!student) {
    const defaultPasswordHash = await bcrypt.hash("01-01-2010", 10);

    await Student.create([
      {
        studentId: "STU-2024-0001",
        admissionNo: "2345678903",
        status: "active",
        academic: {
          sessionId: session._id,
          sessionName: session.sessionName,
          class: "9",
          rollNo: 1
        },
        personal: {
          name: "Aman Kumar Nayak",
          gender: "male",
          dob: new Date(2010, 0, 1), // 01-01-2010
          bloodGroup: "O+",
          aadhaar: "2345678903",
          mobile: "9876543201"
        },
        parents: {
          fatherName: "Pradeep Nayak",
          motherName: "Sabita Nayak",
          parentMobile: "9876543201"
        },
        address: {
          village: "Ranamunduli",
          post: "Basta",
          block: "BASTA",
          district: "BALASORE",
          state: "ODISHA",
          pincode: "756029"
        },
        password: defaultPasswordHash
      },
      {
        studentId: "STU-2024-0002",
        admissionNo: "ADM-2024-0002",
        status: "active",
        academic: {
          sessionId: session._id,
          sessionName: session.sessionName,
          class: "8",
          rollNo: 2
        },
        personal: {
          name: "Priya Mohanty",
          gender: "female",
          dob: new Date(2011, 4, 15), // 15-05-2011
          bloodGroup: "B+",
          aadhaar: "452187654321",
          mobile: "9876123450"
        },
        parents: {
          fatherName: "Ramesh Mohanty",
          motherName: "Sunita Mohanty",
          parentMobile: "9876123450"
        },
        address: {
          village: "Ranamunduli",
          post: "Basta",
          block: "BASTA",
          district: "BALASORE",
          state: "ODISHA",
          pincode: "756029"
        },
        password: await bcrypt.hash("15-05-2011", 10)
      }
    ]);
    console.log("Seeded sample students (Aadhaar: 2345678903 / DOB: 01-01-2010).");
  }

  // 5. Default Admission Applications
  const appCount = await AdmissionApplication.countDocuments();
  if (appCount === 0) {
    await AdmissionApplication.create([
      {
        applicationId: `APP-${currentYear}-0001`,
        status: "submitted",
        academic: {
          sessionId: session._id,
          sessionName: session.sessionName,
          class: "8",
          previousSchool: "Basta Upper Primary School"
        },
        student: {
          name: "Pooja Das",
          gender: "female",
          dob: new Date(2011, 6, 20),
          bloodGroup: "A+",
          aadhaar: "987612345678",
          mobile: "9876123455"
        },
        parents: {
          fatherName: "Narayan Das",
          motherName: "Geeta Das",
          parentMobile: "9876123455"
        },
        address: {
          village: "Ranamunduli",
          post: "Basta",
          block: "BASTA",
          district: "BALASORE",
          state: "ODISHA",
          pincode: "756029"
        },
        bankDetails: {
          accountHolderName: "Pooja Das",
          accountNumber: "389201948291",
          ifscCode: "SBIN0001234",
          bankName: "State Bank of India",
          branchName: "Basta Branch"
        },
        submittedAt: new Date()
      },
      {
        applicationId: `APP-${currentYear}-0002`,
        status: "pending_verification",
        academic: {
          sessionId: session._id,
          sessionName: session.sessionName,
          class: "9",
          previousSchool: "Govt High School Balasore"
        },
        student: {
          name: "Subham Mohapatra",
          gender: "male",
          dob: new Date(2010, 8, 22),
          bloodGroup: "B+",
          aadhaar: "782194857102",
          mobile: "9876543299"
        },
        parents: {
          fatherName: "Bikash Mohapatra",
          motherName: "Minati Mohapatra",
          parentMobile: "9876543299"
        },
        address: {
          village: "Kupari",
          post: "Simulia",
          block: "SIMULIA",
          district: "BALASORE",
          state: "ODISHA",
          pincode: "756045"
        },
        bankDetails: {
          accountHolderName: "Subham Mohapatra",
          accountNumber: "209485739201",
          ifscCode: "PUNB0182736",
          bankName: "Punjab National Bank",
          branchName: "Simulia"
        },
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ]);
  }

  // 6. Default Fee Structures
  const existingFee = await FeeStructure.findOne();
  if (!existingFee && session) {
    await FeeStructure.create([
      {
        title: "Monthly Tuition Fee",
        class: "all",
        sessionId: session._id,
        amount: 350,
        frequency: "monthly",
        description: "Standard monthly tuition fee for high school classes."
      },
      {
        title: "Annual Development & Examination Fee",
        class: "all",
        sessionId: session._id,
        amount: 800,
        frequency: "annual",
        description: "Includes examination papers, library and lab access."
      },
      {
        title: "Class 10 Board Registration Fee",
        class: "10",
        sessionId: session._id,
        amount: 1200,
        frequency: "one_time",
        description: "BSE Odisha Board examination enrollment and verification fee."
      }
    ]);
  }

  const seededStudent = await Student.findOne({ admissionNo: "2345678903" });
  if (seededStudent) {
    const existingPayment = await FeePayment.findOne({ studentId: seededStudent._id });
    if (!existingPayment) {
      await FeePayment.create({
        receiptNo: `REC-${currentYear}-00001`,
        studentId: seededStudent._id,
        sessionId: session ? session._id : undefined,
        title: "Monthly Tuition Fee - Initial Installment",
        totalAmount: 350,
        paidAmount: 350,
        paymentDate: new Date(),
        paymentMode: "cash",
        status: "paid",
        remarks: "Received by office counter"
      });
    }
  }

  // 7. Seed Sample Examination and Marks for Class 10
  const existingExam = await Exam.findOne({ title: `Half-Yearly Examination ${session.sessionName}` });
  if (!existingExam) {
    const examSubjects = [
      { subjectCode: "FLO", subjectName: "First Language (Odia)", maxMarks: 100, passMarks: 33 },
      { subjectCode: "SLE", subjectName: "Second Language (English)", maxMarks: 100, passMarks: 33 },
      { subjectCode: "MTH", subjectName: "Mathematics", maxMarks: 100, passMarks: 33 },
      { subjectCode: "GSC", subjectName: "General Science", maxMarks: 100, passMarks: 33 },
      { subjectCode: "SSC", subjectName: "Social Science", maxMarks: 100, passMarks: 33 },
      { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", maxMarks: 100, passMarks: 33 }
    ];

    const seededExam = await Exam.create({
      title: `Half-Yearly Examination ${session.sessionName}`,
      academicSession: session.sessionName,
      class: "10",
      examType: "half_yearly",
      subjects: examSubjects,
      status: "published",
      instructions: "State Board curriculum standard evaluation."
    });

    if (seededStudent) {
      const sampleSubjectMarks = [
        { subjectCode: "FLO", subjectName: "First Language (Odia)", maxMarks: 100, passMarks: 33, marksObtained: 88, grade: "A2", isAbsent: false },
        { subjectCode: "SLE", subjectName: "Second Language (English)", maxMarks: 100, passMarks: 33, marksObtained: 82, grade: "A2", isAbsent: false },
        { subjectCode: "MTH", subjectName: "Mathematics", maxMarks: 100, passMarks: 33, marksObtained: 94, grade: "A1", isAbsent: false },
        { subjectCode: "GSC", subjectName: "General Science", maxMarks: 100, passMarks: 33, marksObtained: 86, grade: "A2", isAbsent: false },
        { subjectCode: "SSC", subjectName: "Social Science", maxMarks: 100, passMarks: 33, marksObtained: 79, grade: "B1", isAbsent: false },
        { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", maxMarks: 100, passMarks: 33, marksObtained: 89, grade: "A2", isAbsent: false }
      ];

      const totalObtained = sampleSubjectMarks.reduce((sum, s) => sum + s.marksObtained, 0);
      const totalMax = 600;
      const pct = Number(((totalObtained / totalMax) * 100).toFixed(2));

      await ExamResult.create({
        exam: seededExam._id,
        student: seededStudent._id,
        studentId: seededStudent.studentId,
        rollNo: seededStudent.academic?.rollNo || 1,
        name: seededStudent.personal?.name || "Student",
        class: "10",
        section: seededStudent.academic?.section || "A",
        academicSession: session.sessionName,
        subjectMarks: sampleSubjectMarks,
        totalMarksObtained: totalObtained,
        totalMaxMarks: totalMax,
        percentage: pct,
        overallGrade: "A2",
        status: "Pass",
        division: "Distinction",
        rank: 1,
        remarks: "Exemplary academic dedication and outstanding conduct."
      });
    }
  }

  // 6. Seed Default Class Timetables with Subject Faculty Allocations
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const class10Periods = [
    { periodNo: 1, startTime: '10:00 AM', endTime: '10:45 AM', subject: 'First Language (Odia)', teacherName: 'Dr. Rajesh Mohapatra' },
    { periodNo: 2, startTime: '10:45 AM', endTime: '11:30 AM', subject: 'Second Language (English)', teacherName: 'English Faculty' },
    { periodNo: 3, startTime: '11:30 AM', endTime: '12:15 PM', subject: 'Mathematics', teacherName: 'Anshuman Das' },
    { periodNo: 4, startTime: '12:15 PM', endTime: '01:00 PM', subject: 'General Science', teacherName: 'Anshuman Das' },
    { periodNo: 5, startTime: '01:40 PM', endTime: '02:20 PM', subject: 'Social Science', teacherName: 'Dr. Rajesh Mohapatra' },
    { periodNo: 6, startTime: '02:20 PM', endTime: '03:00 PM', subject: 'Third Language (Hindi / Sanskrit)', teacherName: 'Classical Faculty' },
    { periodNo: 7, startTime: '03:00 PM', endTime: '03:40 PM', subject: 'Physical Education / ICT Lab', teacherName: 'PET / Computer Faculty' }
  ];

  const class9Periods = [
    { periodNo: 1, startTime: '10:00 AM', endTime: '10:45 AM', subject: 'First Language (Odia)', teacherName: 'Dr. Rajesh Mohapatra' },
    { periodNo: 2, startTime: '10:45 AM', endTime: '11:30 AM', subject: 'Second Language (English)', teacherName: 'English Faculty' },
    { periodNo: 3, startTime: '11:30 AM', endTime: '12:15 PM', subject: 'Mathematics', teacherName: 'Anshuman Das' },
    { periodNo: 4, startTime: '12:15 PM', endTime: '01:00 PM', subject: 'General Science', teacherName: 'Anshuman Das' },
    { periodNo: 5, startTime: '01:40 PM', endTime: '02:20 PM', subject: 'Social Science', teacherName: 'Dr. Rajesh Mohapatra' },
    { periodNo: 6, startTime: '02:20 PM', endTime: '03:00 PM', subject: 'Third Language (Hindi / Sanskrit)', teacherName: 'Classical Faculty' },
    { periodNo: 7, startTime: '03:00 PM', endTime: '03:40 PM', subject: 'ICT & Computer Lab', teacherName: 'Computer Faculty' }
  ];

  const class8Periods = [
    { periodNo: 1, startTime: '10:00 AM', endTime: '10:45 AM', subject: 'First Language (Odia)', teacherName: 'Dr. Rajesh Mohapatra' },
    { periodNo: 2, startTime: '10:45 AM', endTime: '11:30 AM', subject: 'Second Language (English)', teacherName: 'English Faculty' },
    { periodNo: 3, startTime: '11:30 AM', endTime: '12:15 PM', subject: 'Mathematics', teacherName: 'Math Faculty' },
    { periodNo: 4, startTime: '12:15 PM', endTime: '01:00 PM', subject: 'General Science', teacherName: 'Science Faculty' },
    { periodNo: 5, startTime: '01:40 PM', endTime: '02:20 PM', subject: 'Social Science', teacherName: 'Dr. Rajesh Mohapatra' },
    { periodNo: 6, startTime: '02:20 PM', endTime: '03:00 PM', subject: 'Third Language (Hindi / Sanskrit)', teacherName: 'Classical Faculty' },
    { periodNo: 7, startTime: '03:00 PM', endTime: '03:40 PM', subject: 'Physical Education', teacherName: 'PET Faculty' }
  ];

  const defaultTimetables = [
    {
      academicSession: session.sessionName,
      class: '10',
      section: 'A',
      classTeacher: 'Anshuman Das',
      roomNo: 'Room 1001',
      weeklySchedule: DAYS.map(day => ({ day, periods: JSON.parse(JSON.stringify(class10Periods)) }))
    },
    {
      academicSession: session.sessionName,
      class: '9',
      section: 'A',
      classTeacher: 'Class 9 Teacher',
      roomNo: 'Room 901',
      weeklySchedule: DAYS.map(day => ({ day, periods: JSON.parse(JSON.stringify(class9Periods)) }))
    },
    {
      academicSession: session.sessionName,
      class: '8',
      section: 'A',
      classTeacher: 'Dr. Rajesh Mohapatra',
      roomNo: 'Room 801',
      weeklySchedule: DAYS.map(day => ({ day, periods: JSON.parse(JSON.stringify(class8Periods)) }))
    }
  ];

  for (const tt of defaultTimetables) {
    const existing = await Timetable.findOne({ academicSession: tt.academicSession, class: tt.class, section: tt.section });
    if (!existing) {
      await Timetable.create(tt);
    }
  }

  console.log("Database seeded successfully.");
};

const runStandaloneSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  runStandaloneSeed();
}

module.exports = { seedDatabase };
