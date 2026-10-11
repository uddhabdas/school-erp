# School ERP System

A comprehensive School Management System built for **Dulichand Sonadevi High School, Ranamunduli, Basta**.

## Features

### Student Admission System
- Multi-step admission form
- Document uploads (photo, aadhaar, birth certificate, transfer certificate)
- Application verification workflow
- Student ID & Admission Number auto-generation

### Academic Session Management
- Create and manage academic sessions
- Control admission opening/closing
- Define allowed classes for admission
- Archive past sessions

### Student Records
- Complete student profiles
- Status tracking (active, inactive, passed out)
- Academic history
- Search and filter functionality

### Faculty Management
- Faculty profiles
- Role-based access control
- Salary history tracking
- Document management

### Fee Management & Billing
- Configurable Fee Heads (Tuition, Annual Development, Exam, Science Lab, Board Registration) per class or all classes
- Real-time student fee ledger with Total Fee, Total Paid, and Outstanding Balance Due
- Intelligent Fee Heads breakdown with paid vs pending status and 1-click counter auto-fill
- Resilient cashier collection counter with support for ObjectId, Student ID (`STU-XXXX`), or Admission Number lookup
- Multi-mode payment support: Cash (Office Counter), UPI / QR Code, Bank Transfer / NEFT, Cheque, and Online Portal
- Atomic, collision-free receipt number generation (`REC-YYYY-XXXXX`)
- Official Board-standard printable Cashier Money Receipts with school header, fee particulars, and authorized signatures (with isolated `@media print` layout)
- Integrated ledger view in Student and Parent portals with full transaction history

### Examinations & Report Card / Marksheet Generation
- Class-wise Student Directory & Academic Marksheets view (Class 8, Class 9, Class 10, All Classes) independent of academic session
- Quick Class Switcher tabs with live student counts and section filtering
- Instant marksheet performance summary per student with 1-click report card printing
- Examination lifecycle management (Unit Test, Half-Yearly, Annual, Pre-Board) per class cohort
- Standard BSE Odisha aligned 6-subject curriculum setup with customizable maximum and pass marks
- Interactive, spreadsheet-style marks entry grid with automatic calculation of aggregate marks, percentage, letter grades (A1 to F), and pass/compartment/fail status
- Class merit ranking table with rank badges, division calculations, and CSV marksheet export
- Official Board-standard printable Student Progress Report Cards (A4 format) with 5T Odisha transformation header, student profile, marks breakdown, teacher remarks, grading scale, and authorized signature blocks
- Integrated student and parent portals for viewing published exam results and printing report cards

### Transfer Certificate (TC) & Bonafide Generator
- Sequential atomic serial generation for official certificates (`TC-2026-0001`, `BON-2026-0001`, `CHAR-2026-0001`)
- Automatic date-of-birth to words conversion (e.g., "FIRST JANUARY TWO THOUSAND TEN")
- Complete 18-point Secondary School Certificate print layout aligned with Board of Secondary Education (BSE), Odisha standards
- Option to automatically mark outgoing students as "Transferred" in the main school directory

### Public Admission Status Tracker & Printable Slip
- Dedicated public tracking portal (`/track-admission`) for applicants to check scrutiny progress (Submitted -> Document Verification -> Headmaster Review -> Seat Allotted)
- Verification by Application Registration Number + Date of Birth
- Official printable Admission Acknowledgment Slip (A4) with physical document checklist, photo box, and parent counter foil

### Class Timetable & Routine Management
- 7-period daily timetable (Mon - Sat) per class cohort and section
- Period time-slots, subject color badges, and faculty assignment
- One-click official A4 printable routine for classroom display boards
- Direct routine view for students in the student dashboard

### Student ID Cards & Data Export
- One-click printable Student Identity Cards with student photo and barcode visual
- Instant CSV export for the Student Directory for district reporting and offline records

### Security & Audit
- JWT authentication with secure invalid-token rejection
- Helmet security HTTP headers & origin protection
- Rate-limiting on authentication and login endpoints to prevent brute-force attacks
- Safe regex query sanitization to protect against ReDoS
- Atomic sequence generation counters to prevent ID collisions
- Multer support for both images and PDF certificates
- Audit logs for all administrative actions

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (icons)

### Backend
- **Node.js**
- **Express.js**
- **MongoDB** with Mongoose
- **JWT** authentication
- **Cloudinary** for file storage
- **Multer** for file uploads

### Deployment
- Frontend: Vercel
- Backend: Render

## Project Structure

```
school-erp/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Student.js
│   │   │   ├── AdmissionApplication.js
│   │   │   ├── AcademicSession.js
│   │   │   ├── StudentAcademicHistory.js
│   │   │   ├── AuditLog.js
│   │   │   └── SchoolSetting.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── app/
    │   ├── dashboard/
    │   ├── admissions/
    │   ├── students/
    │   ├── faculty/
    │   ├── sessions/
    │   └── login/
    ├── components/
    ├── context/
    ├── package.json
    └── .env.local
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/school-erp
JWT_SECRET=your_jwt_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note for macOS Users:** macOS AirPlay Receiver uses port 5000 by default. Port 5001 is used to avoid port collisions.

4. Seed the database (creates admin user and default session):
```bash
npm run seed
```

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Default Credentials

After seeding the database:

| Role | Email / Identifier | Password |
|------|--------------------|----------|
| Super Admin | principal@school.com | admin123 |
| Admin | admin@school.com | admin123 |
| Student | 2345678903 (Aadhaar / Adm No) | 01-01-2010 (DOB: DD-MM-YYYY) |
| Parent | 9876543201 (Registered Mobile) | 01-01-2010 (Child DOB) / parent123 |

**Master Security Code**: admin123

## User Roles & Permissions

### Super Admin (Principal)
- Full access to all features
- Create user accounts
- Manage academic sessions
- Promote students
- Delete records
- View audit logs

### Admin / Data Entry
- Manage student records
- Verify admissions
- Manage faculty
- Upload documents
- Cannot delete without security code

### Faculty
- Verify admission applications
- View student records
- View and edit own profile
- Cannot access other faculty's personal info

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Academic Sessions
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/active` - Get active session (public)
- `POST /api/sessions` - Create session (Super Admin)
- `PUT /api/sessions/:id` - Update session (Super Admin)
- `PUT /api/sessions/:id/close` - Close session (Super Admin)
- `PUT /api/sessions/:id/archive` - Archive session (Super Admin)

### Admissions
- `POST /api/admissions` - Submit application (public)
- `GET /api/admissions` - Get applications
- `GET /api/admissions/:id` - Get application by ID
- `PUT /api/admissions/:id` - Update application
- `PUT /api/admissions/:id/approve` - Approve application
- `PUT /api/admissions/:id/reject` - Reject application

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Deactivate student (Super Admin)
- `POST /api/students/promote` - Promote students (Super Admin)
- `GET /api/students/:id/history` - Get academic history

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Super Admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (Super Admin)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/audit-logs` - Get audit logs (Super Admin, Admin)

### Settings
- `GET /api/settings` - Get school settings (public)
- `PUT /api/settings` - Update settings (Super Admin)

## Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Backend (Render)
1. Push code to GitHub
2. Create new Web Service in Render
3. Connect to GitHub repo
4. Set environment variables
5. Deploy

## License

MIT
