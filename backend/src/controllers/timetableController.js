const mongoose = require('mongoose');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const Student = require('../models/Student');
const SchoolSetting = require('../models/SchoolSetting');

const STANDARD_PERIODS = [
  { periodNo: 1, startTime: '10:00 AM', endTime: '10:45 AM', subject: 'First Language (Odia)', teacherName: 'Odia Faculty' },
  { periodNo: 2, startTime: '10:45 AM', endTime: '11:30 AM', subject: 'Second Language (English)', teacherName: 'English Faculty' },
  { periodNo: 3, startTime: '11:30 AM', endTime: '12:15 PM', subject: 'Mathematics', teacherName: 'Math Faculty' },
  { periodNo: 4, startTime: '12:15 PM', endTime: '01:00 PM', subject: 'General Science', teacherName: 'Science Faculty' },
  { periodNo: 5, startTime: '01:40 PM', endTime: '02:20 PM', subject: 'Social Science', teacherName: 'Social Studies Faculty' },
  { periodNo: 6, startTime: '02:20 PM', endTime: '03:00 PM', subject: 'Third Language (Hindi / Sanskrit)', teacherName: 'Classical Faculty' },
  { periodNo: 7, startTime: '03:00 PM', endTime: '03:40 PM', subject: 'Physical Education / ICT Lab', teacherName: 'PET / Computer Faculty' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function buildDefaultSchedule() {
  return DAYS.map((day) => ({
    day,
    periods: JSON.parse(JSON.stringify(STANDARD_PERIODS))
  }));
}

// 1. Get Timetable for Class & Section
const getTimetable = async (req, res) => {
  try {
    const { session, class: studentClass, section = 'A' } = req.query;
    const targetSession = session || '2025-2026';
    const targetClass = studentClass || '10';

    let routine = await Timetable.findOne({
      academicSession: targetSession,
      class: targetClass,
      section: section
    });

    if (!routine) {
      // Return a fresh default template without forcing persistence
      routine = {
        academicSession: targetSession,
        class: targetClass,
        section,
        classTeacher: `Class ${targetClass} Teacher`,
        roomNo: `Room ${targetClass}01`,
        weeklySchedule: buildDefaultSchedule(),
        isDefault: true
      };
    }

    const schoolSetting = await SchoolSetting.findOne() || {
      schoolName: 'DULICHAND SONADEVI HIGH SCHOOL',
      address: 'Ranamunduli, Basta, Balasore, Odisha - 756029'
    };

    res.json({
      success: true,
      school: schoolSetting,
      timetable: routine
    });
  } catch (error) {
    console.error('getTimetable error:', error);
    res.status(500).json({ message: 'Error retrieving timetable', error: error.message });
  }
};

// 2. Save or Update Timetable
const saveTimetable = async (req, res) => {
  try {
    const { academicSession, class: studentClass, section = 'A', classTeacher, roomNo, weeklySchedule } = req.body;

    if (!academicSession || !studentClass) {
      return res.status(400).json({ message: 'Session and class are required' });
    }

    const updated = await Timetable.findOneAndUpdate(
      { academicSession, class: studentClass, section },
      {
        $set: {
          classTeacher: classTeacher || `Class ${studentClass} Teacher`,
          roomNo: roomNo || 'Room 101',
          weeklySchedule: weeklySchedule || buildDefaultSchedule(),
          updatedBy: req.user?._id
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: `Weekly timetable for Class ${studentClass}-${section} successfully saved`,
      timetable: updated
    });
  } catch (error) {
    console.error('saveTimetable error:', error);
    res.status(500).json({ message: 'Failed to save timetable', error: error.message });
  }
};

// 3. Get Faculty List for assigning to periods
const getFacultyOptions = async (req, res) => {
  try {
    const faculty = await User.find({ role: { $in: ['faculty', 'admin', 'super_admin'] }, status: 'active' })
      .select('name email designation subject mobile employeeId assignedClasses isClassTeacher classTeacherOf')
      .sort({ name: 1 });

    res.json({ success: true, faculty });
  } catch (error) {
    res.status(500).json({ message: 'Error loading faculty list', error: error.message });
  }
};

// 4. Student view: Get class timetable for logged-in student or child
const getMyClassTimetable = async (req, res) => {
  try {
    let studentId = req.student?.id || req.params?.studentId || req.query?.studentId;

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID parameter is required' });
    }

    const cleanId = String(studentId).trim();
    let student = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      student = await Student.findById(cleanId);
    }
    if (!student) {
      student = await Student.findOne({
        $or: [
          { studentId: cleanId },
          { admissionNo: cleanId },
          { 'personal.aadhaar': cleanId }
        ]
      });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const targetClass = student.academic?.class || '10';
    const targetSection = student.academic?.section || 'A';
    const targetSession = student.academic?.sessionName || '2026-2027';

    let routine = await Timetable.findOne({
      class: targetClass,
      section: targetSection
    });

    if (!routine) {
      routine = {
        academicSession: targetSession,
        class: targetClass,
        section: targetSection,
        classTeacher: `Class ${targetClass} Teacher`,
        roomNo: `Room ${targetClass}01`,
        weeklySchedule: buildDefaultSchedule(),
        isDefault: true
      };
    }

    res.json({ success: true, timetable: routine });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student timetable', error: error.message });
  }
};

// 5. Allocate faculty to subjects for a class in Timetable
const allocateSubjectFaculty = async (req, res) => {
  try {
    const { session: sessionName, class: studentClass, allocations } = req.body;

    if (!studentClass || !Array.isArray(allocations)) {
      return res.status(400).json({ message: 'Class and allocations list are required' });
    }

    const AcademicSession = require('../models/AcademicSession');

    // Find active or target academic session
    const sessionQuery = sessionName ? { sessionName } : { status: 'active' };
    const academicSession = (await AcademicSession.findOne(sessionQuery)) || (await AcademicSession.findOne().sort({ createdAt: -1 }));

    if (academicSession && Array.isArray(academicSession.classConfigs)) {
      const clsCfg = academicSession.classConfigs.find((c) => c.className === String(studentClass));
      if (clsCfg && Array.isArray(clsCfg.subjects)) {
        for (const alloc of allocations) {
          const sub = clsCfg.subjects.find((s) => s.subjectName.toLowerCase() === (alloc.subjectName || '').toLowerCase());
          if (sub) {
            sub.assignedTeacher = alloc.teacherName || '';
            sub.assignedTeacherId = alloc.teacherId || null;
          }
        }
        academicSession.markModified('classConfigs');
        await academicSession.save();
      }
    }

    // Also update any existing Timetable routines for this class
    const timetables = await Timetable.find({
      class: String(studentClass),
      ...(academicSession ? { academicSession: academicSession.sessionName } : {})
    });

    for (const tt of timetables) {
      let modified = false;
      if (Array.isArray(tt.weeklySchedule)) {
        for (const day of tt.weeklySchedule) {
          if (Array.isArray(day.periods)) {
            for (const p of day.periods) {
              const match = allocations.find((a) => (a.subjectName || '').toLowerCase() === (p.subject || '').toLowerCase());
              if (match && match.teacherName) {
                p.teacherName = match.teacherName;
                modified = true;
              }
            }
          }
        }
      }
      if (modified) {
        tt.markModified('weeklySchedule');
        await tt.save();
      }
    }

    res.json({
      success: true,
      message: `Successfully allocated faculty for Class ${studentClass} subjects`,
      allocations
    });
  } catch (error) {
    console.error('allocateSubjectFaculty error:', error);
    res.status(500).json({ message: 'Error allocating subject faculty', error: error.message });
  }
};

// 6. Get Personal Teaching Schedule & Timings for Logged-In Faculty
const getMyTeachingSchedule = async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Faculty user not found' });
    }

    const userName = (user.name || '').trim();
    const userSubject = (user.subject || '').trim();
    const assignedSubjects = (user.assignedSubjects || []).map((s) => s.trim().toLowerCase());
    const teachingAssignments = user.teachingAssignments || [];

    // Find active Academic Session
    const AcademicSession = require('../models/AcademicSession');
    const activeSession = (await AcademicSession.findOne({ status: 'active' })) || (await AcademicSession.findOne().sort({ createdAt: -1 }));
    const sessionName = activeSession ? activeSession.sessionName : '2026-2027';

    // Find all allocated subjects from AcademicSession classConfigs
    const allocatedSubjectsList = [];
    if (activeSession && Array.isArray(activeSession.classConfigs)) {
      for (const cls of activeSession.classConfigs) {
        for (const sub of (cls.subjects || [])) {
          const isAssigned =
            (sub.assignedTeacherId && String(sub.assignedTeacherId) === String(userId)) ||
            (sub.assignedTeacher && sub.assignedTeacher.trim().toLowerCase() === userName.toLowerCase()) ||
            teachingAssignments.some(
              (ta) => String(ta.class) === String(cls.className) && (ta.subject || '').trim().toLowerCase() === sub.subjectName.trim().toLowerCase()
            );

          if (isAssigned) {
            allocatedSubjectsList.push({
              class: cls.className,
              subjectName: sub.subjectName,
              subjectCode: sub.subjectCode || sub.subjectName.slice(0, 3).toUpperCase(),
              sections: cls.sections || ['A']
            });
          }
        }
      }
    }

    // Fallback to user.teachingAssignments if session classConfigs didn't specify
    if (allocatedSubjectsList.length === 0 && teachingAssignments.length > 0) {
      for (const ta of teachingAssignments) {
        allocatedSubjectsList.push({
          class: ta.class,
          subjectName: ta.subject,
          subjectCode: (ta.subject || '').slice(0, 3).toUpperCase(),
          sections: [ta.section || 'A']
        });
      }
    }

    // Fallback to primary subject and assigned classes if still empty
    if (allocatedSubjectsList.length === 0 && userSubject) {
      const classes = user.assignedClasses?.length > 0 ? user.assignedClasses : ['9', '10'];
      for (const cls of classes) {
        allocatedSubjectsList.push({
          class: cls,
          subjectName: userSubject,
          subjectCode: userSubject.slice(0, 3).toUpperCase(),
          sections: ['A']
        });
      }
    }

    // Fetch existing Timetables
    let timetables = await Timetable.find({
      $or: [
        { academicSession: sessionName },
        { academicSession: { $exists: true } }
      ]
    });

    // If no timetables exist yet, use default template for classes 8, 9, 10
    if (!timetables || timetables.length === 0) {
      timetables = ['8', '9', '10'].map((cls) => ({
        academicSession: sessionName,
        class: cls,
        section: 'A',
        classTeacher: user.classTeacherOf?.class === cls ? user.name : `Class ${cls} Teacher`,
        roomNo: `Room ${cls}01`,
        weeklySchedule: buildDefaultSchedule()
      }));
    }

    // Build the weekly schedule for this faculty member
    const weeklySchedule = DAYS.map((dayName) => {
      const dayPeriods = [];

      for (const tt of timetables) {
        const cls = tt.class;
        const sec = tt.section || 'A';
        const daySchedule = (tt.weeklySchedule || []).find((d) => d.day.toLowerCase() === dayName.toLowerCase());

        if (daySchedule && Array.isArray(daySchedule.periods)) {
          for (const p of daySchedule.periods) {
            const pTeacher = (p.teacherName || '').trim().toLowerCase();
            const pSubject = (p.subject || '').trim().toLowerCase();

            const isTeacherDirectMatch =
              pTeacher &&
              (pTeacher === userName.toLowerCase() ||
                userName.toLowerCase().includes(pTeacher) ||
                pTeacher.includes(userName.toLowerCase()));

            const isSubjectAllocated = allocatedSubjectsList.some(
              (alloc) => String(alloc.class) === String(cls) && alloc.subjectName.trim().toLowerCase() === pSubject
            );

            const isAllocated = allocatedSubjectsList.length > 0
              ? (isTeacherDirectMatch || isSubjectAllocated)
              : (isTeacherDirectMatch || ((assignedSubjects.includes(pSubject) || (userSubject && userSubject.toLowerCase() === pSubject)) && (!p.teacherName || p.teacherName.includes('Faculty') || isTeacherDirectMatch)));

            if (isAllocated) {
              dayPeriods.push({
                periodNo: p.periodNo,
                startTime: p.startTime || '10:00 AM',
                endTime: p.endTime || '10:45 AM',
                timing: `${p.startTime || '10:00 AM'} - ${p.endTime || '10:45 AM'}`,
                subject: p.subject,
                class: cls,
                section: sec,
                roomNo: p.roomNo || tt.roomNo || `Room ${cls}01`,
                isClassTeacher: Boolean(user.isClassTeacher && user.classTeacherOf?.class === cls && user.classTeacherOf?.section === sec)
              });
            }
          }
        }
      }

      // Sort periods chronologically
      dayPeriods.sort((a, b) => a.periodNo - b.periodNo);

      return {
        day: dayName,
        periods: dayPeriods
      };
    });

    // Determine current day of week
    const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysMap[new Date().getDay()];
    const todaySchedule = weeklySchedule.find((d) => d.day.toLowerCase() === currentDayName.toLowerCase());
    const todayPeriods = todaySchedule ? todaySchedule.periods : [];

    const totalWeeklyPeriods = weeklySchedule.reduce((sum, d) => sum + d.periods.length, 0);
    const uniqueClasses = Array.from(new Set(allocatedSubjectsList.map((a) => a.class)));
    const uniqueSubjects = Array.from(new Set(allocatedSubjectsList.map((a) => a.subjectName)));

    res.json({
      success: true,
      faculty: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        designation: user.designation || 'Faculty Member',
        subject: user.subject,
        assignedSubjects: user.assignedSubjects || [],
        isClassTeacher: Boolean(user.isClassTeacher),
        classTeacherOf: user.classTeacherOf || null
      },
      academicSession: sessionName,
      allocatedClasses: uniqueClasses,
      allocatedSubjects: allocatedSubjectsList,
      weeklySchedule,
      todaySchedule: {
        day: currentDayName,
        isSchoolDay: currentDayName !== 'Sunday',
        periodsCount: todayPeriods.length,
        periods: todayPeriods
      },
      totalWeeklyPeriods
    });
  } catch (error) {
    console.error('getMyTeachingSchedule error:', error);
    res.status(500).json({ message: 'Error retrieving faculty teaching schedule', error: error.message });
  }
};

module.exports = {
  getTimetable,
  saveTimetable,
  getFacultyOptions,
  getMyClassTimetable,
  allocateSubjectFaculty,
  getMyTeachingSchedule
};
