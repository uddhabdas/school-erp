require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./utils/db');

const authRoutes = require('./routes/authRoutes');
const studentAuthRoutes = require('./routes/studentAuthRoutes');
const parentAuthRoutes = require('./routes/parentAuthRoutes');
const academicSessionRoutes = require('./routes/academicSessionRoutes');
const admissionRoutes = require('./routes/admissionRoutes');
const studentRoutes = require('./routes/studentRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const feeRoutes = require('./routes/feeRoutes');
const examRoutes = require('./routes/examRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const rbacRoutes = require('./routes/rbacRoutes');

connectDB();

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow dev convenience or tighten as needed
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Auth rate limiter (generous limit for development & school premises)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/student-auth/login', authLimiter);
app.use('/api/parent-auth/login', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'School ERP Backend is running smoothly', time: new Date() });
});

// Main API routes
app.use('/api/auth', authRoutes);
app.use('/api/student-auth', studentAuthRoutes);
app.use('/api/parent-auth', parentAuthRoutes);
app.use('/api/sessions', academicSessionRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/rbac', rbacRoutes);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
