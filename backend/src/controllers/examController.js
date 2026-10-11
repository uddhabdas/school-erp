const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const SchoolSetting = require('../models/SchoolSetting');
const { escapeRegex } = require('../utils/sanitize');

// Default standard curriculum for Odisha High School
const DEFAULT_SUBJECTS = [
  { subjectCode: 'FLO', subjectName: 'First Language (Odia)', maxMarks: 100, passMarks: 33 },
  { subjectCode: 'SLE', subjectName: 'Second Language (English)', maxMarks: 100, passMarks: 33 },
  { subjectCode: 'MTH', subjectName: 'Mathematics', maxMarks: 100, passMarks: 33 },
  { subjectCode: 'GSC', subjectName: 'General Science', maxMarks: 100, passMarks: 33 },
  { subjectCode: 'SSC', subjectName: 'Social Science', maxMarks: 100, passMarks: 33 },
  { subjectCode: 'TLH', subjectName: 'Third Language (Hindi / Sanskrit)', maxMarks: 100, passMarks: 33 }
];

const calculateGrade = (marksObtained, maxMarks, passMarks, isAbsent = false) => {
  if (isAbsent) return 'AB';
  if (marksObtained < passMarks) return 'F';
  const pct = (marksObtained / maxMarks) * 100;
  if (pct >= 90) return 'A1';
  if (pct >= 80) return 'A2';
  if (pct >= 70) return 'B1';
  if (pct >= 60) return 'B2';
  if (pct >= 50) return 'C1';
  if (pct >= 40) return 'C2';
  if (pct >= 33) return 'D';
  return 'F';
};

const calculateOverallGrade = (pct, status) => {
  if (status === 'Fail' || status === 'Absent') return 'F';
  if (pct >= 90) return 'A1';
  if (pct >= 80) return 'A2';
  if (pct >= 70) return 'B1';
  if (pct >= 60) return 'B2';
  if (pct >= 50) return 'C1';
  if (pct >= 40) return 'C2';
  if (pct >= 33) return 'D';
  return 'F';
};

const calculateDivision = (pct, status) => {
  if (status === 'Fail') return 'Failed';
  if (status === 'Compartment') return 'Compartment';
  if (status === 'Absent') return 'Failed';
  if (pct >= 75) return 'Distinction';
  if (pct >= 60) return '1st Division';
  if (pct >= 45) return '2nd Division';
  if (pct >= 33) return '3rd Division';
  return 'Failed';
};

// 1. Get all exams
const getExams = async (req, res) => {
  try {
    const { academicSession, class: studentClass, status } = req.query;
    const filter = {};
    if (academicSession && academicSession !== 'all') filter.academicSession = academicSession;
    if (studentClass && studentClass !== 'all') filter.class = studentClass;
    if (status && status !== 'all') filter.status = status;

    const exams = await Exam.find(filter).sort({ createdAt: -1 });

    // Attach count of evaluated results for each exam
    const examsWithCounts = await Promise.all(
      exams.map(async (exam) => {
        const resultCount = await ExamResult.countDocuments({ exam: exam._id });
        const examObj = exam.toObject();
        examObj.resultCount = resultCount;
        return examObj;
      })
    );

    res.json({ success: true, exams: examsWithCounts });
  } catch (error) {
    console.error('getExams error:', error);
    res.status(500).json({ message: 'Failed to retrieve exams', error: error.message });
  }
};

// 2. Create new Exam
const createExam = async (req, res) => {
  try {
    const {
      title,
      academicSession,
      class: studentClass,
      examType,
      startDate,
      endDate,
      subjects,
      instructions
    } = req.body;

    if (!title || !academicSession || !studentClass) {
      return res.status(400).json({ message: 'Title, academic session, and class are required' });
    }

    const assignedSubjects = Array.isArray(subjects) && subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;

    const newExam = new Exam({
      title: title.trim(),
      academicSession: academicSession.trim(),
      class: studentClass,
      examType: examType || 'annual',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      subjects: assignedSubjects,
      instructions: instructions || '',
      createdBy: req.user?._id
    });

    await newExam.save();
    res.status(201).json({ success: true, message: 'Exam created successfully', exam: newExam });
  } catch (error) {
    console.error('createExam error:', error);
    res.status(500).json({ message: 'Failed to create exam', error: error.message });
  }
};

// 3. Get single exam with subject outline
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    res.json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving exam', error: error.message });
  }
};

