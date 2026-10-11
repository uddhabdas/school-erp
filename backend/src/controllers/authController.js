const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const logAction = require('../utils/auditLogger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Mobile/ID and password are required' });
    }

    const raw = (email || '').toString().trim();
    const cleanLower = raw.toLowerCase();

    // Look up user by lowercase email, mobile, or employee ID
    const user = await User.findOne({ 
      $or: [
        { email: cleanLower },
        { mobile: raw },
        { employeeId: raw.toUpperCase() },
        { employeeId: raw }
      ] 
    });

    if (user && await user.comparePassword(password)) {
      if (user.status === 'inactive') {
        return res.status(403).json({ message: 'Account is deactivated. Please contact administrator.' });
      }

      // Record login in audit logs
      try {
        await logAction(user._id, 'login', 'User', user._id, null, {
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId
        });
      } catch (logErr) {
        console.error('Audit log error on login:', logErr);
      }

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        employeeId: user.employeeId,
        token: generateToken(user)
      });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

// @desc    Change logged-in staff member's password
// @route   PUT /api/auth/change-password
// @access  Private (Staff / Faculty / Admin / Super Admin)
const changeStaffPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password does not match' });
    }

    user.password = newPassword.trim();
    await user.save();

    await logAction(user._id, 'update', 'User', user._id, null, {
      action: 'staff_self_change_password',
      name: user.name,
      role: user.role
    });

    res.json({ success: true, message: 'Your password has been changed successfully' });
  } catch (error) {
    console.error('Error changing staff password:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
};

// @desc    Super Admin can reset/change password for ANY staff member or student
// @route   PUT /api/auth/superadmin-reset-password
// @access  Private (Super Admin Only)
const superAdminResetPassword = async (req, res) => {
  try {
    const { targetType, targetId, newPassword } = req.body;

    if (!targetType || !targetId || !newPassword) {
      return res.status(400).json({ message: 'Target type (staff or student), target ID, and new password are required' });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({ message: 'New password must be at least 4 characters long' });
    }

    const cleanNewPassword = newPassword.trim();

    if (targetType === 'staff') {
      const user = await User.findById(targetId);
      if (!user) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      user.password = cleanNewPassword;
      await user.save();

      await logAction(req.user._id, 'update', 'User', user._id, null, {
        action: 'super_admin_reset_staff_password',
        targetName: user.name,
        targetRole: user.role,
        targetEmployeeId: user.employeeId
      });

      return res.json({
        success: true,
        message: `Password for staff member ${user.name} (${user.role}) has been reset successfully`
      });
    } else if (targetType === 'student') {
      const student = await Student.findById(targetId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const hashedPassword = await bcrypt.hash(cleanNewPassword, 10);
      student.password = hashedPassword;
      await student.save();

      await logAction(req.user._id, 'update', 'Student', student._id, null, {
        action: 'super_admin_reset_student_password',
        targetName: student.personal?.name,
        studentId: student.studentId,
        admissionNo: student.admissionNo
      });

      return res.json({
        success: true,
        message: `Password for student ${student.personal?.name} (ID: ${student.studentId}) has been reset successfully`
      });
    } else {
      return res.status(400).json({ message: 'Invalid target type. Must be "staff" or "student"' });
    }
  } catch (error) {
    console.error('Error in superAdminResetPassword:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
};

module.exports = {
  login,
  getMe,
  changeStaffPassword,
  superAdminResetPassword
};
