"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import {
  X,
  UserCheck,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Search,
  Edit2,
  Download,
  Printer,
  FileSpreadsheet,
  GraduationCap,
  Users,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Shield,
  Check,
  Clock,
  BookOpen,
  Filter,
  UserPlus,
  Key
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";

type Student = {
  _id: string;
  studentId: string;
  admissionNo: string;
  personal: {
    name: string;
    mobile: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    aadhaar?: string;
    photo?: string;
  };
  academic: {
    class: string;
    section?: string;
    rollNo?: number;
    sessionName?: string;
    sessionId?: string;
  };
  parents: {
    fatherName?: string;
    motherName?: string;
    guardian?: string;
    parentMobile?: string;
  };
  address: {
    village?: string;
    post?: string;
    district?: string;
    block?: string;
    state?: string;
    pincode?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };
  documents?: {
    photo?: string;
    aadhaar?: string;
    birthCertificate?: string;
    transferCertificate?: string;
  };
  status: string;
  admissionDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AcademicHistory = {
  _id: string;
  studentId: string;
  oldSession?: string;
  oldClass?: string;
  newSession?: string;
  newClass?: string;
  passedOutBatch?: string;
  promotedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  promotedAt: string;
};

type Session = {
  _id: string;
  sessionName: string;
  status: string;
};

const DEFAULT_CLASSES = ["8", "9", "10"];

export default function Students() {
  const { user, token } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isAdminOrSuperAdmin = user?.role === "admin" || isSuperAdmin;

  // Main Directory State
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>(DEFAULT_CLASSES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Directory View Tabs: "enrolled" | "passed_out"
  const [directoryTab, setDirectoryTab] = useState<"enrolled" | "passed_out">("enrolled");

  // Filters for Enrolled Students
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grouped">("table");

  // Filters for Pass Out Students
  const [passOutBatchFilter, setPassOutBatchFilter] = useState<string>("all");

  // Student Full Details Dossier Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dossierTab, setDossierTab] = useState<"all" | "academic" | "personal" | "parents" | "address" | "bank" | "history">("all");
  const [academicHistory, setAcademicHistory] = useState<AcademicHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isPrintDossierModalOpen, setIsPrintDossierModalOpen] = useState(false);

  // Mark as Passed Out Modal state
  const [isPassOutModalOpen, setIsPassOutModalOpen] = useState(false);
  const [studentToPassOut, setStudentToPassOut] = useState<Student | null>(null);
  const [passOutSession, setPassOutSession] = useState("2026-2027");

  // Promote modal state
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteSourceClass, setPromoteSourceClass] = useState("8");
  const [promoteTargetClass, setPromoteTargetClass] = useState("9");
  const [promoteTargetSession, setPromoteTargetSession] = useState("");
  const [promoteStatus, setPromoteStatus] = useState("active");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Super Admin Reset Student Password modal state
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [targetStudentForPwd, setTargetStudentForPwd] = useState<Student | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetPwdError, setResetPwdError] = useState("");
  const [resetPwdSuccess, setResetPwdSuccess] = useState("");

  // ID card modal state
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [studentForIdCard, setStudentForIdCard] = useState<Student | null>(null);

  // Edit student modal state
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    name: "",
    mobile: "",
    gender: "male",
    dob: "",
    bloodGroup: "",
    aadhaar: "",
    class: "8",
    section: "",
    rollNo: 1,
    status: "active",
    fatherName: "",
    motherName: "",
    guardian: "",
    parentMobile: "",
    village: "",
    post: "",
    block: "",
    district: "",
    state: "Odisha",
    pincode: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch Students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      // Fetch all statuses so we have accurate counters for Enrolled vs Passed Out
      params.append("status", "all");

      const res = await fetch(`${API_BASE_URL}/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);

        // Dynamically extract unique classes
        const classSet = new Set<string>(DEFAULT_CLASSES);
        data.forEach((s) => {
          if (s.academic?.class) classSet.add(s.academic.class);
        });
        const sortedClasses = Array.from(classSet).sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        });
        setAvailableClasses(sortedClasses);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Academic Sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
        if (data.length > 0) {
          setPromoteTargetSession(data[0].sessionName);
          setPassOutSession(data[0].sessionName);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStudents();
      fetchSessions();

      fetch(`${API_BASE_URL}/sessions/active`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.allowedClasses && data.allowedClasses.length > 0) {
            setAvailableClasses(data.allowedClasses);
          } else if (data?.classConfigs && data.classConfigs.length > 0) {
            setAvailableClasses(data.classConfigs.map((c: any) => c.className));
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // Fetch Single Student Academic History
  const fetchStudentHistory = async (studentId: string) => {
    try {
      setHistoryLoading(true);
      const res = await fetch(`${API_BASE_URL}/students/${studentId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAcademicHistory(data);
      } else {
        setAcademicHistory([]);
      }
    } catch (err) {
      console.error(err);
      setAcademicHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Full Student Profile / Dossier
  const handleOpenStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setDossierTab("all");
    setIsModalOpen(true);
    fetchStudentHistory(student._id);
  };

  // Super Admin Reset Password modal helper
  const openResetStudentPwdModal = (student: Student) => {
    setTargetStudentForPwd(student);
    setAdminNewPassword("");
    setResetPwdError("");
    setResetPwdSuccess("");
    setIsResetPwdModalOpen(true);
  };

  const handleAdminResetStudentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentForPwd) return;
    setResetPwdError("");
    setResetPwdSuccess("");

    if (!adminNewPassword || adminNewPassword.length < 6) {
      setResetPwdError("New password must be at least 6 characters long");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setResetPwdError("Session expired. Please log in again.");
      return;
    }

    try {
      setResetPwdLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/superadmin-reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: "student",
          targetId: targetStudentForPwd._id,
          newPassword: adminNewPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResetPwdSuccess(data.message || `Password reset successfully for ${targetStudentForPwd.personal?.name}!`);
        setAdminNewPassword("");
        setTimeout(() => {
          setIsResetPwdModalOpen(false);
          setResetPwdSuccess("");
        }, 1800);
      } else {
        setResetPwdError(data.message || "Failed to reset password");
      }
    } catch (err: any) {
      setResetPwdError(err.message || "Network error resetting password");
    } finally {
      setResetPwdLoading(false);
    }
  };

  // Enrolled vs Passed Out Partition
  const enrolledStudentsAll = useMemo(() => {
    return students.filter((s) => s.status !== "passed_out");
  }, [students]);

  const passedOutStudentsAll = useMemo(() => {
    return students.filter((s) => s.status === "passed_out");
  }, [students]);

  // Filtered Enrolled Students List
  const filteredEnrolledStudents = useMemo(() => {
    return enrolledStudentsAll.filter((s) => {
      // Class filter
      if (selectedClass !== "all" && s.academic?.class !== selectedClass) {
        return false;
      }
      // Section filter
      if (selectedSection !== "all" && s.academic?.section !== selectedSection) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && s.status !== statusFilter) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (s.personal?.name || "").toLowerCase();
        const adm = (s.admissionNo || "").toLowerCase();
        const stuId = (s.studentId || "").toLowerCase();
        const mob = (s.personal?.mobile || "").toLowerCase();
        const fName = (s.parents?.fatherName || "").toLowerCase();
        return (
          name.includes(q) ||
          adm.includes(q) ||
          stuId.includes(q) ||
          mob.includes(q) ||
          fName.includes(q)
        );
      }
      return true;
    });
  }, [enrolledStudentsAll, selectedClass, selectedSection, statusFilter, search]);

  // Filtered Pass Out Students List
  const filteredPassedOutStudents = useMemo(() => {
    return passedOutStudentsAll.filter((s) => {
      // Batch filter
      if (passOutBatchFilter !== "all" && s.academic?.sessionName !== passOutBatchFilter) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (s.personal?.name || "").toLowerCase();
        const adm = (s.admissionNo || "").toLowerCase();
        const stuId = (s.studentId || "").toLowerCase();
        const mob = (s.personal?.mobile || "").toLowerCase();
        const fName = (s.parents?.fatherName || "").toLowerCase();
        return (
          name.includes(q) ||
          adm.includes(q) ||
          stuId.includes(q) ||
          mob.includes(q) ||
          fName.includes(q)
        );
      }
      return true;
    });
  }, [passedOutStudentsAll, passOutBatchFilter, search]);

  // Unique batches for passed out students
  const availablePassOutBatches = useMemo(() => {
    const batches = new Set<string>();
    passedOutStudentsAll.forEach((s) => {
      if (s.academic?.sessionName) batches.add(s.academic.sessionName);
    });
    return Array.from(batches).sort();
  }, [passedOutStudentsAll]);

  // Helper for status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "passed_out":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "inactive":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "transferred":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Export CSV Handler
  const exportToCSV = () => {
    const listToExport = directoryTab === "enrolled" ? filteredEnrolledStudents : filteredPassedOutStudents;
    if (listToExport.length === 0) return;
    const headers = [
      "Student ID",
      "Admission No",
      "Name",
      "Class",
      "Section",
      "Roll No",
      "Gender",
      "DOB",
      "Mobile",
      "Father Name",
      "Mother Name",
      "Aadhaar",
      "Status",
      "Session",
    ];

    const rows = listToExport.map((s) => [
      `"${s.studentId || ""}"`,
      `"${s.admissionNo || ""}"`,
      `"${s.personal?.name || ""}"`,
      `"${s.academic?.class || ""}"`,
      `"${s.academic?.section || ""}"`,
      `"${s.academic?.rollNo || ""}"`,
      `"${s.personal?.gender || ""}"`,
      `"${s.personal?.dob ? new Date(s.personal.dob).toLocaleDateString() : ""}"`,
      `"${s.personal?.mobile || ""}"`,
      `"${s.parents?.fatherName || ""}"`,
      `"${s.parents?.motherName || ""}"`,
      `"${s.personal?.aadhaar || ""}"`,
      `"${s.status || ""}"`,
      `"${s.academic?.sessionName || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${directoryTab === "enrolled" ? "Enrolled_Students" : "Pass_Out_Students"}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = (student: Student) => {
    setEditStudentForm({
      name: student.personal?.name || "",
      mobile: student.personal?.mobile || "",
      gender: student.personal?.gender || "male",
      dob: student.personal?.dob ? student.personal.dob.split("T")[0] : "",
      bloodGroup: student.personal?.bloodGroup || "",
      aadhaar: student.personal?.aadhaar || "",
      class: student.academic?.class || "8",
      section: student.academic?.section || "",
      rollNo: student.academic?.rollNo || 1,
      status: student.status || "active",
      fatherName: student.parents?.fatherName || "",
      motherName: student.parents?.motherName || "",
      guardian: student.parents?.guardian || "",
      parentMobile: student.parents?.parentMobile || "",
      village: student.address?.village || "",
      post: student.address?.post || "",
      block: student.address?.block || "",
      district: student.address?.district || "",
      state: student.address?.state || "Odisha",
      pincode: student.address?.pincode || "",
    });
    setIsEditStudentModalOpen(true);
  };

  // Handle Edit Student Submission
  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/students/${selectedStudent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personal: {
            ...selectedStudent.personal,
            name: editStudentForm.name,
            mobile: editStudentForm.mobile,
            gender: editStudentForm.gender,
            dob: editStudentForm.dob ? new Date(editStudentForm.dob) : undefined,
            bloodGroup: editStudentForm.bloodGroup,
            aadhaar: editStudentForm.aadhaar,
          },
          academic: {
            ...selectedStudent.academic,
            class: editStudentForm.class,
            section: editStudentForm.section,
            rollNo: Number(editStudentForm.rollNo) || undefined,
          },
          parents: {
            ...selectedStudent.parents,
            fatherName: editStudentForm.fatherName,
            motherName: editStudentForm.motherName,
            guardian: editStudentForm.guardian,
            parentMobile: editStudentForm.parentMobile,
          },
          address: {
            ...selectedStudent.address,
            village: editStudentForm.village,
            post: editStudentForm.post,
            block: editStudentForm.block,
            district: editStudentForm.district,
            state: editStudentForm.state,
            pincode: editStudentForm.pincode,
          },
          status: editStudentForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update student");

      setSuccess("Student record updated successfully!");
      setIsEditStudentModalOpen(false);
      setSelectedStudent(data);
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Failed to update student");
    } finally {
      setSubmitting(false);
    }
  };

  // Mark as Passed Out Modal trigger
  const handleOpenMarkPassOut = (student: Student) => {
    setStudentToPassOut(student);
    setPassOutSession(student.academic?.sessionName || sessions[0]?.sessionName || "2026-2027");
    setIsPassOutModalOpen(true);
  };

  // Confirm Mark as Passed Out
  const handleConfirmPassOut = async () => {
    if (!studentToPassOut) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/students/${studentToPassOut._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "passed_out",
          academic: {
            ...studentToPassOut.academic,
            sessionName: passOutSession,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to mark as passed out");

      setSuccess(`Student ${studentToPassOut.personal?.name} moved to Pass Out Students list (Batch ${passOutSession})!`);
      setIsPassOutModalOpen(false);
      setStudentToPassOut(null);
      if (selectedStudent?._id === studentToPassOut._id) {
        setSelectedStudent({ ...selectedStudent, status: "passed_out" });
      }
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Failed to update student status");
    } finally {
      setSubmitting(false);
    }
  };

  // Re-activate Passed Out Student
  const handleReactivateStudent = async (student: Student) => {
    if (!confirm(`Re-activate ${student.personal?.name} as an enrolled active student?`)) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/students/${student._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "active",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to re-activate student");

      setSuccess(`Student ${student.personal?.name} re-activated as active enrolled student.`);
      if (selectedStudent?._id === student._id) {
        setSelectedStudent({ ...selectedStudent, status: "active" });
      }
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Failed to re-activate student");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Promote modal
  const handleOpenPromote = () => {
    setError("");
    setSuccess("");
    const eligible = enrolledStudentsAll.filter(
      (s) => s.academic?.class === promoteSourceClass && s.status === "active"
    );
    setSelectedStudentIds(eligible.map((s) => s._id));
    setIsPromoteModalOpen(true);
  };

  // Source Class Change in Promote Modal
  const handleSourceClassChange = (newSource: string) => {
    setPromoteSourceClass(newSource);
    if (newSource === "8") {
      setPromoteTargetClass("9");
      setPromoteStatus("active");
    } else if (newSource === "9") {
      setPromoteTargetClass("10");
      setPromoteStatus("active");
    } else if (newSource === "10") {
      setPromoteTargetClass("10");
      setPromoteStatus("passed_out");
    }
    const eligible = enrolledStudentsAll.filter(
      (s) => s.academic?.class === newSource && s.status === "active"
    );
    setSelectedStudentIds(eligible.map((s) => s._id));
  };

  const handleToggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPromote = () => {
    const eligible = enrolledStudentsAll.filter(
      (s) => s.academic?.class === promoteSourceClass && s.status === "active"
    );
    if (selectedStudentIds.length === eligible.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligible.map((s) => s._id));
    }
  };

  // Handle Promote Submission
  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      setError("Please select at least one student to promote.");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/students/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          newSession: promoteTargetSession,
          newClass: promoteTargetClass,
          status: promoteStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to promote students");

      setSuccess(data.message || `Successfully promoted ${selectedStudentIds.length} students!`);
      setIsPromoteModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Promotion failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/students/${selectedStudent._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete student");

      setSuccess("Student record deleted successfully.");
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Deletion failed");
    } finally {
      setSubmitting(false);
    }
  };

  const eligibleStudentsForPromote = enrolledStudentsAll.filter(
    (s) => s.academic?.class === promoteSourceClass && s.status === "active"
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Class-wise roster, complete student profile dossiers, and alumni pass-out registry
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={exportToCSV}
              disabled={students.length === 0}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl font-bold shadow-xs transition-all disabled:opacity-50 text-xs"
              title="Export filtered records to CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Export CSV
            </button>

            {isSuperAdmin && (
              <button
                onClick={handleOpenPromote}
                className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all text-xs font-bold py-2.5 px-4 rounded-xl"
              >
                <ArrowUpRight className="w-4 h-4" />
                Promote Cohort
              </button>
            )}

            <Link
              href="/admissions"
              className="btn btn-secondary flex items-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2.5 px-3.5 rounded-xl"
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              Admissions
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top-Level Directory Navigation Switcher */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 sm:gap-2 border border-slate-200/80 shadow-xs w-full max-w-xl">
          <button
            onClick={() => setDirectoryTab("enrolled")}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              directoryTab === "enrolled"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Enrolled Students</span>
            <span className="sm:hidden">Enrolled</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                directoryTab === "enrolled"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {enrolledStudentsAll.length}
            </span>
          </button>

          <button
            onClick={() => setDirectoryTab("passed_out")}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              directoryTab === "passed_out"
                ? "bg-white text-purple-700 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 shrink-0" />
            <span className="hidden sm:inline">Pass Out Students (Alumni)</span>
            <span className="sm:hidden">Alumni</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                directoryTab === "passed_out"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {passedOutStudentsAll.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={
              directoryTab === "enrolled"
                ? "Search by student name, admission no, mobile, roll, or father name..."
                : "Search alumni by name, admission no, passing batch, mobile..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-11 pr-4 py-3 w-full rounded-2xl border-slate-200 shadow-xs text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: ENROLLED STUDENTS (CLASS-WISE DIRECTORY)          */}
        {/* ======================================================== */}
        {directoryTab === "enrolled" && (
          <div className="space-y-4">
            {/* Class Tabs Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Browse Class Wise:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "table"
                        ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Table Roster
                  </button>
                  <button
                    onClick={() => setViewMode("grouped")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewMode === "grouped"
                        ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Grouped Cards
                  </button>
                </div>
              </div>

              {/* Class Tabs Horizontal Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedClass("all")}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedClass === "all"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>All Classes</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      selectedClass === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {enrolledStudentsAll.length}
                  </span>
                </button>

                {availableClasses.map((cls) => {
                  const classCount = enrolledStudentsAll.filter(
                    (s) => s.academic?.class === cls
                  ).length;
                  const isSelected = selectedClass === cls;
                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`py-2 px-3.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      <span>Class {cls}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {classCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary Filters: Section & Status */}
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Section:</span>
                </div>
                {["all", "A", "B", "C"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(sec)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      selectedSection === sec
                        ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {sec === "all" ? "All Sections" : `Section ${sec}`}
                  </button>
                ))}

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                  <span>Status:</span>
                </div>
                {["all", "active", "inactive"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                      statusFilter === st
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {st === "all" ? "All Statuses" : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading Spinner */}
            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : viewMode === "grouped" ? (
              /* Class-wise Grouped View */
              <div className="space-y-6">
                {(selectedClass === "all" ? availableClasses : [selectedClass]).map((cls) => {
                  const classStudents = filteredEnrolledStudents.filter(
                    (s) => s.academic?.class === cls
                  );
                  if (classStudents.length === 0 && selectedClass === "all") return null;

                  const boys = classStudents.filter((s) => s.personal?.gender === "male").length;
                  const girls = classStudents.filter((s) => s.personal?.gender === "female").length;

                  return (
                    <div
                      key={cls}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                    >
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                            {cls}
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900">
                              Class {cls} Student Cohort
                            </h3>
                            <p className="text-xs text-slate-500">
                              Total Students: <strong className="text-slate-800">{classStudents.length}</strong>
                              {" • "}Boys: {boys} • Girls: {girls}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
                          Click student name to view complete dossier
                        </span>
                      </div>

                      {/* Class Roster Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-3">Roll & Name</th>
                              <th className="px-4 py-3">Section</th>
                              <th className="px-4 py-3">Student ID</th>
                              <th className="px-4 py-3">Admission No</th>
                              <th className="px-4 py-3">Parent / Contact</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {classStudents.map((student) => (
                              <tr
                                key={student._id}
                                className="hover:bg-blue-50/40 transition-colors"
                              >
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                                      {student.academic?.rollNo || "—"}
                                    </div>
                                    <div>
                                      <button
                                        onClick={() => handleOpenStudentDetails(student)}
                                        className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1.5 text-left group"
                                        title="Click to view full student details"
                                      >
                                        <span>{student.personal?.name}</span>
                                        <Eye className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
                                      </button>
                                      {student.personal?.gender && (
                                        <span className="text-[10px] text-slate-400 capitalize">
                                          {student.personal.gender}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 font-bold text-slate-800">
                                  Section {student.academic?.section || "A"}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-slate-600">
                                  {student.studentId}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-slate-600">
                                  {student.admissionNo}
                                </td>
                                <td className="px-4 py-3.5 text-slate-600">
                                  <div className="font-medium text-slate-800">
                                    {student.parents?.fatherName || "—"}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {student.personal?.mobile || student.parents?.parentMobile || "—"}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5">
                                  <span
                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md capitalize border ${getStatusColor(
                                      student.status
                                    )}`}
                                  >
                                    {student.status.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenStudentDetails(student)}
                                      className="btn py-1 px-2 text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1"
                                      title="Open complete student dossier"
                                    >
                                      <Eye className="w-3 h-3" />
                                      Profile
                                    </button>
                                    {isAdminOrSuperAdmin && (
                                      <button
                                        onClick={() => handleOpenMarkPassOut(student)}
                                        className="btn py-1 px-2 text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold flex items-center gap-1"
                                        title="Move to Pass Out alumni list"
                                      >
                                        <GraduationCap className="w-3 h-3" />
                                        Pass Out
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {classStudents.length === 0 && (
                              <tr>
                                <td colSpan={7} className="text-center py-8 text-slate-400">
                                  No students found in Class {cls} matching current filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Flat Table View */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Desktop Flat Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Student Name (Click to View)</th>
                        <th className="px-4 py-3.5">Class & Section</th>
                        <th className="px-4 py-3.5">Roll No</th>
                        <th className="px-4 py-3.5">Student ID</th>
                        <th className="px-4 py-3.5">Admission No</th>
                        <th className="px-4 py-3.5">Father's Name & Mobile</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEnrolledStudents.map((student) => (
                        <tr
                          key={student._id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* Clickable Student Name */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => handleOpenStudentDetails(student)}
                                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                              >
                                {student.personal?.name?.charAt(0).toUpperCase() || "S"}
                              </div>
                              <div>
                                <button
                                  onClick={() => handleOpenStudentDetails(student)}
                                  className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1.5 text-left group-hover:translate-x-0.5 transition-transform"
                                  title="Click to view all student details"
                                >
                                  <span>{student.personal?.name}</span>
                                  <Eye className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100" />
                                </button>
                                <div className="text-[11px] text-slate-400 capitalize">
                                  {student.personal?.gender || "Student"}
                                  {student.personal?.dob &&
                                    ` • DOB: ${new Date(student.personal.dob).toLocaleDateString()}`}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Class & Section */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Class {student.academic?.class} - {student.academic?.section || "A"}
                            </span>
                          </td>

                          {/* Roll Number */}
                          <td className="px-4 py-4 whitespace-nowrap font-bold text-slate-800">
                            #{student.academic?.rollNo || "—"}
                          </td>

                          {/* Student ID */}
                          <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-600 text-xs">
                            {student.studentId}
                          </td>

                          {/* Admission No */}
                          <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-600 text-xs">
                            {student.admissionNo}
                          </td>

                          {/* Father & Mobile */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">
                              {student.parents?.fatherName || "—"}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {student.personal?.mobile || student.parents?.parentMobile || "—"}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 text-xs font-bold rounded-lg capitalize border ${getStatusColor(
                                student.status
                              )}`}
                            >
                              {student.status.replace("_", " ")}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenStudentDetails(student)}
                                className="btn py-1.5 px-2.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                                title="View full profile dossier"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Details
                              </button>

                              {isAdminOrSuperAdmin && (
                                <button
                                  onClick={() => handleOpenMarkPassOut(student)}
                                  className="btn py-1.5 px-2.5 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                                  title="Mark student as Passed Out"
                                >
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  Pass Out
                                </button>
                              )}

                              {isSuperAdmin && (
                                <button
                                  onClick={() => openResetStudentPwdModal(student)}
                                  className="btn py-1.5 px-2.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                                  title="Reset Password (Super Admin Override)"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Reset Pwd</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredEnrolledStudents.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-slate-500">
                            No enrolled students found matching current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (Phones & Small screens) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredEnrolledStudents.map((student) => (
                    <div key={student._id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            onClick={() => handleOpenStudentDetails(student)}
                            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs cursor-pointer shrink-0"
                          >
                            {student.personal?.name?.charAt(0).toUpperCase() || "S"}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => handleOpenStudentDetails(student)}
                              className="text-sm font-bold text-blue-700 hover:text-blue-900 text-left truncate block max-w-[170px]"
                            >
                              {student.personal?.name}
                            </button>
                            <p className="text-[11px] text-slate-500">
                              Roll #{student.academic?.rollNo || "—"} • ID: {student.studentId}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg capitalize border shrink-0 ${getStatusColor(
                            student.status
                          )}`}
                        >
                          {student.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Class & Sec</span>
                          <span className="font-bold text-slate-800">Class {student.academic?.class}-{student.academic?.section || "A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Admission No</span>
                          <span className="font-mono text-slate-700 font-semibold">{student.admissionNo}</span>
                        </div>
                        <div className="col-span-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-slate-600 text-xs truncate max-w-[150px]">
                            👨 {student.parents?.fatherName || "—"}
                          </span>
                          {(student.personal?.mobile || student.parents?.parentMobile) && (
                            <a
                              href={`tel:${student.personal?.mobile || student.parents?.parentMobile}`}
                              className="text-blue-600 font-mono font-bold text-[11px] flex items-center gap-1 hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{student.personal?.mobile || student.parents?.parentMobile}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Touch Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          onClick={() => handleOpenStudentDetails(student)}
                          className="flex-1 py-1.5 px-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                        {isAdminOrSuperAdmin && (
                          <button
                            onClick={() => handleOpenMarkPassOut(student)}
                            className="py-1.5 px-2.5 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold flex items-center justify-center gap-1 shadow-xs"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Pass Out</span>
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openResetStudentPwdModal(student)}
                            className="py-1.5 px-2 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Pwd</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredEnrolledStudents.length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No enrolled students found matching current filters.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: PASS OUT STUDENTS LIST (ALUMNI REGISTRY)          */}
        {/* ======================================================== */}
        {directoryTab === "passed_out" && (
          <div className="space-y-4">
            {/* Pass Out Summary Bar */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Pass Out Student Registry (Alumni)</h2>
                  <p className="text-xs text-purple-200">
                    Students who graduated or passed out of Dulichand Sonadevi High School
                  </p>
                </div>
              </div>

              {/* Batch Filter Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-purple-200">Passing Batch:</span>
                <select
                  value={passOutBatchFilter}
                  onChange={(e) => setPassOutBatchFilter(e.target.value)}
                  className="bg-slate-900/80 text-white text-xs font-bold px-3 py-2 rounded-xl border border-purple-400/40 focus:outline-none"
                >
                  <option value="all">All Passing Batches ({passedOutStudentsAll.length})</option>
                  {availablePassOutBatches.map((batch) => (
                    <option key={batch} value={batch}>
                      Batch {batch} (
                      {passedOutStudentsAll.filter((s) => s.academic?.sessionName === batch).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pass Out Table */}
            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Desktop Alumni Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Student Name (Click to View)</th>
                        <th className="px-4 py-3.5">Passing Out Batch</th>
                        <th className="px-4 py-3.5">Final Class & Roll</th>
                        <th className="px-4 py-3.5">Student ID</th>
                        <th className="px-4 py-3.5">Admission No</th>
                        <th className="px-4 py-3.5">Parent Contact</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPassedOutStudents.map((student) => (
                        <tr
                          key={student._id}
                          className="hover:bg-purple-50/40 transition-colors group"
                        >
                          {/* Student Name */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => handleOpenStudentDetails(student)}
                                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-700 text-white font-black flex items-center justify-center text-xs shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                              >
                                {student.personal?.name?.charAt(0).toUpperCase() || "S"}
                              </div>
                              <div>
                                <button
                                  onClick={() => handleOpenStudentDetails(student)}
                                  className="text-sm font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1.5 text-left group-hover:translate-x-0.5 transition-transform"
                                  title="Click to view full student details"
                                >
                                  <span>{student.personal?.name}</span>
                                  <Eye className="w-3.5 h-3.5 text-purple-500 opacity-60 group-hover:opacity-100" />
                                </button>
                                <div className="text-[11px] text-slate-400 capitalize">
                                  {student.personal?.gender || "Alumni"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Passing Out Batch */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              🎓 Batch {student.academic?.sessionName || "2025-2026"}
                            </span>
                          </td>

                          {/* Final Class & Roll */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-bold text-slate-800">
                              Class {student.academic?.class}
                            </span>
                            {student.academic?.rollNo && (
                              <span className="text-slate-500 ml-1">
                                (Roll: {student.academic.rollNo})
                              </span>
                            )}
                          </td>

                          {/* Student ID */}
                          <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-600">
                            {student.studentId}
                          </td>

                          {/* Admission No */}
                          <td className="px-4 py-4 whitespace-nowrap font-mono text-slate-600">
                            {student.admissionNo}
                          </td>

                          {/* Parent Mobile */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">
                              {student.parents?.fatherName || "—"}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {student.personal?.mobile || student.parents?.parentMobile || "—"}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                              Passed Out
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenStudentDetails(student)}
                                className="btn py-1.5 px-2.5 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                                title="Open full student dossier"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Details
                              </button>

                              {isAdminOrSuperAdmin && (
                                <button
                                  onClick={() => handleReactivateStudent(student)}
                                  className="btn py-1.5 px-2.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                                  title="Restore to active enrolled student"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Restore
                                </button>
                              )}

                              {isSuperAdmin && (
                                <button
                                  onClick={() => openResetStudentPwdModal(student)}
                                  className="btn py-1.5 px-2.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold flex items-center gap-1 shadow-xs"
                                  title="Reset Password (Super Admin Override)"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Reset Pwd</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPassedOutStudents.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-slate-500">
                            No pass-out students found. Use "Pass Out" action on any enrolled student to archive them here.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View for Alumni */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredPassedOutStudents.map((student) => (
                    <div key={student._id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            onClick={() => handleOpenStudentDetails(student)}
                            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-700 text-white font-black flex items-center justify-center text-xs shadow-xs cursor-pointer shrink-0"
                          >
                            {student.personal?.name?.charAt(0).toUpperCase() || "S"}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => handleOpenStudentDetails(student)}
                              className="text-sm font-bold text-purple-700 hover:text-purple-900 text-left truncate block max-w-[170px]"
                            >
                              {student.personal?.name}
                            </button>
                            <p className="text-[11px] text-slate-500">
                              Batch {student.academic?.sessionName || "Alumni"} • ID: {student.studentId}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                          Passed Out
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-purple-50/40 p-2.5 rounded-xl border border-purple-100">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Final Class</span>
                          <span className="font-bold text-slate-800">Class {student.academic?.class} {student.academic?.rollNo ? `(#${student.academic.rollNo})` : ""}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Admission No</span>
                          <span className="font-mono text-slate-700 font-semibold">{student.admissionNo}</span>
                        </div>
                        <div className="col-span-2 pt-1.5 border-t border-purple-200/60 flex items-center justify-between">
                          <span className="text-slate-600 text-xs truncate max-w-[150px]">
                            👨 {student.parents?.fatherName || "—"}
                          </span>
                          {(student.personal?.mobile || student.parents?.parentMobile) && (
                            <a
                              href={`tel:${student.personal?.mobile || student.parents?.parentMobile}`}
                              className="text-purple-600 font-mono font-bold text-[11px] flex items-center gap-1 hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{student.personal?.mobile || student.parents?.parentMobile}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Touch Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          onClick={() => handleOpenStudentDetails(student)}
                          className="flex-1 py-1.5 px-2 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl font-bold flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                        {isAdminOrSuperAdmin && (
                          <button
                            onClick={() => handleReactivateStudent(student)}
                            className="py-1.5 px-2.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold flex items-center justify-center gap-1 shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openResetStudentPwdModal(student)}
                            className="py-1.5 px-2 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Pwd</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredPassedOutStudents.length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No alumni records found matching current filters.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* COMPREHENSIVE STUDENT DOSSIER & PROFILE MODAL            */}
        {/* ======================================================== */}
        {isModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 flex flex-col">
              {/* Modal Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Official Student Dossier & Profile
                    </h2>
                    <p className="text-xs text-slate-500">
                      Complete institutional record for {selectedStudent.personal?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStudentForIdCard(selectedStudent);
                      setIsIdCardModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 shadow-xs"
                    title="Print student identity card"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    ID Card
                  </button>

                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedStudent(null);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Hero Profile Banner */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col md:flex-row items-center md:items-start gap-5">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-800 border-2 border-white/20 overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
                  {selectedStudent.personal?.photo ? (
                    <img
                      src={selectedStudent.personal.photo}
                      alt={selectedStudent.personal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-3xl font-black text-blue-300">
                      {selectedStudent.personal?.name?.charAt(0).toUpperCase() || "S"}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                      {selectedStudent.personal?.name}
                    </h3>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold capitalize border ${
                        selectedStudent.status === "passed_out"
                          ? "bg-purple-500/30 text-purple-200 border-purple-400/40"
                          : selectedStudent.status === "active"
                          ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/40"
                          : "bg-slate-500/30 text-slate-200 border-slate-400/40"
                      }`}
                    >
                      {selectedStudent.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-blue-200">
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 font-bold">
                      Class {selectedStudent.academic?.class} ({selectedStudent.academic?.section || "A"})
                    </span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 font-bold">
                      Roll No: {selectedStudent.academic?.rollNo || "—"}
                    </span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 font-bold">
                      Session: {selectedStudent.academic?.sessionName || "2026-2027"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300 font-mono pt-1">
                    <span>
                      Student ID: <strong className="text-white">{selectedStudent.studentId}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Admission No: <strong className="text-white">{selectedStudent.admissionNo}</strong>
                    </span>
                  </div>
                </div>

                {/* Hero Quick Actions */}
                <div className="flex md:flex-col gap-2 w-full md:w-auto shrink-0">
                  {isAdminOrSuperAdmin && (
                    <button
                      onClick={() => handleOpenEditStudent(selectedStudent)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Student
                    </button>
                  )}

                  {selectedStudent.status === "passed_out" ? (
                    <button
                      onClick={() => handleReactivateStudent(selectedStudent)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                      Re-activate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenMarkPassOut(selectedStudent)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-200 bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 rounded-xl transition-all shadow-sm"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                      Mark Passed Out
                    </button>
                  )}
                </div>
              </div>

              {/* Dossier Section Navigation Pills */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-bold">
                {[
                  { id: "all", label: "All Details" },
                  { id: "academic", label: "Academic & Enrollment" },
                  { id: "personal", label: "Personal Information" },
                  { id: "parents", label: "Parents & Guardians" },
                  { id: "address", label: "Address & Location" },
                  { id: "bank", label: "Banking & Welfare" },
                  { id: "history", label: "Academic History" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDossierTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                      dossierTab === tab.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Dossier Content Body */}
              <div className="p-6 space-y-6 flex-1">
                {/* 1. Academic & Enrollment Details */}
                {(dossierTab === "all" || dossierTab === "academic") && (
                  <div className="card p-5 border border-slate-200/80 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        1. Academic & Enrollment Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Admission Number</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {selectedStudent.admissionNo}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Student System ID</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {selectedStudent.studentId}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Current Class</span>
                        <span className="font-bold text-blue-700 text-sm">
                          Class {selectedStudent.academic?.class}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Section & Roll</span>
                        <span className="font-bold text-slate-900 text-sm">
                          Sec {selectedStudent.academic?.section || "A"} • Roll #{selectedStudent.academic?.rollNo || "—"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Academic Session</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.academic?.sessionName || "2026-2027"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Admission Date</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.admissionDate
                            ? new Date(selectedStudent.admissionDate).toLocaleDateString()
                            : "Recorded on file"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Enrollment Status</span>
                        <span className="font-bold text-slate-900 capitalize">
                          {selectedStudent.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Transfer Certificate (TC)</span>
                        <Link
                          href="/certificates"
                          className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Check TC Records <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Personal Demographics */}
                {(dossierTab === "all" || dossierTab === "personal") && (
                  <div className="card p-5 border border-slate-200/80 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        2. Personal Demographics
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Full Name</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedStudent.personal?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Gender</span>
                        <span className="font-bold text-slate-900 capitalize">
                          {selectedStudent.personal?.gender || "Not Specified"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Date of Birth</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.personal?.dob
                            ? new Date(selectedStudent.personal.dob).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Blood Group</span>
                        <span className="font-bold text-red-600">
                          {selectedStudent.personal?.bloodGroup || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Aadhaar Number</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedStudent.personal?.aadhaar
                            ? `${selectedStudent.personal.aadhaar.slice(0, 4)} ${selectedStudent.personal.aadhaar.slice(4, 8)} ${selectedStudent.personal.aadhaar.slice(8)}`
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Student Mobile</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedStudent.personal?.mobile || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Parents & Guardians */}
                {(dossierTab === "all" || dossierTab === "parents") && (
                  <div className="card p-5 border border-slate-200/80 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        3. Parents & Guardians Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Father's Name</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.parents?.fatherName || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Mother's Name</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.parents?.motherName || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Local Guardian</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.parents?.guardian || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Primary Parent Contact</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedStudent.parents?.parentMobile || selectedStudent.personal?.mobile || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Complete Address */}
                {(dossierTab === "all" || dossierTab === "address") && (
                  <div className="card p-5 border border-slate-200/80 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        4. Complete Residential Address
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Village / Street / House</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.address?.village || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Post Office</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.address?.post || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Block / Tehsil</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.address?.block || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">District</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.address?.district || "Balasore"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">State</span>
                        <span className="font-bold text-slate-900">
                          {selectedStudent.address?.state || "Odisha"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">PIN Code</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedStudent.address?.pincode || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Banking Details */}
                {(dossierTab === "all" || dossierTab === "bank") && (
                  <div className="card p-5 border border-slate-200/80 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <Building className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        5. Banking & Welfare Details
                      </h4>
                    </div>
                    {selectedStudent.bankDetails?.accountNumber ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Account Holder Name</span>
                          <span className="font-bold text-slate-900">
                            {selectedStudent.bankDetails.accountHolderName || selectedStudent.personal?.name}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Bank Name</span>
                          <span className="font-bold text-slate-900">
                            {selectedStudent.bankDetails.bankName || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Account Number</span>
                          <span className="font-mono font-bold text-slate-900">
                            {selectedStudent.bankDetails.accountNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">IFSC Code</span>
                          <span className="font-mono font-bold text-slate-900">
                            {selectedStudent.bankDetails.ifscCode || "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No bank account details provided during admission application.
                      </p>
                    )}
                  </div>
                )}

                {/* 6. Academic Progression & Promotion History */}
                {(dossierTab === "all" || dossierTab === "history") && (
                  <div className="card p-5 border border-slate-200/80 bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        6. Academic History & Progression Timeline
                      </h4>
                    </div>

                    {historyLoading ? (
                      <div className="py-6 text-center text-xs text-slate-400 animate-pulse">
                        Loading academic progression history...
                      </div>
                    ) : academicHistory.length > 0 ? (
                      <div className="space-y-3">
                        {academicHistory.map((h, idx) => (
                          <div
                            key={h._id || idx}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">
                                {h.passedOutBatch ? (
                                  <span className="text-purple-700">
                                    🎓 Graduated / Passed Out (Batch: {h.passedOutBatch})
                                  </span>
                                ) : (
                                  <span>
                                    Promoted: Class {h.oldClass || "—"} → Class {h.newClass}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Session: {h.newSession || h.oldSession || "—"} • Actioned by:{" "}
                                {h.promotedBy?.name || "School Administrator"}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(h.promotedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Student currently in initial enrollment session ({selectedStudent.academic?.sessionName || "2026-2027"}). No prior promotion records yet.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Dossier Bottom Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
                <div className="flex items-center gap-2">
                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => openResetStudentPwdModal(selectedStudent)}
                        className="btn py-2 px-3 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold flex items-center gap-1.5 transition-all"
                        title="Reset Student Portal Password"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Reset Password
                      </button>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="btn py-2 px-3 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Record
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedStudent(null);
                    }}
                    className="btn btn-secondary py-2 px-5 text-xs font-bold"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MARK AS PASSED OUT CONFIRMATION MODAL                    */}
        {/* ======================================================== */}
        {isPassOutModalOpen && studentToPassOut && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
              <div className="flex items-center gap-3 text-purple-700 mb-4">
                <div className="p-3 bg-purple-100 rounded-2xl border border-purple-200">
                  <GraduationCap className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Mark as Passed Out</h3>
                  <p className="text-xs text-slate-500">Archive student to Alumni Registry</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                You are about to mark student{" "}
                <strong className="text-slate-900">{studentToPassOut.personal?.name}</strong> (ID:{" "}
                {studentToPassOut.studentId}, Class {studentToPassOut.academic?.class}) as{" "}
                <span className="text-purple-700 font-bold">Passed Out</span>. This student will be moved to the dedicated Alumni Registry.
              </p>

              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Passing Out Batch / Session *
                </label>
                <select
                  value={passOutSession}
                  onChange={(e) => setPassOutSession(e.target.value)}
                  className="input w-full font-bold text-sm"
                >
                  {sessions.map((s) => (
                    <option key={s._id} value={s.sessionName}>
                      Batch {s.sessionName}
                    </option>
                  ))}
                  <option value="2025-2026">Batch 2025-2026</option>
                  <option value="2026-2027">Batch 2026-2027</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPassOutModalOpen(false)}
                  className="btn btn-secondary flex-1 text-xs py-2.5 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPassOut}
                  disabled={submitting}
                  className="btn btn-primary flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs py-2.5 shadow-md"
                >
                  {submitting ? "Archiving..." : "Confirm Pass Out"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PROMOTE COHORT MODAL                                      */}
        {/* ======================================================== */}
        {isPromoteModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Promote Students Cohort</h2>
                </div>
                <button
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handlePromoteSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Current Class
                    </label>
                    <select
                      value={promoteSourceClass}
                      onChange={(e) => handleSourceClassChange(e.target.value)}
                      className="input w-full font-bold"
                    >
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          Class {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Target Class / Status
                    </label>
                    {promoteSourceClass === "10" ? (
                      <div className="p-2.5 bg-purple-100 text-purple-900 font-bold rounded-xl text-sm border border-purple-200">
                        Graduate (Passed Out)
                      </div>
                    ) : (
                      <select
                        value={promoteTargetClass}
                        onChange={(e) => setPromoteTargetClass(e.target.value)}
                        className="input w-full font-bold"
                      >
                        {availableClasses.map((cls) => (
                          <option key={cls} value={cls}>
                            Class {cls}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      New Session
                    </label>
                    <input
                      type="text"
                      required
                      value={promoteTargetSession}
                      onChange={(e) => setPromoteTargetSession(e.target.value)}
                      placeholder="e.g. 2026-2027"
                      className="input w-full font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-800">
                      Eligible Students in Class {promoteSourceClass} ({eligibleStudentsForPromote.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllPromote}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {selectedStudentIds.length === eligibleStudentsForPromote.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
                    {eligibleStudentsForPromote.map((student) => {
                      const isSelected = selectedStudentIds.includes(student._id);
                      return (
                        <div
                          key={student._id}
                          onClick={() => handleToggleStudentSelection(student._id)}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-sm text-slate-900">
                              {student.personal?.name}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              (Adm: {student.admissionNo})
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {student.studentId}
                          </span>
                        </div>
                      );
                    })}
                    {eligibleStudentsForPromote.length === 0 && (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        No active students found currently enrolled in Class {promoteSourceClass}.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPromoteModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || selectedStudentIds.length === 0}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting
                      ? "Promoting..."
                      : `Promote (${selectedStudentIds.length}) Students`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DELETE CONFIRMATION MODAL                                */}
        {/* ======================================================== */}
        {isDeleteModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Student Record</h3>
                  <p className="text-xs text-slate-500">Super Admin action</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to permanently delete student{" "}
                <strong className="text-slate-900">{selectedStudent.personal?.name}</strong> (
                {selectedStudent.studentId})? This will also remove academic history records.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  disabled={submitting}
                  className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {submitting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* EDIT STUDENT MODAL                                       */}
        {/* ======================================================== */}
        {isEditStudentModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Edit Student Record</h2>
                </div>
                <button
                  onClick={() => setIsEditStudentModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleEditStudentSubmit} className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editStudentForm.name}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={editStudentForm.mobile}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, mobile: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={editStudentForm.gender}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value })}
                        className="input w-full capitalize"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editStudentForm.dob}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, dob: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Blood Group
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. O+, A+, B+"
                        value={editStudentForm.bloodGroup}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, bloodGroup: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Aadhaar Number
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.aadhaar}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, aadhaar: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Academic Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Class
                      </label>
                      <select
                        value={editStudentForm.class}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, class: e.target.value })}
                        className="input w-full font-bold"
                      >
                        {availableClasses.map((cls) => (
                          <option key={cls} value={cls}>
                            Class {cls}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Section
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. A"
                        value={editStudentForm.section}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, section: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Roll Number
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editStudentForm.rollNo}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, rollNo: Number(e.target.value) })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enrollment Status
                      </label>
                      <select
                        value={editStudentForm.status}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, status: e.target.value })}
                        className="input w-full font-semibold capitalize"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="transferred">Transferred</option>
                        <option value="passed_out">Passed Out</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Parents & Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Father's Name
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.fatherName}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, fatherName: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mother's Name
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.motherName}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, motherName: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.guardian}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, guardian: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Parent Mobile
                      </label>
                      <input
                        type="tel"
                        value={editStudentForm.parentMobile}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, parentMobile: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Village / Street
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.village}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, village: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.district}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, district: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.pincode}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, pincode: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditStudentModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting ? "Saving..." : "Save Student Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STUDENT ID CARD MODAL                                    */}
        {/* ======================================================== */}
        {isIdCardModalOpen && studentForIdCard && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in print:bg-transparent print:p-0">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-200 print:border-none print:shadow-none print:bg-transparent">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center print:hidden">
                <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  Official Student Identity Card
                </span>
                <button
                  onClick={() => setIsIdCardModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 print:p-0 flex justify-center">
                <div id="printable-id-card" className="w-[320px] rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl print:shadow-none bg-white flex flex-col">
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3 text-center border-b-2 border-amber-400">
                    <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                      Dulichand Sonadevi High School
                    </p>
                    <p className="text-[9px] text-slate-300">Ranamunduli, Basta, Balasore</p>
                    <span className="inline-block mt-1 bg-amber-400 text-slate-950 font-bold text-[9px] px-2 py-0.2 rounded-full uppercase tracking-widest">
                      Student ID Card
                    </span>
                  </div>

                  <div className="p-4 flex flex-col items-center space-y-3">
                    <div className="w-20 h-24 rounded-xl border-2 border-indigo-200 bg-slate-100 overflow-hidden shadow-inner flex items-center justify-center">
                      {studentForIdCard.personal?.photo ? (
                        <img
                          src={studentForIdCard.personal.photo}
                          alt={studentForIdCard.personal.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-indigo-400">
                          {studentForIdCard.personal?.name?.charAt(0) || "S"}
                        </div>
                      )}
                    </div>

                    <div className="text-center w-full">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {studentForIdCard.personal?.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                        Class {studentForIdCard.academic?.class}{" "}
                        {studentForIdCard.academic?.section ? `(${studentForIdCard.academic.section})` : ""}
                        {studentForIdCard.academic?.rollNo ? ` | Roll: ${studentForIdCard.academic.rollNo}` : ""}
                      </p>
                    </div>

                    <div className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Adm No:</span>
                        <span className="font-mono font-bold text-slate-900">{studentForIdCard.admissionNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Student ID:</span>
                        <span className="font-mono font-bold text-slate-900">{studentForIdCard.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Blood Group:</span>
                        <span className="font-bold text-red-600">{studentForIdCard.personal?.bloodGroup || "O+"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Parent Contact:</span>
                        <span className="font-bold text-slate-900">
                          {studentForIdCard.personal?.mobile || studentForIdCard.parents?.parentMobile}
                        </span>
                      </div>
                    </div>

                    <div className="w-full pt-1 flex flex-col items-center">
                      <div className="w-44 h-6 bg-slate-900 flex items-center justify-around px-1 rounded-sm">
                        <div className="w-0.5 h-4 bg-white" />
                        <div className="w-1 h-4 bg-white" />
                        <div className="w-0.5 h-4 bg-white" />
                        <div className="w-1.5 h-4 bg-white" />
                        <div className="w-0.5 h-4 bg-white" />
                        <div className="w-1 h-4 bg-white" />
                        <div className="w-2 h-4 bg-white" />
                        <div className="w-0.5 h-4 bg-white" />
                        <div className="w-1.5 h-4 bg-white" />
                        <div className="w-0.5 h-4 bg-white" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                        *{studentForIdCard.studentId}*
                      </span>
                    </div>

                    <div className="w-full flex justify-between items-end pt-2 text-[8px] text-slate-500 border-t border-slate-100">
                      <span>Card Holder</span>
                      <span className="font-bold text-slate-800">Principal Signature</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
                <button
                  onClick={() => setIsIdCardModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Print ID Card
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Super Admin Reset Student Password Modal */}
        {isResetPwdModalOpen && targetStudentForPwd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Key className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Super Admin Password Reset</h3>
                    <p className="text-xs text-amber-100">Override student portal password</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResetPwdModalOpen(false)}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminResetStudentPassword} className="p-6 space-y-4">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80">
                  <div className="text-xs font-bold text-amber-900 mb-0.5">
                    Target Student
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    {targetStudentForPwd.personal?.name}
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">
                    Admission No: {targetStudentForPwd.admissionNo} • Class: {targetStudentForPwd.academic?.class}-{targetStudentForPwd.academic?.section || "A"}
                  </div>
                </div>

                {resetPwdError && (
                  <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                    {resetPwdError}
                  </div>
                )}
                {resetPwdSuccess && (
                  <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                    {resetPwdSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Password for Student *
                  </label>
                  <input
                    type="text"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new student password (min 6 chars)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Student will immediately be able to log into the Student Portal with their Admission No and this new password.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResetPwdModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPwdLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{resetPwdLoading ? "Resetting..." : "Set Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
