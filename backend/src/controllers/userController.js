const User = require('../models/User');
const SchoolSetting = require('../models/SchoolSetting');
const Timetable = require('../models/Timetable');
const cloudinary = require('../utils/cloudinary');
const logAction = require('../utils/auditLogger');

const generateEmployeeId = async () => {
  const year = new Date().getFullYear();
  const count = await User.countDocuments({ 
    createdAt: { $gte: new Date(year, 0, 1) } 
  });
  return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
};

const getUsers = async (req, res) => {
  try {
    const { role, search, status } = req.query;
    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    const select = req.user.role === 'faculty' 
      ? '-password -salary -bankDetails -salaryHistory -internalNotes'
      : '-password';

    const users = await User.find(query).select(select).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'faculty' && req.user._id.toString() !== user._id.toString()) {
      const { password, salary, bankDetails, salaryHistory, internalNotes, ...rest } = user.toObject();
      return res.json(rest);
    }

    const { password, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      email,
      mobile,
      name,
      role,
      password,
      designation,
      subject,
      qualification,
      assignedClasses,
      isClassTeacher,
      classTeacherOf
    } = req.body;

    const employeeId = await generateEmployeeId();

    const willBeClassTeacher = Boolean(isClassTeacher && classTeacherOf?.class);
    const targetClass = willBeClassTeacher ? (classTeacherOf.class || '') : '';
    const targetSection = willBeClassTeacher ? (classTeacherOf.section || 'A') : 'A';

    const user = await User.create({
      employeeId,
      name,
      email,
      mobile,
      password,
      role: role || 'faculty',
      designation: designation || '',
      subject: subject || '',
      qualification: qualification || '',
      assignedClasses: Array.isArray(assignedClasses) ? assignedClasses : [],
      isClassTeacher: willBeClassTeacher,
      classTeacherOf: willBeClassTeacher ? {
        class: targetClass,
        section: targetSection
      } : { class: '', section: 'A' },
      status: 'active'
    });

    // If designated as class teacher, unassign any previous teacher for that class & section
    if (willBeClassTeacher && targetClass) {
      await User.updateMany(
        {
          _id: { $ne: user._id },
          isClassTeacher: true,
          'classTeacherOf.class': targetClass,
          'classTeacherOf.section': targetSection
        },
        {
          $set: { isClassTeacher: false, 'classTeacherOf.class': '', 'classTeacherOf.section': 'A' }
        }
      );

      // Sync Timetable class teacher
      await Timetable.updateMany(
        { class: targetClass, section: targetSection },
        { $set: { classTeacher: user.name } }
      );
    }

    await logAction(req.user._id, 'create', 'User', user._id, null, user);

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or mobile already exists' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'faculty' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'faculty') {
      delete req.body.role;
      delete req.body.salary;
      delete req.body.bankDetails;
      delete req.body.designation;
      delete req.body.status;
      delete req.body.assignedClasses;
      delete req.body.isClassTeacher;
      delete req.body.classTeacherOf;
    }

    // Handle class teacher allocation changes
    if (req.body.isClassTeacher !== undefined) {
      const willBeClassTeacher = Boolean(req.body.isClassTeacher && req.body.classTeacherOf?.class);
      if (willBeClassTeacher) {
        const targetClass = req.body.classTeacherOf.class;
        const targetSection = req.body.classTeacherOf.section || 'A';

        // Reassign previous class teacher of the same class & section
        await User.updateMany(
          {
            _id: { $ne: user._id },
            isClassTeacher: true,
            'classTeacherOf.class': targetClass,
            'classTeacherOf.section': targetSection
          },
          {
            $set: { isClassTeacher: false, 'classTeacherOf.class': '', 'classTeacherOf.section': 'A' }
          }
        );

        // Sync Timetable
        await Timetable.updateMany(
          { class: targetClass, section: targetSection },
          { $set: { classTeacher: req.body.name || user.name } }
        );
      } else {
        req.body.isClassTeacher = false;
        req.body.classTeacherOf = { class: '', section: 'A' };
      }
    }

    // Handle password hashing if updating password
    if (req.body.password) {
      if (typeof req.body.password === 'string' && req.body.password.trim().length > 0) {
        const bcrypt = require('bcryptjs');
        req.body.password = await bcrypt.hash(req.body.password.trim(), 12);
      } else {
        delete req.body.password;
      }
    } else {
      delete req.body.password;
    }

    const oldData = { ...user.toObject() };
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAction(req.user._id, 'update', 'User', user._id, oldData, updated);

    const { password, ...userWithoutPassword } = updated.toObject();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Activate or Deactivate Faculty/User