// 4. Update Exam
const updateExam = async (req, res) => {
  try {
    const { title, academicSession, class: studentClass, examType, startDate, endDate, subjects, instructions, status } = req.body;
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (title) exam.title = title.trim();
    if (academicSession) exam.academicSession = academicSession.trim();
    if (studentClass) exam.class = studentClass;
    if (examType) exam.examType = examType;
    if (startDate !== undefined) exam.startDate = startDate;
    if (endDate !== undefined) exam.endDate = endDate;
    if (subjects && Array.isArray(subjects)) exam.subjects = subjects;
    if (instructions !== undefined) exam.instructions = instructions;
    if (status) exam.status = status;

    await exam.save();
    res.json({ success: true, message: 'Exam updated successfully', exam });
  } catch (error) {
    res.status(500).json({ message: 'Error updating exam', error: error.message });
  }
};

// 5. Delete Exam and all marks
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    await ExamResult.deleteMany({ exam: exam._id });
    await Exam.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Exam and all associated marks successfully deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exam', error: error.message });
  }
};

// 6. Toggle publish status
const togglePublish = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    exam.status = exam.status === 'published' ? 'draft' : 'published';
    await exam.save();

    res.json({
      success: true,
      message: `Exam status changed to ${exam.status}`,
      status: exam.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating publish status', error: error.message });
  }
};

// Helper to resolve allocated subjects for faculty for a given exam
const getAllocatedSubjectsForFaculty = async (user, exam) => {
  if (!user) return [];
  const isStaffAdmin = user.role === 'super_admin' || user.role === 'admin';
  if (isStaffAdmin) {
    return exam.subjects.map((s) => s.subjectName);
  }

  const allocatedSet = new Set();
  const userNameLower = (user.name || '').trim().toLowerCase();
  const userIdStr = user._id ? String(user._id) : '';

  // 1. Direct faculty profile subject & assignedSubjects
  if (user.subject && typeof user.subject === 'string' && user.subject.trim()) {
    allocatedSet.add(user.subject.trim());
  }
  if (Array.isArray(user.assignedSubjects)) {
    user.assignedSubjects.forEach((s) => {
      if (s && typeof s === 'string' && s.trim()) allocatedSet.add(s.trim());
    });
  }

  // 2. Teaching assignments for this class
  if (Array.isArray(user.teachingAssignments)) {
    user.teachingAssignments.forEach((ta) => {
      if (!ta.class || String(ta.class) === String(exam.class)) {
        if (ta.subject && ta.subject.trim()) allocatedSet.add(ta.subject.trim());
      }
    });
  }

  // 3. AcademicSession classConfigs allocations for this class
  try {
    const AcademicSession = require('../models/AcademicSession');
    const sessionDoc = (await AcademicSession.findOne({ sessionName: exam.academicSession })) ||
                       (await AcademicSession.findOne({ status: 'active' }));
    if (sessionDoc && Array.isArray(sessionDoc.classConfigs)) {
      const clsCfg = sessionDoc.classConfigs.find((c) => String(c.className) === String(exam.class));
      if (clsCfg && Array.isArray(clsCfg.subjects)) {
        clsCfg.subjects.forEach((sub) => {
          const idMatch = sub.assignedTeacherId && String(sub.assignedTeacherId) === userIdStr;
          const nameMatch = sub.assignedTeacher && sub.assignedTeacher.trim().toLowerCase() === userNameLower;
          if (idMatch || nameMatch) {
            allocatedSet.add(sub.subjectName.trim());
          }
        });
      }
    }
  } catch (err) {
    console.error('Error querying AcademicSession allocations:', err);
  }

  // 4. Timetable allocations for this class
  try {
    const Timetable = require('../models/Timetable');
    const timetables = await Timetable.find({ class: String(exam.class) });
    timetables.forEach((tt) => {
      if (Array.isArray(tt.weeklySchedule)) {
        tt.weeklySchedule.forEach((day) => {
          if (Array.isArray(day.periods)) {
            day.periods.forEach((p) => {
              if (p.teacherName && p.teacherName.trim().toLowerCase() === userNameLower) {
                if (p.subject && p.subject.trim()) allocatedSet.add(p.subject.trim());
              }
            });
          }
        });
      }
    });
  } catch (err) {
    console.error('Error querying Timetable allocations:', err);
  }

  const allocatedList = Array.from(allocatedSet);
  const matchedExamSubjects = [];

  exam.subjects.forEach((examSub) => {
    const examSubName = examSub.subjectName.trim();
    const examSubCode = (examSub.subjectCode || '').trim();

    const isMatch = allocatedList.some((alloc) => {
      const a = alloc.toLowerCase();
      const b = examSubName.toLowerCase();
      const c = examSubCode.toLowerCase();
      return a === b || b.includes(a) || a.includes(b) || (c && a === c);
    });

    if (isMatch) {
      matchedExamSubjects.push(examSubName);
    }
  });

  return matchedExamSubjects;
};

