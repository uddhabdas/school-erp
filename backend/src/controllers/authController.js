const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
    const user = await User.findOne({ 
      $or: [{ email }, { mobile: email }] 
    });

    if (user && await user.comparePassword(password)) {
      // Record login in audit logs
      await logAction(user._id, 'login', 'User', user._id, null, {
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        employeeId: user.employeeId,
        token: generateToken(user)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { login, getMe };
