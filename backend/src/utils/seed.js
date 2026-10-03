require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const SchoolSetting = require("../models/SchoolSetting");
const AcademicSession = require("../models/AcademicSession");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await User.deleteMany({});
    await SchoolSetting.deleteMany({});
    await AcademicSession.deleteMany({});

    const securityCode = await bcrypt.hash("admin123", 12);
    await SchoolSetting.create({
      securityCode,
      schoolName: "Dulichand Sonadevi High School",
      address: "Ranamunduli, Basta",
    });

    const hashedPassword = await bcrypt.hash("admin123", 12);
    await User.create({
      employeeId: "EMP-2024-0001",
      name: "Principal",
      email: "principal@school.com",
      mobile: "9876543210",
      password: hashedPassword,
      role: "super_admin",
      status: "active",
    });

    await User.create({
      employeeId: "EMP-2024-0002",
      name: "Admin User",
      email: "admin@school.com",
      mobile: "9876543211",
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    const currentYear = new Date().getFullYear();
    await AcademicSession.create({
      sessionName: `${currentYear}-${currentYear + 1}`,
      startDate: new Date(currentYear, 3, 1),
      endDate: new Date(currentYear + 1, 2, 31),
      admissionOpen: true,
      allowedClasses: ["8", "9"],
      status: "active",
    });

    console.log("Seed data created successfully!");
    console.log("Login credentials:");
    console.log("Email: principal@school.com");
    console.log("Password: admin123");
    console.log("Security code: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seed();