// 7. Get Marks Entry Grid for an Exam
// Returns active students in that class, merged with existing marks
const getMarksGrid = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const isStaffAdmin = req.user.role === 'super_admin' || req.user.role === 'admin';
    const allocatedSubjects = await getAllocatedSubjectsForFaculty(req.user, exam);

    const { section } = req.query;

    const existingResults = await ExamResult.find({ exam: exam._id });
    const existingStudentIds = existingResults.map((r) => r.student);

    const studentFilter = {
      $or: [
        { 'academic.class': exam.class, status: 'active' },
        { _id: { $in: existingStudentIds } }
      ]
    };
    if (section) studentFilter['academic.section'] = section;

    const students = await Student.find(studentFilter)
      .sort({ 'academic.rollNo': 1, 'personal.name': 1 })
      .select('studentId admissionNo personal.name personal.gender academic.rollNo academic.section academic.sessionName');

    const resultMap = new Map();
    existingResults.forEach((r) => {
      resultMap.set(String(r.student), r);
    });

    const grid = students.map((std) => {
      const existing = resultMap.get(String(std._id));

      let subjectMarks = [];
      if (existing && existing.subjectMarks && existing.subjectMarks.length > 0) {
        // Map from existing, matching with exam subjects
        subjectMarks = exam.subjects.map((sub) => {
          const match = existing.subjectMarks.find(
            (sm) => sm.subjectName.toLowerCase() === sub.subjectName.toLowerCase() ||
                    (sub.subjectCode && sm.subjectCode === sub.subjectCode)
          );
          return {
            subjectCode: sub.subjectCode,
            subjectName: sub.subjectName,
            maxMarks: sub.maxMarks,
            passMarks: sub.passMarks,
            marksObtained: match ? match.marksObtained : 0,
            grade: match ? match.grade : calculateGrade(0, sub.maxMarks, sub.passMarks),
            isAbsent: match ? Boolean(match.isAbsent) : false
          };
        });
      } else {
        // Fresh row
        subjectMarks = exam.subjects.map((sub) => ({
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          maxMarks: sub.maxMarks,
          passMarks: sub.passMarks,
          marksObtained: 0,
          grade: 'F',
          isAbsent: false
        }));
      }

      return {
        studentObjectId: std._id,
        studentId: std.studentId,
        admissionNo: std.admissionNo,
        name: std.personal?.name || 'N/A',
        rollNo: std.academic?.rollNo || 0,
        section: std.academic?.section || 'A',
        subjectMarks,
        totalMarksObtained: existing ? existing.totalMarksObtained : 0,
        totalMaxMarks: existing ? existing.totalMaxMarks : exam.subjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0),
        percentage: existing ? existing.percentage : 0,
        overallGrade: existing ? existing.overallGrade : 'F',
        status: existing ? existing.status : 'Pass',
        division: existing ? existing.division : '1st Division',
        rank: existing ? existing.rank : null,
        remarks: existing ? existing.remarks : 'Good effort.',
        isSaved: Boolean(existing)
      };
    });

    res.json({
      success: true,
      exam,
      studentsCount: students.length,
      grid,
      allocatedSubjects,
      isStaffAdmin,
      userRole: req.user.role
    });
  } catch (error) {
    console.error('getMarksGrid error:', error);
    res.status(500).json({ message: 'Error loading marks grid', error: error.message });
  }
};

