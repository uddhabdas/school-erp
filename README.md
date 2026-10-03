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

### Promotion System
- Promote students to next class
- Pass out class 10 students
- Maintain academic history
- Security code protected

### Security & Audit
- JWT authentication
- Role-based access control (Super Admin, Admin, Faculty)
- Security code for critical operations
- Audit logs for all actions

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
