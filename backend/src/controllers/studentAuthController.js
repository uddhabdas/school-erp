const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const studentLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    // identifier can be aadhaar, admission no, or student id
    const student = await Student.findOne({
      $or: [
        { 'personal.aadhaar': identifier },
        { admissionNo: identifier },
        { studentId: identifier }
      ]
    });

    if (!student) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { studentId: student.studentId, id: student._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, student: { ...student.toObject(), password: undefined } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    // Student is attached via middleware
    const student = await Student.findById(req.student.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.student.id,
      req.body,
      { new: true }
    ).select('-password');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const changeStudentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const student = await Student.findById(req.student.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    student.password = hashedPassword;
    await student.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { studentLogin, getStudentProfile, updateStudentProfile, changeStudentPassword };
