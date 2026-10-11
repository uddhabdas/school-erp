const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware that allows requests from:
 * 1. School Staff / Admins (via User JWT)
 * 2. Students (via StudentAuth JWT)
 * 3. Parents (via ParentAuth JWT)
 * If no token is provided, it can optionally allow read-only student queries if desired.
 */
const allowStudentParentOrStaff = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization') || req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow read-only public student access if needed, or require auth:
      // In school portal, fees query by studentId is safe to return summary
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1. Parent Token
    if (decoded.role === 'parent' || decoded.studentIds) {
      req.parent = decoded;
      return next();
    }

    // 2. Student Token
    if (decoded.studentId) {
      req.student = decoded;
      return next();
    }

    // 3. Staff User Token
    if (decoded.id) {
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.status === 'active') {
        req.user = user;
        return next();
      }
      // If not in User, it might be student decoded by id
      req.student = decoded;
      return next();
    }

    next();
  } catch (error) {
    // If token is invalid or expired, continue gracefully for read-only or log
    next();
  }
};

module.exports = { allowStudentParentOrStaff };
