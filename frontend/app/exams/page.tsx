"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  Users,
  X,
  AlertCircle,
  Sparkles
} from "lucide-react";

interface Subject {
  subjectCode: string;
  subjectName: string;
  maxMarks: number;
  passMarks: number;
}

interface Exam {
  _id: string;
  title: string;
  academicSession: string;
  class: string;
  examType: string;
  startDate?: string;
  endDate?: string;
  subjects: Subject[];
  status: "draft" | "published";
  instructions?: string;
  resultCount?: number;
  createdAt: string;
}

interface StudentMarksRow {
  studentObjectId: string;
  studentId: string;
  admissionNo: string;
  name: string;
  rollNo: number;
  section: string;
  subjectMarks: {
    subjectCode: string;
    subjectName: string;
    maxMarks: number;
    passMarks: number;
    marksObtained: number;
    grade: string;
    isAbsent: boolean;
  }[];
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string;
  status: "Pass" | "Fail" | "Compartment" | "Absent";
  division: string;
  rank?: number | null;
  remarks: string;
  isSaved?: boolean;
}

interface ReportCardData {
  school: {
    name: string;
    address: string;
    tagline: string;
    board: string;
  };
  exam: {
    title: string;
    academicSession: string;
    class: string;
    examType: string;
    startDate?: string;
    endDate?: string;
  };
  student: {
    id: string;
    studentId: string;
    admissionNo: string;
    name: string;
    dob?: string;
    gender?: string;
    fatherName?: string;
    motherName?: string;
    class: string;
    section: string;
    rollNo: number;
    bloodGroup?: string;
    photo?: string;
  };
  result: {
    subjectMarks: {
      subjectCode: string;
      subjectName: string;
      maxMarks: number;
      passMarks: number;
      marksObtained: number;
      grade: string;
      isAbsent: boolean;
    }[];
    totalMarksObtained: number;
    totalMaxMarks: number;
    percentage: number;
    overallGrade: string;
    status: string;
    division: string;
    rank?: number;
    remarks: string;
    evaluatedAt: string;
  };
}