// 8. Bulk Save Marks for an Exam (Enforcing faculty subject allocation)
const saveBulkMarks = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ message: 'Results array is required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const isStaffAdmin = req.user.role === 'super_admin' || req.user.role === 'admin';
    const allocatedSubjects = await getAllocatedSubjectsForFaculty(req.user, exam);

    if (!isStaffAdmin && allocatedSubjects.length === 0) {
      return res.status(403).json({
        message: `You are not allocated to teach any subjects for Class ${exam.class} in this exam. Please contact the administrator.`
      });
    }

    // Load existing results to preserve marks for subjects not allocated to this faculty
    const studentObjectIds = results.map((r) => r.studentObjectId).filter(Boolean);
    const existingResults = await ExamResult.find({
      exam: exam._id,
      student: { $in: studentObjectIds }
    });
    const existingMap = new Map();
    existingResults.forEach((er) => {
      existingMap.set(String(er.student), er);
    });

    const totalMax = exam.subjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0);
    const processedList = [];

    for (const item of results) {
      if (!item.studentObjectId) continue;

      const existingRecord = existingMap.get(String(item.studentObjectId));
      let studentTotal = 0;
      let failedSubjectCount = 0;
      let allAbsent = true;

      const processedSubjectMarks = exam.subjects.map((sub) => {
        const isSubjectAllocated = isStaffAdmin || allocatedSubjects.includes(sub.subjectName);

        let finalMarkObtained = 0;
        let finalIsAbsent = false;

        if (isSubjectAllocated) {
          // Take submitted value from faculty/admin
          const inputMark = (item.subjectMarks || []).find(
            (sm) => sm.subjectName.toLowerCase() === sub.subjectName.toLowerCase() ||
                    (sub.subjectCode && sm.subjectCode === sub.subjectCode)
          );

          if (inputMark !== undefined) {
            finalIsAbsent = Boolean(inputMark?.isAbsent);
            const rawObtained = Number(inputMark?.marksObtained || 0);
            finalMarkObtained = finalIsAbsent ? 0 : Math.min(Math.max(rawObtained, 0), sub.maxMarks);
          } else {
            // If omitted in payload, keep existing mark
            const existingSubMark = existingRecord?.subjectMarks?.find(
              (sm) => sm.subjectName.toLowerCase() === sub.subjectName.toLowerCase() ||
                      (sub.subjectCode && sm.subjectCode === sub.subjectCode)
            );
            if (existingSubMark) {
              finalMarkObtained = Number(existingSubMark.marksObtained || 0);
              finalIsAbsent = Boolean(existingSubMark.isAbsent);
            }
          }
        } else {
          // Preserve existing marks for subjects not allocated to this faculty
          const existingSubMark = existingRecord?.subjectMarks?.find(
            (sm) => sm.subjectName.toLowerCase() === sub.subjectName.toLowerCase() ||
                    (sub.subjectCode && sm.subjectCode === sub.subjectCode)
          );
          if (existingSubMark) {
            finalMarkObtained = Number(existingSubMark.marksObtained || 0);
            finalIsAbsent = Boolean(existingSubMark.isAbsent);
          } else {
            finalMarkObtained = 0;
            finalIsAbsent = false;
          }
        }

        if (!finalIsAbsent) allAbsent = false;
        studentTotal += finalMarkObtained;

        const grade = calculateGrade(finalMarkObtained, sub.maxMarks, sub.passMarks, finalIsAbsent);
        if (!finalIsAbsent && finalMarkObtained < sub.passMarks) {
          failedSubjectCount++;
        }

        return {
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          maxMarks: sub.maxMarks,
          passMarks: sub.passMarks,
          marksObtained: finalMarkObtained,
          grade,
          isAbsent: finalIsAbsent
        };
      });

      const percentage = totalMax > 0 ? Number(((studentTotal / totalMax) * 100).toFixed(2)) : 0;

      let status = 'Pass';
      if (allAbsent) {
        status = 'Absent';
      } else if (failedSubjectCount === 1) {
        status = 'Compartment';
      } else if (failedSubjectCount > 1) {
        status = 'Fail';
      }

      const overallGrade = calculateOverallGrade(percentage, status);
      const division = calculateDivision(percentage, status);

      processedList.push({
        exam: exam._id,
        student: item.studentObjectId,
        studentId: item.studentId,
        rollNo: item.rollNo,
        name: item.name,
        class: exam.class,
        section: item.section || 'A',
        academicSession: exam.academicSession,
        subjectMarks: processedSubjectMarks,
        totalMarksObtained: studentTotal,
        totalMaxMarks: totalMax,
        percentage,
        overallGrade,
        status,
        division,
        remarks: item.remarks || (percentage >= 75 ? 'Outstanding academic accomplishment!' : 'Good effort, continue working hard.'),
        enteredBy: req.user?._id
      });
    }

    // Rank calculation (Pass students ranked by percentage descending)
    const passedSorted = [...processedList]
      .filter((p) => p.status === 'Pass')
      .sort((a, b) => b.percentage - a.percentage);

    passedSorted.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Upsert into ExamResult
    const savedResults = [];
    for (const data of processedList) {
      const updated = await ExamResult.findOneAndUpdate(
        { exam: data.exam, student: data.student },
        { $set: data },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      savedResults.push(updated);
    }

    const savedSummary = isStaffAdmin
      ? `Successfully saved marks for all subjects across ${savedResults.length} students`
      : `Successfully saved marks for your allocated subjects (${allocatedSubjects.join(', ')}) across ${savedResults.length} students`;

    res.json({
      success: true,
      message: savedSummary,
      count: savedResults.length,
      allocatedSubjects
    });
  } catch (error) {
    console.error('saveBulkMarks error:', error);
    res.status(500).json({ message: 'Error saving marks', error: error.message });
  }
};

