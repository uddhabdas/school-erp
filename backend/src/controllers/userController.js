const User = require('../models/User');
const SchoolSetting = require('../models/SchoolSetting');
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
    const { role, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: search },
        { mobile: search }
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
    const { email, mobile, name, role, password } = req.body;
    const employeeId = await generateEmployeeId();

    const user = await User.create({
      employeeId,
      name,
      email,
      mobile,
      password,
      role
    });

    await logAction(req.user._id, 'create', 'User', user._id, null, user);

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or mobile already exists' });
    }
    res.status(500).json({ message: 'Server error' });
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
    }

    const oldData = { ...user.toObject() };
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAction(req.user._id, 'update', 'User', user._id, oldData, updated);

    const { password, ...userWithoutPassword } = updated.toObject();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
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

    await logAction(req.user._id, 'delete', 'User', user._id);
    res.json({ message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