const DEFAULT_SUBJECTS: Subject[] = [
  { subjectCode: "FLO", subjectName: "First Language (Odia)", maxMarks: 100, passMarks: 33 },
  { subjectCode: "SLE", subjectName: "Second Language (English)", maxMarks: 100, passMarks: 33 },
  { subjectCode: "MTH", subjectName: "Mathematics", maxMarks: 100, passMarks: 33 },
  { subjectCode: "GSC", subjectName: "General Science", maxMarks: 100, passMarks: 33 },
  { subjectCode: "SSC", subjectName: "Social Science", maxMarks: 100, passMarks: 33 },
  { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", maxMarks: 100, passMarks: 33 }
];

interface ClassStudentResult {
  _id: string;
  examId: string;
  examTitle: string;
  academicSession: string;
  examType: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string;
  status: string;
  division: string;
  rank?: number;
}

interface ClassStudent {
  _id: string;
  studentId: string;
  admissionNo: string;
  name: string;
  gender?: string;
  photo?: string;
  class: string;
  section?: string;
  rollNo?: number;
  sessionName?: string;
  examCount: number;
  latestResult?: {
    resultId?: string;
    examId?: string;
    examTitle?: string;
    examType?: string;
    academicSession?: string;
    totalMarksObtained: number;
    totalMaxMarks: number;
    percentage: number;
    overallGrade: string;
    status: string;
    division: string;
    rank?: number;
  } | null;
  results: ClassStudentResult[];
}

export default function ExamsPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  // Tab State: 'class-students' | 'exams' | 'marks-entry' | 'results'
  const [activeTab, setActiveTab] = useState<"class-students" | "exams" | "marks-entry" | "results">("class-students");

  // Class-wise Students State (Independent of Session)
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [selectedClassTab, setSelectedClassTab] = useState<string>("all");
  const [studentClassSearch, setStudentClassSearch] = useState<string>("");
  const [studentSectionFilter, setStudentSectionFilter] = useState<string>("all");
  const [studentPerfFilter, setStudentPerfFilter] = useState<string>("all");

  // Data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Filters for Exams Directory (default session: 'all' to not hide any exams)
  const [sessionFilter, setSessionFilter] = useState("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Marks Entry Grid State
  const [marksGrid, setMarksGrid] = useState<StudentMarksRow[]>([]);
  const [allocatedSubjects, setAllocatedSubjects] = useState<string[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [gridSearch, setGridSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Create/Edit Exam Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({
    title: "",
    academicSession: "2026-2027",
    class: "10",
    examType: "annual",
    startDate: "",
    endDate: "",
    instructions: "",
    subjects: DEFAULT_SUBJECTS
  });

  // Manual Marks & Pass Marks State for Exam Form
  const [bulkMaxMarks, setBulkMaxMarks] = useState<number>(100);
  const [bulkPassMarks, setBulkPassMarks] = useState<number>(33);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectMax, setNewSubjectMax] = useState<number>(100);
  const [newSubjectPass, setNewSubjectPass] = useState<number>(33);

  const handleSubjectMarkChange = (index: number, field: "maxMarks" | "passMarks", value: number) => {
    setExamForm((prev) => {
      const updated = [...prev.subjects];
      updated[index] = { ...updated[index], [field]: isNaN(value) ? 0 : value };
      return { ...prev, subjects: updated };
    });
  };

  const handleApplyBulkMarks = () => {
    setExamForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((sub) => ({
        ...sub,
        maxMarks: bulkMaxMarks || 100,
        passMarks: bulkPassMarks || 33,
      }))
    }));
  };

  const handleRemoveSubject = (index: number) => {
    setExamForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, idx) => idx !== index)
    }));
  };

  const handleAddCustomSubject = () => {
    if (!newSubjectName.trim()) return;
    const code = newSubjectCode.trim() || newSubjectName.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
    const newSub: Subject = {
      subjectName: newSubjectName.trim(),
      subjectCode: code,
      maxMarks: newSubjectMax || 100,
      passMarks: newSubjectPass || 33
    };
    setExamForm((prev) => ({
      ...prev,
      subjects: [...prev.subjects, newSub]
    }));
    setNewSubjectName("");
    setNewSubjectCode("");
    setNewSubjectMax(100);
    setNewSubjectPass(33);
    setIsAddingSubject(false);
  };

  // Report Card Modal State
  const [reportCardData, setReportCardData] = useState<ReportCardData | null>(null);
  const [reportCardLoading, setReportCardLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Check if subject is allocated to current user (admin gets all)
  const isSubjectAllocated = (subjectName: string) => {
    if (isAdmin) return true;
    return allocatedSubjects.includes(subjectName);
  };

  // Fetch Class-Wise Students (Independent of session)
  const fetchClassStudents = async () => {
    try {
      setLoadingClassStudents(true);
      const params = new URLSearchParams();
      if (selectedClassTab !== "all") params.append("class", selectedClassTab);
      if (studentSectionFilter !== "all") params.append("section", studentSectionFilter);
      if (studentClassSearch) params.append("search", studentClassSearch);

      const res = await fetch(`${API_BASE_URL}/exams/class-students?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClassStudents(data.students || []);
      }
    } catch (err) {
      console.error("Error fetching class students:", err);
    } finally {
      setLoadingClassStudents(false);
    }
  };

  useEffect(() => {
    if (token) fetchClassStudents();
  }, [token, selectedClassTab, studentSectionFilter, studentClassSearch]);

  // Fetch Exams
  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (sessionFilter && sessionFilter !== "all") params.append("academicSession", sessionFilter);
      if (classFilter !== "all") params.append("class", classFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${API_BASE_URL}/exams?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchExams();
  }, [token, sessionFilter, classFilter, statusFilter]);

  // Load Marks Entry Grid for an Exam
  const loadMarksGrid = async (exam: Exam) => {
    setSelectedExam(exam);
    setActiveTab("marks-entry");
    try {
      setGridLoading(true);
      const res = await fetch(`${API_BASE_URL}/exams/${exam._id}/marks-grid`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMarksGrid(data.grid || []);
        setAllocatedSubjects(data.allocatedSubjects || []);
      }
    } catch (err) {
      console.error("Error loading marks grid:", err);
    } finally {
      setGridLoading(false);
    }
  };

  // Open Results View for an Exam
  const openResultsView = async (exam: Exam) => {
    setSelectedExam(exam);
    setActiveTab("results");
    try {
      setGridLoading(true);
      const res = await fetch(`${API_BASE_URL}/exams/${exam._id}/marks-grid`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMarksGrid(data.grid || []);
        setAllocatedSubjects(data.allocatedSubjects || []);
      }
    } catch (err) {
      console.error("Error loading results:", err);
    } finally {
      setGridLoading(false);
    }
  };

  // Handle Mark Change in the Grid (Restricted to allocated subjects for faculty)
  const handleMarkChange = (studentIdx: number, subjectIdx: number, value: string) => {
    const targetSubCheck = marksGrid[studentIdx]?.subjectMarks[subjectIdx];
    if (!isAdmin && targetSubCheck && !isSubjectAllocated(targetSubCheck.subjectName)) {
      return;
    }

    const numVal = value === "" ? 0 : Math.max(0, Number(value));
    setMarksGrid((prev) => {
      const updated = [...prev];
      const row = { ...updated[studentIdx] };
      const subMarks = [...row.subjectMarks];
      const targetSub = { ...subMarks[subjectIdx] };

      targetSub.marksObtained = Math.min(numVal, targetSub.maxMarks);

      // Re-calc grade
      const pct = (targetSub.marksObtained / targetSub.maxMarks) * 100;
      if (targetSub.isAbsent) {
        targetSub.grade = "AB";
      } else if (targetSub.marksObtained < targetSub.passMarks) {
        targetSub.grade = "F";
      } else if (pct >= 90) targetSub.grade = "A1";
      else if (pct >= 80) targetSub.grade = "A2";
      else if (pct >= 70) targetSub.grade = "B1";
      else if (pct >= 60) targetSub.grade = "B2";
      else if (pct >= 50) targetSub.grade = "C1";
      else if (pct >= 40) targetSub.grade = "C2";
      else if (pct >= 33) targetSub.grade = "D";
      else targetSub.grade = "F";

      subMarks[subjectIdx] = targetSub;
      row.subjectMarks = subMarks;

      // Re-calc row total & percentage
      let total = 0;
      let failedSubs = 0;
      let allAbsent = true;

      subMarks.forEach((sm) => {
        if (!sm.isAbsent) {
          allAbsent = false;
          total += sm.marksObtained;
          if (sm.marksObtained < sm.passMarks) failedSubs++;
        }
      });

      row.totalMarksObtained = total;
      row.percentage = row.totalMaxMarks > 0 ? Number(((total / row.totalMaxMarks) * 100).toFixed(2)) : 0;

      if (allAbsent) {
        row.status = "Absent";
        row.overallGrade = "F";
        row.division = "Failed";
      } else if (failedSubs === 1) {
        row.status = "Compartment";
        row.overallGrade = "F";
        row.division = "Compartment";
      } else if (failedSubs > 1) {
        row.status = "Fail";
        row.overallGrade = "F";
        row.division = "Failed";
      } else {
        row.status = "Pass";
        const p = row.percentage;
        if (p >= 90) row.overallGrade = "A1";
        else if (p >= 80) row.overallGrade = "A2";
        else if (p >= 70) row.overallGrade = "B1";
        else if (p >= 60) row.overallGrade = "B2";
        else if (p >= 50) row.overallGrade = "C1";
        else if (p >= 40) row.overallGrade = "C2";
        else if (p >= 33) row.overallGrade = "D";
        else row.overallGrade = "F";

        if (p >= 75) row.division = "Distinction";
        else if (p >= 60) row.division = "1st Division";
        else if (p >= 45) row.division = "2nd Division";
        else if (p >= 33) row.division = "3rd Division";
        else row.division = "Failed";
      }

      updated[studentIdx] = row;
      return updated;
    });
  };

  // Toggle Absent checkbox (Restricted to allocated subjects for faculty)
  const handleAbsentToggle = (studentIdx: number, subjectIdx: number) => {
    const targetSubCheck = marksGrid[studentIdx]?.subjectMarks[subjectIdx];
    if (!isAdmin && targetSubCheck && !isSubjectAllocated(targetSubCheck.subjectName)) {
      return;
    }

    setMarksGrid((prev) => {
      const updated = [...prev];
      const row = { ...updated[studentIdx] };
      const subMarks = [...row.subjectMarks];
      const targetSub = { ...subMarks[subjectIdx] };

      targetSub.isAbsent = !targetSub.isAbsent;
      if (targetSub.isAbsent) {
        targetSub.marksObtained = 0;
        targetSub.grade = "AB";
      } else {
        targetSub.grade = targetSub.marksObtained >= targetSub.passMarks ? "D" : "F";
      }

      subMarks[subjectIdx] = targetSub;
      row.subjectMarks = subMarks;
      updated[studentIdx] = row;
      return updated;
    });
  };

  // Save All Marks
  const handleSaveMarks = async () => {
    if (!selectedExam) return;
    if (!isAdmin && allocatedSubjects.length === 0) {
      alert(`You do not have any allocated subjects for Class ${selectedExam.class}. Contact your administrator to allocate your subjects in the Timetable.`);
      return;
    }
    try {
      setSavingMarks(true);
      const res = await fetch(`${API_BASE_URL}/exams/${selectedExam._id}/marks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ results: marksGrid })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(`Marks successfully saved for ${data.count} students!`);
        setTimeout(() => setSaveSuccessMsg(""), 4000);
        // Reload fresh grid
        loadMarksGrid(selectedExam);
        fetchExams();
      } else {
        alert(data.message || "Failed to save marks");
      }
    } catch (err) {
      console.error("Save marks error:", err);
      alert("Failed to connect to server");
    } finally {
      setSavingMarks(false);
    }
  };

  // Toggle Exam Publish
  const handleTogglePublish = async (examId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/exams/${examId}/publish`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Exam
  const handleDeleteExam = async (examId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete exam "${title}" and all its marks records?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/exams/${examId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchExams();
        if (selectedExam?._id === examId) {
          setSelectedExam(null);
          setActiveTab("exams");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Modal to Edit existing exam configuration & marks
  const handleOpenEditExam = (exam: Exam) => {
    setEditingExamId(exam._id);
    setExamForm({
      title: exam.title || "",
      academicSession: exam.academicSession || "2026-2027",
      class: exam.class || "10",
      examType: exam.examType || "annual",
      startDate: exam.startDate ? exam.startDate.split("T")[0] : "",
      endDate: exam.endDate ? exam.endDate.split("T")[0] : "",
      instructions: exam.instructions || "",
      subjects: exam.subjects && exam.subjects.length > 0 ? exam.subjects : DEFAULT_SUBJECTS
    });
    setIsModalOpen(true);
  };

  // Handle Create or Update Exam Form Submit
  const handleSaveExamForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingExamId ? `${API_BASE_URL}/exams/${editingExamId}` : `${API_BASE_URL}/exams`;
      const method = editingExamId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(examForm)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setEditingExamId(null);
        fetchExams();
      } else {
        alert(data.message || "Failed to save exam");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // Open Single Student Report Card
  const openReportCard = async (examId: string, studentId: string) => {
    try {
      setReportCardLoading(true);
      setIsReportModalOpen(true);
      const res = await fetch(`${API_BASE_URL}/exams/${examId}/report-card/${studentId}`);
      const data = await res.json();
      if (data.success) {
        setReportCardData(data);
      } else {
        alert(data.message || "Could not retrieve report card");
        setIsReportModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load report card");
      setIsReportModalOpen(false);
    } finally {
      setReportCardLoading(false);
    }
  };

  // Export Results as CSV
  const handleExportResultsCSV = () => {
    if (!selectedExam || marksGrid.length === 0) return;

    const headers = [
      "Roll No",
      "Student ID",
      "Admission No",
      "Student Name",
      "Section",
      ...selectedExam.subjects.map((s) => `${s.subjectName} (${s.maxMarks})`),
      "Total Marks",
      "Total Max",
      "Percentage",
      "Grade",
      "Result",
      "Division",
      "Remarks"
    ];

    const rows = marksGrid.map((row) => [
      row.rollNo || "",
      row.studentId || "",
      row.admissionNo || "",
      `"${row.name}"`,
      row.section || "",
      ...row.subjectMarks.map((sm) => (sm.isAbsent ? "AB" : sm.marksObtained)),
      row.totalMarksObtained,
      row.totalMaxMarks,
      `${row.percentage}%`,
      row.overallGrade,
      row.status,
      row.division,
      `"${row.remarks || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Class_${selectedExam.class}_${selectedExam.title.replace(/\s+/g, "_")}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered marks grid for search and section
  const filteredGrid = useMemo(() => {
    return marksGrid.filter((row) => {
      const matchSearch =
        row.name.toLowerCase().includes(gridSearch.toLowerCase()) ||
        row.studentId.toLowerCase().includes(gridSearch.toLowerCase()) ||
        String(row.rollNo).includes(gridSearch);
      const matchSection = sectionFilter === "all" || row.section === sectionFilter;
      return matchSearch && matchSection;
    });
  }, [marksGrid, gridSearch, sectionFilter]);

  // Filtered class students for performance and roster
  const filteredClassStudents = useMemo(() => {
    return classStudents.filter((st) => {
      if (studentPerfFilter === "evaluated" && (!st.results || st.results.length === 0)) return false;
      if (studentPerfFilter === "pending" && st.results && st.results.length > 0) return false;
      if (studentPerfFilter === "passed" && (!st.latestResult || st.latestResult.status !== "Pass")) return false;
      if (studentPerfFilter === "failed" && (!st.latestResult || (st.latestResult.status !== "Fail" && st.latestResult.status !== "Compartment"))) return false;
      return true;
    });
  }, [classStudents, studentPerfFilter]);

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "faculty"]}>
      <DashboardLayout>
        {/* Print Styles: strictly format marksheet on ONE single A4 page */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 4mm 6mm;
            }
            html, body {
              height: 100% !important;
              max-height: 100vh !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-report-card,
            #printable-report-card * {
              visibility: visible !important;
            }
            #printable-report-card {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              max-height: 285mm !important;
              margin: 0 !important;
              padding: 8px 12px !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: 2px solid #0f172a !important;
              border-radius: 6px !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
              z-index: 9999999 !important;
            }
            .print-hidden, .print\\:hidden, button {
              display: none !important;
            }
          }
        `}</style>
        <div className="space-y-6 exams-dashboard-content">
          {/* Top Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-7 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                    Academic Evaluations
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200">
                    BSE Odisha Aligned
                  </span>
                </div>
                <h1 className="text-3xl font-black tracking-tight">Examinations & Marksheets</h1>
                <p className="text-slate-300 mt-1 text-sm max-w-xl">
                  Exam schedule management, subject marks entry, automatic grade and division calculations, and official printable report cards.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingExamId(null);
                      setExamForm({
                        title: "",
                        academicSession: "2025-2026",
                        class: "10",
                        examType: "annual",
                        startDate: "",
                        endDate: "",
                        instructions: "",
                        subjects: DEFAULT_SUBJECTS
                      });
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Exam
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-white rounded-2xl p-2 shadow-sm gap-2 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab("class-students");
                fetchClassStudents();
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "class-students"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users className="w-4 h-4" />
              Class-wise Students & Marksheets ({classStudents.length})
            </button>

            <button
              onClick={() => setActiveTab("exams")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "exams"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-4 h-4" />
              All Examinations ({exams.length})
            </button>

            <button
              disabled={!selectedExam}
              onClick={() => setActiveTab("marks-entry")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "marks-entry"
                  ? "bg-blue-600 text-white shadow"
                  : selectedExam
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Marks Entry {selectedExam ? `(${selectedExam.title})` : ""}
            </button>

            <button
              disabled={!selectedExam}
              onClick={() => setActiveTab("results")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "results"
                  ? "bg-emerald-600 text-white shadow"
                  : selectedExam
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              <Award className="w-4 h-4" />
              Merit List & Report Cards {selectedExam ? `(Class ${selectedExam.class})` : ""}
            </button>
          </div>

          {/* TAB 0: CLASS-WISE STUDENTS & MARKSHEETS */}
          {activeTab === "class-students" && (
            <div className="space-y-6">
              {/* Class Selection Pills / Quick Switcher */}
              <div className="card p-5 border border-slate-200 bg-white space-y-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      Class-wise Student Directory & Academic Marksheets
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      View all registered students organized by Class cohort (Class 8, Class 9, Class 10) independent of admission session.
                    </p>
                  </div>

                  {/* Class Switcher Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
                    {[
                      { id: "all", label: "All Classes" },
                      { id: "8", label: "Class 8" },
                      { id: "9", label: "Class 9" },
                      { id: "10", label: "Class 10" },
                    ].map((cls) => {
                      const count = cls.id === "all" 
                        ? classStudents.length 
                        : classStudents.filter((s) => s.class === cls.id).length;
                      return (
                        <button
                          key={cls.id}
                          onClick={() => setSelectedClassTab(cls.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                            selectedClassTab === cls.id
                              ? "bg-white text-blue-700 shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <span>{cls.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                              selectedClassTab === cls.id ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student by name, roll, or admission no..."
                        value={studentClassSearch}
                        onChange={(e) => setStudentClassSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                      />
                    </div>

                    <select
                      value={studentSectionFilter}
                      onChange={(e) => setStudentSectionFilter(e.target.value)}
                      className="text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none"
                    >
                      <option value="all">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>

                    <select
                      value={studentPerfFilter}
                      onChange={(e) => setStudentPerfFilter(e.target.value)}
                      className="text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none"
                    >
                      <option value="all">All Evaluation Statuses</option>
                      <option value="evaluated">Evaluated (Has Exam Marks)</option>
                      <option value="pending">Pending Evaluation</option>
                      <option value="passed">Passed Students</option>
                      <option value="failed">Failed / Compartment</option>
                    </select>
                  </div>

                  <button
                    onClick={fetchClassStudents}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Roster
                  </button>
                </div>
              </div>

              {/* Class Students Table */}
              {loadingClassStudents ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
              ) : filteredClassStudents.length === 0 ? (
                <div className="card p-12 text-center border border-dashed border-slate-300 bg-white">
                  <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <h4 className="font-bold text-slate-700">No students found</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    No active students match the selected class and filter criteria.
                  </p>
                </div>
              ) : (
                <div className="card overflow-hidden border border-slate-200 shadow-sm bg-white">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[780px]">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold tracking-wider uppercase border-b border-slate-800 text-[11px]">
                          <th className="py-3 px-4 w-16">Roll</th>
                          <th className="py-3 px-4">Student Profile & Identity</th>
                          <th className="py-3 px-4">Class & Sec</th>
                          <th className="py-3 px-4">Enrolled Session</th>
                          <th className="py-3 px-4">Examinations & Marksheet Summary</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredClassStudents.map((st) => (
                          <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                              {st.rollNo ? String(st.rollNo).padStart(2, "0") : "-"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                  {st.name?.slice(0, 2) || "ST"}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-slate-900">{st.name}</p>
                                  <p className="text-[11px] text-slate-500">
                                    Adm: <span className="font-mono font-semibold text-slate-800">{st.admissionNo}</span> • ID: <span className="font-mono text-slate-600">{st.studentId}</span>
                                    {st.gender && (
                                      <span className="capitalize ml-1.5 px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600 font-medium">
                                        {st.gender}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs">
                                Class {st.class} {st.section ? `(${st.section})` : ""}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                {st.sessionName || "2026-2027"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {st.results && st.results.length > 0 ? (
                                <div className="space-y-1.5">
                                  {st.results.map((res) => (
                                    <div
                                      key={res._id}
                                      className="inline-flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs mr-2 mb-1"
                                    >
                                      <span className="font-bold text-slate-900">{res.examTitle}</span>
                                      <span className="font-semibold text-slate-700">
                                        {res.totalMarksObtained} / {res.totalMaxMarks} ({res.percentage}%)
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded font-black text-[10px] uppercase ${
                                          res.status === "Pass"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-rose-100 text-rose-800"
                                        }`}
                                      >
                                        {res.status} ({res.overallGrade})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  Pending Evaluation
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {st.results && st.results.length > 0 ? (
                                  <button
                                    onClick={() => openReportCard(st.results[0].examId, st._id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors shadow-sm"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    View Marksheet
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const matchingExam = exams.find((e) => e.class === st.class);
                                      if (matchingExam) {
                                        loadMarksGrid(matchingExam);
                                      } else {
                                        setEditingExamId(null);
                                        setExamForm({
                                          title: `Class ${st.class} Annual Examination`,
                                          academicSession: st.sessionName || "2026-2027",
                                          class: st.class,
                                          examType: "annual",
                                          startDate: "",
                                          endDate: "",
                                          instructions: "",
                                          subjects: DEFAULT_SUBJECTS
                                        });
                                        setIsModalOpen(true);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    Enter Marks
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View for Class Students */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {filteredClassStudents.map((st) => (
                      <div key={st._id} className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm shrink-0">
                              {st.rollNo ? `#${st.rollNo}` : (st.name?.slice(0, 2) || "ST")}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900">{st.name}</p>
                              <p className="text-[11px] text-slate-500">
                                Cl {st.class}{st.section ? `-${st.section}` : ""} • Adm: <span className="font-mono font-semibold">{st.admissionNo}</span>
                              </p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-[10px] shrink-0 border border-blue-200">
                            Class {st.class}
                          </span>
                        </div>

                        {/* Examination Evaluation Status */}
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          {st.results && st.results.length > 0 ? (
                            <div className="space-y-1">
                              {st.results.map((res) => (
                                <div key={res._id} className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800 truncate max-w-[150px]">{res.examTitle}</span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-bold text-slate-700 text-[11px]">
                                      {res.totalMarksObtained}/{res.totalMaxMarks} ({res.percentage}%)
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase ${
                                        res.status === "Pass"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-rose-100 text-rose-800"
                                      }`}
                                    >
                                      {res.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Evaluation Pending
                            </span>
                          )}
                        </div>

                        {/* Action Touch Button */}
                        <div>
                          {st.results && st.results.length > 0 ? (
                            <button
                              onClick={() => openReportCard(st.results[0].examId, st._id)}
                              className="w-full py-2 px-3 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View & Print Marksheet (A4)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const matchingExam = exams.find((e) => e.class === st.class);
                                if (matchingExam) {
                                  loadMarksGrid(matchingExam);
                                } else {
                                  setEditingExamId(null);
                                  setExamForm({
                                    title: `Class ${st.class} Annual Examination`,
                                    academicSession: st.sessionName || "2026-2027",
                                    class: st.class,
                                    examType: "annual",
                                    startDate: "",
                                    endDate: "",
                                    instructions: "",
                                    subjects: DEFAULT_SUBJECTS
                                  });
                                  setIsModalOpen(true);
                                }
                              }}
                              className="w-full py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Enter Subject Marks</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: ALL EXAMINATIONS */}
          {activeTab === "exams" && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="card p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold uppercase text-slate-500">Filter By:</span>
                  </div>

                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
                  >
                    <option value="all">All Classes (8, 9, 10)</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                  </select>

                  <select
                    value={sessionFilter}
                    onChange={(e) => setSessionFilter(e.target.value)}
                    className="text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Academic Sessions</option>
                    <option value="2026-2027">Session: 2026-2027</option>
                    <option value="2025-2026">Session: 2025-2026</option>
                    <option value="2024-2025">Session: 2024-2025</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <button
                  onClick={fetchExams}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {/* Exams Cards Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
              ) : exams.length === 0 ? (
                <div className="card p-12 text-center border border-dashed border-slate-300">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No Examinations Found</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    No exams have been created for the selected filter criteria yet. Click "Create New Exam" above to add one.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.map((exam) => {
                    const isPublished = exam.status === "published";
                    const totalMaxMarks = exam.subjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0);

                    return (
                      <div
                        key={exam._id}
                        className="card p-6 border border-slate-100 hover:shadow-xl transition-all flex flex-col justify-between group"
                      >
                        <div>
                          {/* Header badges */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
                              Class {exam.class}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                isPublished
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isPublished ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              />
                              {exam.status}
                            </span>
                          </div>

                          <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {exam.title}
                          </h3>

                          <div className="mt-4 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-400 font-semibold">Session</span>
                              <span className="font-bold text-slate-700">{exam.academicSession}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-400 font-semibold">Exam Type</span>
                              <span className="font-bold text-slate-700 uppercase">{exam.examType.replace("_", " ")}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-400 font-semibold">Subjects</span>
                              <span className="font-bold text-slate-700">{exam.subjects.length} Subjects ({totalMaxMarks} Marks)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-semibold">Evaluated</span>
                              <span className="font-bold text-emerald-600">
                                {exam.resultCount || 0} Students Marked
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => loadMarksGrid(exam)}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Enter Marks
                            </button>
                            <button
                              onClick={() => openResultsView(exam)}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors"
                            >
                              <Award className="w-3.5 h-3.5" />
                              View Results
                            </button>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-2">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleOpenEditExam(exam)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                                  title="Edit examination details, manual subject marks, and pass marks"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit Marks & Config
                                </button>
                                <span className="text-slate-200">|</span>
                                <button
                                  onClick={() => handleTogglePublish(exam._id)}
                                  className={`text-xs font-bold flex items-center gap-1 ${
                                    isPublished ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {isPublished ? "Set to Draft" : "Publish"}
                                </button>
                              </div>

                              <button
                                onClick={() => handleDeleteExam(exam._id, exam.title)}
                                className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MARKS ENTRY GRID */}
          {activeTab === "marks-entry" && selectedExam && (
            <div className="space-y-6">
              {/* Exam Context Banner */}
              <div className="card p-5 border border-blue-200 bg-blue-50/50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white">
                      Class {selectedExam.class}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{selectedExam.academicSession}</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{selectedExam.title} - Marks Evaluation</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isAdmin
                      ? "Admin Mode: You have full access to evaluate and update student scores across all subjects."
                      : "Faculty Mode: You can enter scores for your allocated subjects. Other subject marks remain preserved."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveMarks}
                    disabled={savingMarks || (!isAdmin && allocatedSubjects.length === 0)}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg transition-all disabled:opacity-50"
                  >
                    {savingMarks ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {isAdmin
                      ? `Save All Marks (${marksGrid.length})`
                      : allocatedSubjects.length > 0
                      ? `Save Marks (${allocatedSubjects.join(", ")})`
                      : "No Subjects Allocated"}
                  </button>
                </div>
              </div>

              {/* Faculty Subject Allocation Indicator Banner */}
              {!isAdmin && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    allocatedSubjects.length > 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                      : "bg-amber-50 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl text-white font-bold shrink-0 ${
                        allocatedSubjects.length > 0 ? "bg-emerald-600" : "bg-amber-600"
                      }`}
                    >
                      {allocatedSubjects.length > 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block">Faculty Allocated Subject Access</span>
                      <p className="text-slate-600 mt-0.5">
                        {allocatedSubjects.length > 0 ? (
                          <>
                            You have permission to fill marks for your allocated subject(s):{" "}
                            <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                              {allocatedSubjects.join(", ")}
                            </span>
                            . Other subject columns are locked to protect marks entered by other teachers.
                          </>
                        ) : (
                          <span className="text-amber-800 font-semibold">
                            No subjects for Class {selectedExam.class} are currently allocated to your account ({user?.name}). Please ask the administrator to assign subjects in Timetable or Faculty manager.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {saveSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  {saveSuccessMsg}
                </div>
              )}

              {/* Grid Search & Section Controls */}
              <div className="card p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student by name, roll, or ID..."
                      value={gridSearch}
                      onChange={(e) => setGridSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
                    />
                  </div>

                  <select
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value)}
                    className="text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50"
                  >
                    <option value="all">All Sections</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  Showing {filteredGrid.length} of {marksGrid.length} Students
                </div>
              </div>

              {/* Evaluation Spreadsheet Table */}
              {gridLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
              ) : filteredGrid.length === 0 ? (
                <div className="card p-12 text-center border border-dashed border-slate-300">
                  <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <h4 className="font-bold text-slate-700">No active students found for Class {selectedExam.class}</h4>
                  <p className="text-xs text-slate-500 mt-1">Make sure active students are registered in this class.</p>
                </div>
              ) : (
                <div className="card overflow-hidden border border-slate-200 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold tracking-wider uppercase border-b border-slate-800">
                          <th className="py-3 px-3 w-14">Roll</th>
                          <th className="py-3 px-3 w-48">Student Name</th>
                          <th className="py-3 px-3 w-16">Sec</th>
                          {selectedExam.subjects.map((sub, i) => {
                            const isAllocated = isSubjectAllocated(sub.subjectName);
                            return (
                              <th
                                key={i}
                                className={`py-3 px-3 text-center min-w-[120px] transition-colors ${
                                  !isAdmin && isAllocated
                                    ? "bg-emerald-950 text-emerald-100 border-x-2 border-emerald-400"
                                    : !isAdmin && !isAllocated
                                    ? "bg-slate-900/80 text-slate-400 opacity-80"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {!isAdmin && isAllocated && <span className="text-emerald-300 text-[11px]">✨</span>}
                                  {!isAdmin && !isAllocated && <span className="text-slate-400 text-[11px]">🔒</span>}
                                  <span>{sub.subjectName}</span>
                                </div>
                                <div className="text-[10px] lowercase font-normal flex items-center justify-center gap-1.5 mt-0.5 text-slate-300">
                                  <span>max {sub.maxMarks} / pass {sub.passMarks}</span>
                                </div>
                                {!isAdmin && (
                                  <div className="mt-1">
                                    {isAllocated ? (
                                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-emerald-500 text-white tracking-wider">
                                        Your Subject
                                      </span>
                                    ) : (
                                      <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-700 text-slate-300 tracking-wider">
                                        Locked
                                      </span>
                                    )}
                                  </div>
                                )}
                              </th>
                            );
                          })}
                          <th className="py-3 px-3 text-center w-20">Total</th>
                          <th className="py-3 px-3 text-center w-16">Pct %</th>
                          <th className="py-3 px-3 text-center w-16">Grade</th>
                          <th className="py-3 px-3 text-center w-24">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {filteredGrid.map((row, sIdx) => {
                          const originalIdx = marksGrid.findIndex((m) => m.studentObjectId === row.studentObjectId);

                          return (
                            <tr key={row.studentObjectId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-extrabold text-slate-800">
                                {row.rollNo || "-"}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 text-sm">{row.name}</div>
                                <div className="text-[10px] text-slate-400">{row.studentId}</div>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-600">
                                {row.section}
                              </td>

                              {/* Subject Mark Inputs */}
                              {row.subjectMarks.map((sm, subIdx) => {
                                const isAllocated = isSubjectAllocated(sm.subjectName);
                                const isEditable = isAdmin || isAllocated;

                                return (
                                  <td
                                    key={subIdx}
                                    className={`py-2 px-2 text-center transition-colors ${
                                      !isAdmin && isAllocated
                                        ? "bg-emerald-50/50 border-x border-emerald-200"
                                        : !isAdmin && !isAllocated
                                        ? "bg-slate-50/60"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="relative">
                                        <input
                                          type="number"
                                          disabled={!isEditable || sm.isAbsent}
                                          value={sm.isAbsent ? "" : sm.marksObtained}
                                          onChange={(e) => handleMarkChange(originalIdx, subIdx, e.target.value)}
                                          placeholder={sm.isAbsent ? "ABS" : "0"}
                                          min={0}
                                          max={sm.maxMarks}
                                          title={!isEditable ? `Locked: ${sm.subjectName} is not allocated to you` : undefined}
                                          className={`w-16 py-1.5 px-2 text-center rounded-lg border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                                            !isEditable
                                              ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none opacity-80"
                                              : sm.isAbsent
                                              ? "bg-slate-100 text-slate-400 border-slate-200"
                                              : sm.marksObtained < sm.passMarks
                                              ? "bg-red-50 text-red-700 border-red-300 focus:ring-red-400"
                                              : "bg-white text-slate-900 border-slate-200 focus:ring-blue-500 shadow-sm"
                                          }`}
                                        />
                                        {!isEditable && (
                                          <span
                                            className="absolute -top-1.5 -right-1.5 text-[9px] bg-slate-200 rounded-full px-1 border border-slate-300 text-slate-600 select-none"
                                            title="Locked"
                                          >
                                            🔒
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px]">
                                        <label
                                          className={`flex items-center gap-1 text-slate-400 ${
                                            !isEditable ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            disabled={!isEditable}
                                            checked={sm.isAbsent}
                                            onChange={() => handleAbsentToggle(originalIdx, subIdx)}
                                            className="rounded text-red-500 focus:ring-0 w-3 h-3 disabled:cursor-not-allowed"
                                          />
                                          <span>Ab</span>
                                        </label>
                                        <span
                                          className={`font-black px-1 rounded ${
                                            sm.grade === "A1" || sm.grade === "A2"
                                              ? "text-emerald-700 bg-emerald-100"
                                              : sm.grade === "F" || sm.grade === "AB"
                                              ? "text-red-700 bg-red-100"
                                              : "text-blue-700 bg-blue-100"
                                          }`}
                                        >
                                          {sm.grade}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Live Computed Summary */}
                              <td className="py-3 px-3 text-center font-extrabold text-slate-900 text-sm">
                                {row.totalMarksObtained} <span className="text-[10px] text-slate-400 font-normal">/{row.totalMaxMarks}</span>
                              </td>
                              <td className="py-3 px-3 text-center font-black text-slate-800">
                                {row.percentage}%
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                    row.overallGrade.startsWith("A")
                                      ? "bg-emerald-100 text-emerald-800"
                                      : row.overallGrade.startsWith("B")
                                      ? "bg-blue-100 text-blue-800"
                                      : row.overallGrade === "F"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {row.overallGrade}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    row.status === "Pass"
                                      ? "bg-emerald-600 text-white"
                                      : row.status === "Compartment"
                                      ? "bg-amber-500 text-white"
                                      : "bg-red-600 text-white"
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESULTS MERIT LIST & REPORT CARDS */}
          {activeTab === "results" && selectedExam && (
            <div className="space-y-6">
              {/* Actions Header */}
              <div className="card p-5 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Class {selectedExam.class} Merit List & Marksheets
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedExam.title} ({selectedExam.academicSession}) • Evaluated Roster
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportResultsCSV}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    Export CSV Marksheet
                  </button>

                  <button
                    onClick={() => loadMarksGrid(selectedExam)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Modify Marks
                  </button>
                </div>
              </div>

              {/* Merit Ranking Table */}
              <div className="card overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[780px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                        <th className="py-3 px-3 w-16 text-center">Rank</th>
                        <th className="py-3 px-3 w-16">Roll</th>
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3">Student ID</th>
                        <th className="py-3 px-3 text-center">Marks Secured</th>
                        <th className="py-3 px-3 text-center">Percentage</th>
                        <th className="py-3 px-3 text-center">Grade</th>
                        <th className="py-3 px-3 text-center">Division</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Report Card</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {marksGrid
                        .slice()
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((row, idx) => (
                          <tr key={row.studentObjectId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-center">
                              {idx === 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow">
                                  1
                                </span>
                              ) : idx === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow">
                                  2
                                </span>
                              ) : idx === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs shadow">
                                  3
                                </span>
                              ) : (
                                <span className="text-slate-500 font-bold">#{idx + 1}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-slate-800">{row.rollNo || "-"}</td>
                            <td className="py-3 px-3 font-black text-slate-900 text-sm">{row.name}</td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{row.studentId}</td>
                            <td className="py-3 px-3 text-center font-extrabold text-slate-900">
                              {row.totalMarksObtained} <span className="text-slate-400 font-normal">/{row.totalMaxMarks}</span>
                            </td>
                            <td className="py-3 px-3 text-center font-black text-slate-900 text-sm">
                              {row.percentage}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                                {row.overallGrade}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-slate-700">{row.division}</td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  row.status === "Pass"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : row.status === "Compartment"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => openReportCard(selectedExam._id, row.studentObjectId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Report Card
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CREATE / EDIT EXAM MODAL */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {editingExamId ? "Edit Examination" : "Create New Examination"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure exam metadata and subject outlines for student evaluations.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveExamForm} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                      Exam Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Annual Examination 2025-26, Half-Yearly Exam"
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                        Academic Session *
                      </label>
                      <select
                        value={examForm.academicSession}
                        onChange={(e) => setExamForm({ ...examForm, academicSession: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                        <option value="2024-2025">2024-2025</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                        Class *
                      </label>
                      <select
                        value={examForm.class}
                        onChange={(e) => setExamForm({ ...examForm, class: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="8">Class 8</option>
                        <option value="9">Class 9</option>
                        <option value="10">Class 10</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                        Exam Type
                      </label>
                      <select
                        value={examForm.examType}
                        onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="annual">Annual Examination</option>
                        <option value="half_yearly">Half-Yearly Exam</option>
                        <option value="unit_test">Unit Test</option>
                        <option value="pre_board">Pre-Board</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={examForm.startDate}
                        onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={examForm.endDate}
                        onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="block text-slate-700 uppercase tracking-wider font-bold">
                        Subject Marks & Pass Marks ({examForm.subjects.length} Subjects)
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                          Total Marks: {examForm.subjects.reduce((sum, s) => sum + (Number(s.maxMarks) || 0), 0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExamForm((prev) => ({ ...prev, subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)) }))}
                          className="text-[10px] font-bold text-slate-500 hover:text-blue-600 underline"
                        >
                          Reset Defaults
                        </button>
                      </div>
                    </div>

                    {/* Quick Bulk Setter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-xl mb-2.5">
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Quick Apply to All Subjects:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-600 font-bold">Full:</span>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={bulkMaxMarks}
                            onChange={(e) => setBulkMaxMarks(Number(e.target.value))}
                            className="w-14 px-1.5 py-1 rounded-lg border border-blue-300 font-black text-center text-xs bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-600 font-bold">Pass:</span>
                          <input
                            type="number"
                            min="1"
                            max={bulkMaxMarks}
                            value={bulkPassMarks}
                            onChange={(e) => setBulkPassMarks(Number(e.target.value))}
                            className="w-14 px-1.5 py-1 rounded-lg border border-blue-300 font-black text-center text-xs bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyBulkMarks}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition"
                        >
                          Apply All
                        </button>
                      </div>
                    </div>

                    {/* Individual Subject Manual Marks Inputs */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 max-h-60 overflow-y-auto">
                      {examForm.subjects.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-2 px-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block truncate" title={sub.subjectName}>
                                {sub.subjectName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                Code: {sub.subjectCode || "CORE"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            {/* Manual Full Marks Input */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Full Mark:</label>
                              <input
                                type="number"
                                min="1"
                                max="500"
                                required
                                value={sub.maxMarks}
                                onChange={(e) => handleSubjectMarkChange(idx, "maxMarks", Number(e.target.value))}
                                className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-black text-center text-xs bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>

                            {/* Manual Pass Marks Input */}
                            <div className="flex items-center gap-1.5">
                              <label className="text-[10px] uppercase font-bold text-slate-500">Pass Mark:</label>
                              <input
                                type="number"
                                min="1"
                                max={sub.maxMarks || 100}
                                required
                                value={sub.passMarks}
                                onChange={(e) => handleSubjectMarkChange(idx, "passMarks", Number(e.target.value))}
                                className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-black text-center text-xs bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>

                            {/* Remove Subject Button */}
                            {examForm.subjects.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSubject(idx)}
                                title="Remove Subject"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Custom Subject Section */}
                    <div className="mt-2.5">
                      {!isAddingSubject ? (
                        <button
                          type="button"
                          onClick={() => setIsAddingSubject(true)}
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Another Subject (ICT, Sanskrit, Moral Science...)</span>
                        </button>
                      ) : (
                        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
                          <div className="text-[11px] font-bold text-blue-900 flex items-center justify-between">
                            <span>Add New Curriculum Subject:</span>
                            <button
                              type="button"
                              onClick={() => setIsAddingSubject(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <input
                              type="text"
                              placeholder="Subject Name"
                              value={newSubjectName}
                              onChange={(e) => setNewSubjectName(e.target.value)}
                              className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Code (e.g. ICT)"
                              value={newSubjectCode}
                              onChange={(e) => setNewSubjectCode(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                placeholder="Full"
                                value={newSubjectMax}
                                onChange={(e) => setNewSubjectMax(Number(e.target.value))}
                                className="w-16 px-1.5 py-1.5 rounded-lg border border-slate-300 text-xs text-center font-bold bg-white"
                              />
                              <input
                                type="number"
                                placeholder="Pass"
                                value={newSubjectPass}
                                onChange={(e) => setNewSubjectPass(Number(e.target.value))}
                                className="w-16 px-1.5 py-1.5 rounded-lg border border-slate-300 text-xs text-center font-bold bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsAddingSubject(false)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleAddCustomSubject}
                              disabled={!newSubjectName.trim()}
                              className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs disabled:opacity-50"
                            >
                              Add Subject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md"
                    >
                      Save & Create Exam
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* OFFICIAL PRINTABLE REPORT CARD MODAL (Guaranteed 1-Page A4) */}
          {isReportModalOpen && (
            <div id="report-card-modal-backdrop" className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
              <div id="report-card-modal-dialog" className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto">
                {/* Print & Close Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">Official Student Progress Report</span>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                        ✓ Strictly Formatted for 1-Page A4 Printing
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all hover:shadow-lg"
                    >
                      <Printer className="w-4 h-4" />
                      Print 1-Page Marksheet (A4)
                    </button>
                    <button
                      onClick={() => setIsReportModalOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {reportCardLoading || !reportCardData ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  </div>
                ) : (
                  /* Printable Document Layout - Strictly Formatted for ONE A4 Page */
                  <div id="printable-report-card" className="p-3 sm:p-5 bg-white border-2 border-slate-900 rounded-xl print:border-2 print:border-slate-900 print:p-2 text-slate-900 font-sans">
                    <div>
                      {/* Official School Header */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                        <img
                          src="/5tlogo.png"
                          alt="5T Odisha Emblem"
                          className="h-14 w-14 object-contain rounded-lg border border-slate-300 shrink-0"
                        />
                        <div className="text-center flex-1 px-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 block">
                            GOVERNMENT OF ODISHA • SCHOOL & MASS EDUCATION DEPT.
                          </span>
                          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 mt-0.5 leading-tight">
                            {reportCardData.school.name}
                          </h1>
                          <p className="text-[11px] text-slate-700 font-semibold">
                            {reportCardData.school.address}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-800">
                            {reportCardData.school.tagline} • Affiliated to {reportCardData.school.board}
                          </p>
                        </div>
                        <div className="w-14 text-center shrink-0">
                          <div className="w-12 h-14 rounded-lg border-2 border-dashed border-slate-300 mx-auto flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase text-center p-0.5">
                            Affix Photo
                          </div>
                        </div>
                      </div>

                      {/* Report Card Title */}
                      <div className="text-center my-2">
                        <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-wider">
                          ANNUAL STUDENT PROGRESS REPORT CARD - {reportCardData.exam.academicSession}
                        </span>
                        <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                          {reportCardData.exam.title} (Class {reportCardData.student.class})
                        </p>
                      </div>

                      {/* Student Biodata Profile Table */}
                      <div className="border border-slate-400 rounded-lg overflow-hidden mb-2.5 text-[11px]">
                        <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-300">
                          <div className="p-1.5 border-r border-slate-300">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Student Name</span>
                            <span className="font-black text-slate-900 text-xs">{reportCardData.student.name}</span>
                          </div>
                          <div className="p-1.5 border-r border-slate-300">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Roll Number</span>
                            <span className="font-extrabold text-slate-900">{reportCardData.student.rollNo || "N/A"}</span>
                          </div>
                          <div className="p-1.5 border-r border-slate-300">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Class & Section</span>
                            <span className="font-extrabold text-slate-900">
                              Class {reportCardData.student.class} - {reportCardData.student.section}
                            </span>
                          </div>
                          <div className="p-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Admission No</span>
                            <span className="font-mono font-bold text-slate-800">{reportCardData.student.admissionNo}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 bg-white">
                          <div className="p-1.5 border-r border-slate-300">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Father's Name</span>
                            <span className="font-bold text-slate-800">{reportCardData.student.fatherName || "N/A"}</span>
                          </div>
                          <div className="p-1.5 border-r border-slate-300">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Mother's Name</span>
                            <span className="font-bold text-slate-800">{reportCardData.student.motherName || "N/A"}</span>
                          </div>
                          <div className="p-1.5 border-r border-slate-300">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Date of Birth</span>
                            <span className="font-bold text-slate-800">
                              {reportCardData.student.dob
                                ? new Date(reportCardData.student.dob).toLocaleDateString("en-IN")
                                : "N/A"}
                            </span>
                          </div>
                          <div className="p-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Student ID</span>
                            <span className="font-mono font-bold text-slate-800">{reportCardData.student.studentId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Academic Performance Subject Table */}
                      <div className="border border-slate-900 rounded-lg overflow-hidden mb-2.5">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-900 text-white font-extrabold uppercase text-[10px]">
                              <th className="py-1.5 px-2.5 border-r border-slate-700 w-16">Code</th>
                              <th className="py-1.5 px-2.5 border-r border-slate-700">Subject Name</th>
                              <th className="py-1.5 px-2 text-center border-r border-slate-700 w-20">Max</th>
                              <th className="py-1.5 px-2 text-center border-r border-slate-700 w-20">Pass</th>
                              <th className="py-1.5 px-2 text-center border-r border-slate-700 w-24">Marks Secured</th>
                              <th className="py-1.5 px-2 text-center w-16">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300 bg-white">
                            {reportCardData.result.subjectMarks.map((sub, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-1 px-2.5 font-mono font-bold text-slate-700 border-r border-slate-300 text-[10px]">
                                  {sub.subjectCode || "SUB"}
                                </td>
                                <td className="py-1 px-2.5 font-bold text-slate-900 border-r border-slate-300">
                                  {sub.subjectName}
                                </td>
                                <td className="py-1 px-2 text-center font-semibold text-slate-600 border-r border-slate-300">
                                  {sub.maxMarks}
                                </td>
                                <td className="py-1 px-2 text-center font-semibold text-slate-600 border-r border-slate-300">
                                  {sub.passMarks}
                                </td>
                                <td className="py-1 px-2 text-center font-black text-slate-900 border-r border-slate-300">
                                  {sub.isAbsent ? <span className="text-red-600">ABSENT</span> : sub.marksObtained}
                                </td>
                                <td className="py-1 px-2 text-center">
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-black text-[10px] ${
                                      sub.grade === "A1" || sub.grade === "A2"
                                        ? "text-emerald-800 bg-emerald-100"
                                        : sub.grade === "F" || sub.grade === "AB"
                                        ? "text-red-800 bg-red-100"
                                        : "text-blue-800 bg-blue-100"
                                    }`}
                                  >
                                    {sub.grade}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-900 text-[11px]">
                              <td colSpan={2} className="py-1.5 px-2.5 text-right uppercase tracking-wider border-r border-slate-300">
                                Aggregate Total:
                              </td>
                              <td className="py-1.5 px-2 text-center border-r border-slate-300">
                                {reportCardData.result.totalMaxMarks}
                              </td>
                              <td className="py-1.5 px-2 text-center border-r border-slate-300">-</td>
                              <td className="py-1.5 px-2 text-center font-black text-blue-900 border-r border-slate-300">
                                {reportCardData.result.totalMarksObtained}
                              </td>
                              <td className="py-1.5 px-2 text-center font-black text-blue-900">
                                {reportCardData.result.overallGrade}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Result Summary Matrix */}
                      <div className="grid grid-cols-4 gap-2 mb-2.5 text-center text-xs">
                        <div className="p-1.5 sm:p-2 bg-slate-50 border border-slate-300 rounded-lg">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Percentage</span>
                          <span className="text-base font-black text-slate-900">{reportCardData.result.percentage}%</span>
                        </div>
                        <div className="p-1.5 sm:p-2 bg-slate-50 border border-slate-300 rounded-lg">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Overall Grade</span>
                          <span className="text-base font-black text-blue-700">{reportCardData.result.overallGrade}</span>
                        </div>
                        <div className="p-1.5 sm:p-2 bg-slate-50 border border-slate-300 rounded-lg">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Final Result</span>
                          <span
                            className={`text-xs font-black uppercase ${
                              reportCardData.result.status === "Pass" ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {reportCardData.result.status} ({reportCardData.result.division})
                          </span>
                        </div>
                        <div className="p-1.5 sm:p-2 bg-slate-50 border border-slate-300 rounded-lg">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Class Rank</span>
                          <span className="text-base font-black text-amber-600">
                            {reportCardData.result.rank ? `#${reportCardData.result.rank}` : "Qualified"}
                          </span>
                        </div>
                      </div>

                      {/* Teacher Remarks & Grading Scale */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 text-[10px]">
                        <div className="md:col-span-2 p-2 border border-slate-300 rounded-lg bg-white">
                          <span className="text-[9px] text-slate-500 font-bold uppercase block mb-0.5">
                            Class Teacher Remarks & Recommendations
                          </span>
                          <p className="text-slate-800 italic font-semibold text-[11px]">
                            "{reportCardData.result.remarks}"
                          </p>
                        </div>

                        <div className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 text-[9px] text-slate-600">
                          <span className="font-bold uppercase text-slate-800 block mb-0.5">Grading Scale (BSE)</span>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            <div>A1: 90% - 100%</div>
                            <div>B2: 60% - 69%</div>
                            <div>A2: 80% - 89%</div>
                            <div>C1: 50% - 59%</div>
                            <div>B1: 70% - 79%</div>
                            <div>D: 33% - 39% (Pass)</div>
                          </div>
                        </div>
                      </div>

                      {/* Signatures & Seal */}
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-300 text-center text-[10px]">
                        <div>
                          <div className="h-7 border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                          <span className="font-extrabold text-slate-800 mt-1 block">Class Teacher</span>
                        </div>

                        <div className="relative">
                          <div className="w-14 h-14 rounded-full border-2 border-double border-slate-400 mx-auto -mt-4 flex items-center justify-center text-[9px] text-slate-400 font-black uppercase text-center p-0.5">
                            Official Seal
                          </div>
                          <span className="font-extrabold text-slate-800 mt-1 block">Controller of Exams</span>
                        </div>

                        <div>
                          <div className="h-7 border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                          <span className="font-extrabold text-slate-800 mt-1 block">Headmaster / Principal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