// 9. Get Single Student Official Report Card
const getStudentReportCard = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const rawRef = decodeURIComponent(studentId || '').trim();
    const isObjectId = mongoose.Types.ObjectId.isValid(rawRef);

    let student = null;
    let result = null;

    // 1. If valid ObjectId, check if it's Student._id or an ExamResult._id
    if (isObjectId) {
      student = await Student.findById(rawRef);
      if (!student) {
        result = await ExamResult.findById(rawRef);
        if (result) {
          student = await Student.findById(result.student);
        }
      }
    }

    // 2. If student not yet resolved, query by studentId, admissionNo, aadhaar, or mobile
    if (!student) {
      student = await Student.findOne({
        $or: [
          { studentId: rawRef },
          { admissionNo: rawRef },
          { 'personal.aadhaar': rawRef },
          { 'personal.mobile': rawRef }
        ]
      });
    }

    if (!student) return res.status(404).json({ message: 'Student record not found' });

    // 3. Find ExamResult for this exam & student
    if (!result) {
      result = await ExamResult.findOne({
        exam: exam._id,
        $or: [
          { student: student._id },
          { studentId: student.studentId },
          { admissionNo: student.admissionNo },
          { rollNo: student.academic?.rollNo, class: exam.class }
        ]
      });
    }

    if (!result) {
      return res.status(404).json({ message: 'Marks have not been entered or saved yet for this student' });
    }

    const schoolSetting = await SchoolSetting.findOne() || {
      schoolName: 'DULICHAND SONADEVI HIGH SCHOOL',
      address: 'Ranamunduli, Basta, Balasore, Odisha - 756029'
    };

    res.json({
      success: true,
      school: {
        name: schoolSetting.schoolName || 'DULICHAND SONADEVI HIGH SCHOOL',
        address: schoolSetting.address || 'Ranamunduli, Basta, Balasore, Odisha - 756029',
        tagline: '5T High School Transformation Initiative | Govt. of Odisha Recognized',
        board: 'Board of Secondary Education (BSE), Odisha'
      },
      exam: {
        title: exam.title,
        academicSession: exam.academicSession,
        class: exam.class,
        examType: exam.examType,
        startDate: exam.startDate,
        endDate: exam.endDate
      },
      student: {
        id: student._id,
        studentId: student.studentId,
        admissionNo: student.admissionNo,
        name: student.personal?.name,
        dob: student.personal?.dob,
        gender: student.personal?.gender,
        fatherName: student.parents?.fatherName,
        motherName: student.parents?.motherName,
        class: student.academic?.class,
        section: student.academic?.section,
        rollNo: student.academic?.rollNo,
        bloodGroup: student.personal?.bloodGroup,
        photo: student.personal?.photo
      },
      result: {
        subjectMarks: result.subjectMarks,
        totalMarksObtained: result.totalMarksObtained,
        totalMaxMarks: result.totalMaxMarks,
        percentage: result.percentage,
        overallGrade: result.overallGrade,
        status: result.status,
        division: result.division,
        rank: result.rank,
        remarks: result.remarks,
        evaluatedAt: result.updatedAt
      }
    });
  } catch (error) {
    console.error('getStudentReportCard error:', error);
    res.status(500).json({ message: 'Error generating report card', error: error.message });
  }
};

