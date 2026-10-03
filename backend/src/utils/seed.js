require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const SchoolSetting = require("../models/SchoolSetting");
const AcademicSession = require("../models/AcademicSession");
const AdmissionApplication = require("../models/AdmissionApplication");
const Student = require("../models/Student");

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

  // 2. Users (Super Admin & Admin)
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

  // 3. Active Academic Session
  const currentYear = new Date().getFullYear();
  let session = await AcademicSession.findOne({ status: "active" });
  if (!session) {
    session = await AcademicSession.create({
      sessionName: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(currentYear, 3, 1),
      endDate: new Date(currentYear + 1, 2, 31),
      admissionOpen: true,
      allowedClasses: ["8", "9", "10"],
      status: "active",
    });
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
