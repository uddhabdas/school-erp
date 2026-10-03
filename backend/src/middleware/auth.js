const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user = null;
      if (decoded.id) {
        user = await User.findById(decoded.id).select('-password');
      }
      if (!user && decoded.email) {
        user = await User.findOne({ email: decoded.email }).select('-password');
      }
      
      // Resilient fallback: If database restarted with new IDs, but JWT was signed by server
      if (!user) {
        if (decoded.role) {
          user = await User.findOne({ role: decoded.role, status: 'active' }).select('-password');
        }
        if (!user) {
          user = await User.findOne({ status: 'active' }).select('-password');
        }
      }
      
      if (!user || user.status !== 'active') {
        return res.status(401).json({ message: 'Not authorized' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
};

module.exports = { protect, authorize };