// 10. Student / Parent Portal View: Get All Results for logged in child
const getMyExamResults = async (req, res) => {
  try {
    let studentId = null;

    if (req.student && req.student.id) {
      studentId = req.student.id;
    } else if (req.parent && req.parent.studentIds && req.parent.studentIds.length > 0) {
      studentId = req.query.childId || req.parent.studentIds[0];
    }

    if (!studentId) {
      return res.status(400).json({ message: 'No student reference found in session' });
    }

    const query = {
      $or: [
        { student: studentId }
      ]
    };
    if (req.student?.studentId) {
      query.$or.push({ studentId: req.student.studentId });
    }

    const results = await ExamResult.find(query)
      .populate('exam', 'title academicSession class examType status startDate endDate')
      .sort({ createdAt: -1 });

    // Include all results where exam exists
    const validResults = results.filter((r) => r.exam);

    res.json({
      success: true,
      results: validResults
    });
  } catch (error) {
    console.error('getMyExamResults error:', error);
    res.status(500).json({ message: 'Error fetching student exam results', error: error.message });
  }
};

// 11. Get all students class-wise (independent of session) with their exam marksheet records
// @route GET /api/exams/class-students
// @access Private (Super Admin, Admin, Faculty)
const getClassWiseStudents = async (req, res) => {
  try {
    const { class: studentClass, section, search } = req.query;
    const query = { status: 'active' };

    if (studentClass && studentClass !== 'all') {
      query['academic.class'] = String(studentClass);
    }
    if (section && section !== 'all') {
      query['academic.section'] = section;
    }
    if (search && search.trim() !== '') {
      const term = escapeRegex(search.trim());
      query.$or = [
        { 'personal.name': { $regex: term, $options: 'i' } },
        { studentId: { $regex: term, $options: 'i' } },
        { admissionNo: { $regex: term, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .select('studentId admissionNo personal.name personal.gender personal.photo academic.class academic.section academic.rollNo academic.sessionName')
      .sort({ 'academic.class': 1, 'academic.rollNo': 1, 'personal.name': 1 });

    const studentIds = students.map((s) => s._id);

    // Fetch all exam results for these students
    const results = await ExamResult.find({ student: { $in: studentIds } })
      .populate('exam', 'title examType academicSession class subjects status')
      .sort({ createdAt: -1 });

    const resultsByStudent = new Map();
    results.forEach((r) => {
      const sId = String(r.student);
      if (!resultsByStudent.has(sId)) {
        resultsByStudent.set(sId, []);
      }
      resultsByStudent.get(sId).push(r);
    });

    const studentsWithResults = students.map((s) => {
      const sResults = resultsByStudent.get(String(s._id)) || [];
      const latestResult = sResults.length > 0 ? sResults[0] : null;

      return {
        _id: s._id,
        studentId: s.studentId,
        admissionNo: s.admissionNo,
        name: s.personal?.name,
        gender: s.personal?.gender,
        photo: s.personal?.photo,
        class: s.academic?.class,
        section: s.academic?.section,
        rollNo: s.academic?.rollNo,
        sessionName: s.academic?.sessionName,
        examCount: sResults.length,
        latestResult: latestResult ? {
          resultId: latestResult._id,
          examId: latestResult.exam?._id,
          examTitle: latestResult.exam?.title,
          examType: latestResult.exam?.examType,
          academicSession: latestResult.exam?.academicSession,
          totalMarksObtained: latestResult.totalMarksObtained,
          totalMaxMarks: latestResult.totalMaxMarks,
          percentage: latestResult.percentage,
          overallGrade: latestResult.overallGrade,
          status: latestResult.status,
          division: latestResult.division,
          rank: latestResult.rank
        } : null,
        results: sResults.map((r) => ({
          _id: r._id,
          examId: r.exam?._id,
          examTitle: r.exam?.title,
          academicSession: r.exam?.academicSession,
          examType: r.exam?.examType,
          totalMarksObtained: r.totalMarksObtained,
          totalMaxMarks: r.totalMaxMarks,
          percentage: r.percentage,
          overallGrade: r.overallGrade,
          status: r.status,
          division: r.division,
          rank: r.rank
        }))
      };
    });

    res.json({
      success: true,
      students: studentsWithResults,
      total: studentsWithResults.length
    });
  } catch (error) {
    console.error('getClassWiseStudents error:', error);
    res.status(500).json({ message: 'Failed to fetch class-wise students', error: error.message });
  }
};

module.exports = {
  getExams,
  createExam,
  getExamById,
  updateExam,
  deleteExam,
  togglePublish,
  getMarksGrid,
  saveBulkMarks,
  getStudentReportCard,
  getMyExamResults,
  getClassWiseStudents
};