const toggleUserStatus = async (req, res) => {
  try {
    const { status, securityCode } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetStatus = status || (user.status === 'active' ? 'inactive' : 'active');

    // Prevent user from deactivating themselves
    if (req.user._id.toString() === user._id.toString() && targetStatus === 'inactive') {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    // If a security code is provided, verify it
    if (securityCode) {
      const settings = await SchoolSetting.findOne();
      if (!settings || !(await settings.verifySecurityCode(securityCode))) {
        return res.status(403).json({ message: 'Invalid security code' });
      }
    }

    const oldData = { ...user.toObject() };
    user.status = targetStatus;
    await user.save();

    await logAction(
      req.user._id,
      targetStatus === 'active' ? 'activate' : 'deactivate',
      'User',
      user._id,
      oldData,
      user
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({
      success: true,
      message: `Staff member ${user.name} is now ${targetStatus}`,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Dedicated API: Assign Classes and Allocate Class Teacher
const assignFacultyClassAndTeacher = async (req, res) => {
  try {
    const { assignedClasses, isClassTeacher, classTeacherOf, subject, assignedSubjects, teachingAssignments } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Faculty member not found' });
    }

    const willBeClassTeacher = Boolean(isClassTeacher && classTeacherOf?.class);
    const targetClass = willBeClassTeacher ? (classTeacherOf.class || '') : '';
    const targetSection = willBeClassTeacher ? (classTeacherOf.section || 'A') : 'A';

    // If assigning as class teacher of class & section, unassign any previous teacher
    if (willBeClassTeacher && targetClass) {
      await User.updateMany(
        {
          _id: { $ne: user._id },
          isClassTeacher: true,
          'classTeacherOf.class': targetClass,
          'classTeacherOf.section': targetSection
        },
        {
          $set: { isClassTeacher: false, 'classTeacherOf.class': '', 'classTeacherOf.section': 'A' }
        }
      );

      // Sync Timetable class teacher
      await Timetable.updateMany(
        { class: targetClass, section: targetSection },
        { $set: { classTeacher: user.name } }
      );
    }

    const oldData = { ...user.toObject() };
    user.assignedClasses = Array.isArray(assignedClasses) ? assignedClasses : [];
    if (subject !== undefined) user.subject = subject;
    if (Array.isArray(assignedSubjects)) user.assignedSubjects = assignedSubjects;
    if (Array.isArray(teachingAssignments)) user.teachingAssignments = teachingAssignments;
    user.isClassTeacher = willBeClassTeacher;
    user.classTeacherOf = willBeClassTeacher ? {
      class: targetClass,
      section: targetSection
    } : { class: '', section: 'A' };

    await user.save();
    await logAction(req.user._id, 'update', 'User', user._id, oldData, user);

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({
      success: true,
      message: `Successfully allocated class teaching and class teacher roles for ${user.name}`,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { securityCode } = req.body;
    const settings = await SchoolSetting.findOne();
    if (!settings || !(await settings.verifySecurityCode(securityCode))) {
      return res.status(403).json({ message: 'Invalid security code' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAction(req.user._id, 'deactivate', 'User', user._id);
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignFacultyClassAndTeacher
};
