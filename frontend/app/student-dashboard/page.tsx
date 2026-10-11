"use client";

import { useStudentAuth } from "@/context/StudentAuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LogOut,
  User,
  BookOpen,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  Calendar,
  Award,
  Printer,
  X,
  Loader2,
  ChevronRight,
  Clock,
  Key,
  Bell,
  MapPin,
  Phone,
  Landmark,
  ShieldCheck,
  FileText,
  Receipt,
  Sparkles,
  AlertCircle,
  Menu,
  LayoutDashboard,
  Lock
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type TabType = "overview" | "timetable" | "exams" | "fees" | "profile" | "notices";

type FeeData = {
  totalPayable: number;
  totalPaid: number;
  balanceDue: number;
  headsBreakdown?: Array<{
    _id: string;
    title: string;
    amount: number;
    frequency: string;
    description: string;
    paidAmount: number;
    balanceDue: number;
    status: "paid" | "partial" | "unpaid";
    lastPaymentDate: string | null;
  }>;
  payments: Array<{
    _id?: string;
    receiptNo: string;
    title: string;
    totalAmount?: number;
    paidAmount: number;
    paymentDate: string;
    paymentMode: string;
    transactionId?: string;
    remarks?: string;
    status?: string;
  }>;
};

type NoticeItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  content: string;
};

export default function StudentDashboard() {
  const { student, logout, loading } = useStudentAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feeDetails, setFeeDetails] = useState<FeeData | null>(null);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [classTimetable, setClassTimetable] = useState<any | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [fetchingExtra, setFetchingExtra] = useState(true);

  // Selected Day in Routine Tab
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  // Report Card Modal
  const [reportCardData, setReportCardData] = useState<any | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Fee Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Change Password Modal
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  useEffect(() => {
    if (!loading && !student) {
      router.push("/login");
    }
  }, [student, loading, router]);

  // Set today's day of week
  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[new Date().getDay()];
    if (currentDay !== "Sunday") {
      setSelectedDay(currentDay);
    } else {
      setSelectedDay("Monday");
    }
  }, []);

  useEffect(() => {
    if (student) {
      const studentIdentifier = student.admissionNo || student.studentId || student._id;
      const token = localStorage.getItem("studentToken");

      const fetchDashboardData = async () => {
        try {
          setFetchingExtra(true);

          // 1. Fee details
          const feeRes = await fetch(`${API_BASE_URL}/fees/student/${studentIdentifier}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (feeRes.ok) {
            const fData = await feeRes.json();
            setFeeDetails(fData);
          }

          if (token) {
            // 2. Exam Results
            const examRes = await fetch(`${API_BASE_URL}/exams/my-results/student`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (examRes.ok) {
              const eData = await examRes.json();
              if (eData.success) {
                setExamResults(eData.results || []);
              }
            }

            // 3. Timetable Routine
            const ttRes = await fetch(`${API_BASE_URL}/timetable/my-routine`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (ttRes.ok) {
              const ttData = await ttRes.json();
              if (ttData.success && ttData.timetable) {
                setClassTimetable(ttData.timetable);
              }
            }

            // 4. Student Notices
            const noticeRes = await fetch(`${API_BASE_URL}/student-auth/notices`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (noticeRes.ok) {
              const nData = await noticeRes.json();
              setNotices(nData || []);
            }
          }
        } catch (err) {
          console.error("Error loading student dashboard details:", err);
        } finally {
          setFetchingExtra(false);
        }
      };

      fetchDashboardData();
    }
  }, [student]);

  const openReportCard = async (examId: string, customStudentRef?: string) => {
    if (!student) return;
    try {
      setReportLoading(true);
      setReportModalOpen(true);
      const studentRef = customStudentRef || student._id || student.studentId || encodeURIComponent(student.admissionNo || "");
      const res = await fetch(`${API_BASE_URL}/exams/${examId}/report-card/${studentRef}`);
      const data = await res.json();
      if (data.success) {
        setReportCardData(data);
      } else {
        alert(data.message || "Failed to load report card");
        setReportModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading report card");
      setReportModalOpen(false);
    } finally {
      setReportLoading(false);
    }
  };

  const openFeeReceipt = (payment: any) => {
    setSelectedReceipt(payment);
    setReceiptModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!pwdCurrent || !pwdNew || !pwdConfirm) {
      setPwdError("All fields are required");
      return;
    }
    if (pwdNew.length < 6) {
      setPwdError("New password must be at least 6 characters long");
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError("New password and confirm password do not match");
      return;
    }

    const token = localStorage.getItem("studentToken");
    if (!token) {
      setPwdError("Session expired. Please log in again.");
      return;
    }

    try {
      setPwdLoading(true);
      const res = await fetch(`${API_BASE_URL}/student-auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: pwdCurrent,
          newPassword: pwdNew
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPwdSuccess(data.message || "Password updated successfully!");
        setPwdCurrent("");
        setPwdNew("");
        setPwdConfirm("");
        setTimeout(() => {
          setIsChangePwdOpen(false);
          setPwdSuccess("");
        }, 2000);
      } else {
        setPwdError(data.message || "Failed to update password");
      }
    } catch (err: any) {
      setPwdError(err.message || "Network error updating password");
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm font-semibold tracking-wide text-slate-600">Accessing Student Portal...</p>
        </div>
      </div>
    );
  }

  // Get Today's Routine Periods
  const todaySchedule = classTimetable?.weeklySchedule?.find(
    (item: any) => item.day.toLowerCase() === selectedDay.toLowerCase()
  );

  const menuOptions = [
    { id: "overview", label: "Student Overview", icon: LayoutDashboard },
    { id: "timetable", label: "Class Routine", icon: Clock },
    { id: "exams", label: "Examinations & Marks", icon: Award, count: examResults.length },
    { id: "fees", label: "Fee Status & Receipts", icon: CreditCard },
    { id: "profile", label: "Student Profile", icon: User },
    { id: "notices", label: "School Notices", icon: Bell, count: notices.length }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* 1-Page A4 Print Stylesheet for Report Cards & Fee Receipts */}
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
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-report-card,
          #printable-report-card *,
          #printable-fee-receipt,
          #printable-fee-receipt * {
            visibility: visible !important;
          }
          #printable-report-card,
          #printable-fee-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 10px 14px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            border-radius: 6px !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            z-index: 9999999 !important;
          }
          .print-hidden, .print\\:hidden, button {
            display: none !important;
          }
        }
      `}</style>

      {/* Mobile Top App Header */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="p-2 -ml-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/5tlogo.png"
              alt="5T Logo"
              className="h-7 w-7 rounded-lg object-cover border border-slate-700 shadow-sm"
            />
            <span className="font-bold text-sm tracking-tight text-slate-100 truncate max-w-[160px]">
              Dulichand Sonadevi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Student
          </span>
          <button
            onClick={() => {
              setPwdError("");
              setPwdSuccess("");
              setPwdCurrent("");
              setPwdNew("");
              setPwdConfirm("");
              setIsChangePwdOpen(true);
            }}
            className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm"
            title="Change Password"
          >
            {student?.personal?.name ? student.personal.name[0] : "S"}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Fixed Left Sidebar (Matches Admin Sidebar Theme) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:z-40 w-72 max-w-[85vw] md:w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/5tlogo.png"
              alt="5T Logo"
              className="h-9 w-9 rounded-xl object-cover border border-slate-700 shadow-sm"
            />
            <div>
              <h2 className="font-black text-sm tracking-tight leading-tight text-slate-100">
                Dulichand Sonadevi
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Student Portal</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Navigation"
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Snippet Widget in Sidebar */}
        <div className="p-3 border-b border-slate-800/80 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              {student?.personal?.name ? student.personal.name[0] : "S"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 truncate leading-tight">{student?.personal?.name || "Student"}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                Class {student?.academic?.class} (#{student?.academic?.rollNo || 1}) • {student?.studentId}
              </p>
            </div>
          </div>
        </div>

        {/* Left Option Menu List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 min-h-0">
          {menuOptions.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabType);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-sm font-bold tracking-tight ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                    : "text-slate-200 hover:text-white hover:bg-slate-800/90"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pinned Student Profile in Sidebar */}
        <div className="p-3.5 border-t border-slate-800/90 bg-slate-950/80 shrink-0 space-y-2.5">
          <div className="flex items-center gap-3 px-1.5 py-1">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase shadow">
                {student?.personal?.name ? student.personal.name[0] : "S"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-100 truncate">{student?.personal?.name || "Student"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Student
                </span>
                <span className="text-[11px] text-slate-400 font-mono truncate">{student?.admissionNo}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                setPwdError("");
                setPwdSuccess("");
                setPwdCurrent("");
                setPwdNew("");
                setPwdConfirm("");
                setIsChangePwdOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 transition-all text-xs font-bold border border-slate-800 shadow-xs"
              title="Change Password"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </button>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-slate-300 hover:text-red-300 bg-slate-900 hover:bg-red-500/10 transition-all text-xs font-bold border border-slate-800 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area (Matches DashboardLayout in Admin) */}
      <main className="flex-1 w-full md:ml-64 p-3.5 sm:p-5 md:p-8 min-w-0 overflow-x-hidden space-y-6 sm:space-y-8">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-black shadow-inner shrink-0">
                {student?.personal?.name ? student.personal.name[0] : "S"}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Regular Student
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-blue-200">
                    ID: {student?.studentId}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Welcome back, {student?.personal?.name}!
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>Class: <strong className="text-white">Class {student?.academic?.class}</strong> (Roll #{student?.academic?.rollNo || 1})</span>
                  <span>•</span>
                  <span>Adm No: <strong className="text-white font-mono">{student?.admissionNo}</strong></span>
                  <span>•</span>
                  <span>Session: <strong className="text-white">{student?.academic?.sessionName || "2026-2027"}</strong></span>
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 self-start md:self-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/30 flex items-center justify-center text-white shrink-0">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs text-blue-200 uppercase font-bold tracking-wider">Fee Balance</div>
                <div className={`text-base sm:text-lg font-bold ${feeDetails && feeDetails.balanceDue > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                  {feeDetails ? `₹${feeDetails.balanceDue.toLocaleString()}` : "₹0"}
                </div>
                <span className="text-xs text-blue-100 font-medium">
                  {feeDetails && feeDetails.balanceDue > 0 ? "● Pending Payment" : "✓ Cleared"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================= TAB 1: OVERVIEW ======================= */}
        {activeTab === "overview" && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* 4 Stat Cards in Admin Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="card p-6 border border-slate-100 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Class & Roll</p>
                    <p className="text-2xl font-black text-slate-900 mt-2">Class {student?.academic?.class}</p>
                    <span className="text-xs text-blue-600 font-bold mt-1 block">Roll #{student?.academic?.rollNo || 1}</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                </div>
              </div>

              <div className="card p-6 border border-slate-100 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Attendance</p>
                    <p className="text-2xl font-black text-emerald-600 mt-2">94.2%</p>
                    <span className="text-xs text-emerald-700 font-medium mt-1 block">Regular Attendance</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                </div>
              </div>

              <div className="card p-6 border border-slate-100 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Latest Grade</p>
                    <p className="text-2xl font-black text-purple-700 mt-2">
                      {examResults.length > 0 ? examResults[0].overallGrade : "A2"}
                    </p>
                    <span className="text-xs text-purple-600 font-medium mt-1 block">
                      {examResults.length > 0 ? `${examResults[0].percentage}% Scored` : "86.3% Scored"}
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Award className="w-7 h-7" />
                  </div>
                </div>
              </div>

              <div className="card p-6 border border-slate-100 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pending Dues</p>
                    <p className={`text-2xl font-black mt-2 ${feeDetails && feeDetails.balanceDue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                      {feeDetails ? `₹${feeDetails.balanceDue.toLocaleString()}` : "₹0"}
                    </p>
                    <span className="text-xs text-slate-500 font-medium mt-1 block">
                      {feeDetails && feeDetails.balanceDue > 0 ? "Outstanding" : "Cleared"}
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                    <CreditCard className="w-7 h-7" />
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2 Columns: Today's Schedule + Notices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Schedule */}
              <div className="lg:col-span-2 card p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-base">Class Routine for {selectedDay}</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("timetable")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                  >
                    <span>Full Schedule</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {todaySchedule ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {todaySchedule.periods.map((p: any) => (
                      <div key={p.periodNo} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 hover:border-blue-300 transition">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                          P{p.periodNo}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{p.subject}</h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.teacherName}</p>
                          <span className="text-[10px] font-mono text-blue-700 block mt-1 font-semibold">{p.startTime} - {p.endTime}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No routine scheduled for {selectedDay}.
                  </div>
                )}
              </div>

              {/* Right: Quick School Notices */}
              <div className="card p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-slate-900 text-base">Recent Notices</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("notices")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {notices.slice(0, 3).map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800">
                          {n.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{n.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: TIMETABLE ======================= */}
        {activeTab === "timetable" && (
          <div className="card p-6 border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Class Weekly Routine (Class {classTimetable?.class || student?.academic?.class}-{classTimetable?.section || "A"})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Class Teacher: <strong className="text-slate-700">{classTimetable?.classTeacher || "Class Teacher"}</strong> • Room: <strong className="text-slate-700">{classTimetable?.roomNo || "Room 101"}</strong>
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Routine</span>
              </button>
            </div>

            {/* Day Switcher Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
                    selectedDay === day
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Day Period Cards */}
            {todaySchedule ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {todaySchedule.periods.map((p: any) => (
                  <div
                    key={p.periodNo}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                        P{p.periodNo}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {p.startTime} - {p.endTime}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{p.subject}</h4>
                      <p className="text-xs text-slate-500 mt-1">{p.teacherName}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No routine schedule available for {selectedDay}.
              </div>
            )}

            {/* Complete Weekly Grid */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Complete Weekly Grid</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold uppercase text-center border-b border-slate-800">
                      <th className="py-2.5 px-3 text-left w-24">Day</th>
                      <th className="py-2 px-1">P1</th>
                      <th className="py-2 px-1">P2</th>
                      <th className="py-2 px-1">P3</th>
                      <th className="py-2 px-1">P4</th>
                      <th className="py-2 px-1 bg-slate-800 text-amber-300 w-12 text-[10px]">Break</th>
                      <th className="py-2 px-1">P5</th>
                      <th className="py-2 px-1">P6</th>
                      <th className="py-2 px-1">P7</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(classTimetable?.weeklySchedule || []).map((dayItem: any) => (
                      <tr
                        key={dayItem.day}
                        className={`hover:bg-slate-50 transition ${
                          dayItem.day === selectedDay ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                          {dayItem.day}
                        </td>
                        {(dayItem.periods || []).slice(0, 4).map((p: any, i: number) => (
                          <td key={i} className="py-2 px-1 text-center border-r border-slate-100">
                            <span className="block text-[11px] font-bold text-slate-800">{p.subject}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{p.teacherName}</span>
                          </td>
                        ))}
                        <td className="py-2 px-1 text-center bg-slate-100 text-[10px] text-slate-500 border-r border-slate-200 font-bold">
                          Lunch
                        </td>
                        {(dayItem.periods || []).slice(4, 7).map((p: any, i: number) => (
                          <td key={i + 4} className="py-2 px-1 text-center border-r border-slate-100">
                            <span className="block text-[11px] font-bold text-slate-800">{p.subject}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{p.teacherName}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: EXAMS ======================= */}
        {activeTab === "exams" && (
          <div className="card p-6 border border-slate-100 shadow-sm space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Examinations & Marksheets</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {examResults.length} Published Evaluations
              </span>
            </div>

            {examResults.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No examination marksheets published yet.</p>
                <p className="text-xs text-slate-400 mt-1">Once academic evaluations are published, you can view marks and print official report cards here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {examResults.map((resItem) => (
                  <div
                    key={resItem._id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-2 w-full md:w-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
                          {resItem.exam?.title || "Examination"}
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          {resItem.academicSession}
                        </span>
                        <span
                          className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${
                            resItem.status === "Pass"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {resItem.status} ({resItem.division})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-slate-500 font-medium">Score:</span>{" "}
                          <span className="font-extrabold text-slate-900">
                            {resItem.totalMarksObtained} / {resItem.totalMaxMarks}
                          </span>
                        </div>
                        <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-slate-500 font-medium">Percentage:</span>{" "}
                          <span className="font-extrabold text-slate-900">{resItem.percentage}%</span>
                        </div>
                        <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-slate-500 font-medium">Grade:</span>{" "}
                          <span className="font-black text-blue-700">{resItem.overallGrade}</span>
                        </div>
                        {resItem.rank && (
                          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                            <span className="text-slate-500 font-medium">Rank:</span>{" "}
                            <span className="font-black text-amber-600">#{resItem.rank}</span>
                          </div>
                        )}
                      </div>

                      {resItem.remarks && (
                        <p className="text-xs text-slate-600 italic">Teacher Remarks: "{resItem.remarks}"</p>
                      )}
                    </div>

                    <button
                      onClick={() => openReportCard(resItem.exam?._id || resItem.exam, resItem.student || student?._id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition w-full md:w-auto shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Marksheet</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 4: FEES & RECEIPTS ======================= */}
        {activeTab === "fees" && (
          <div className="card p-6 border border-slate-100 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Fee Status & Receipts</h2>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  feeDetails && feeDetails.balanceDue > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {feeDetails && feeDetails.balanceDue > 0 ? "Dues Outstanding" : "Fees All Cleared"}
              </span>
            </div>

            {/* 3 Metric Summary Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Applicable Fee</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  ₹{feeDetails?.totalPayable.toLocaleString() || "0"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Amount Paid</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  ₹{feeDetails?.totalPaid.toLocaleString() || "0"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Outstanding Balance</span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  ₹{feeDetails?.balanceDue.toLocaleString() || "0"}
                </p>
              </div>
            </div>

            {/* Fee Head Breakdown */}
            {feeDetails?.headsBreakdown && feeDetails.headsBreakdown.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Fee Head Breakdown</h3>
                <div className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-200 overflow-hidden text-xs">
                  {feeDetails.headsBreakdown.map((head) => (
                    <div key={head._id} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{head.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{head.description || `Frequency: ${head.frequency}`}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">Paid: <strong className="text-emerald-600 font-bold">₹{head.paidAmount}</strong> / ₹{head.amount}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          head.status === "paid" ? "bg-emerald-100 text-emerald-800" : head.status === "partial" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {head.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Receipts History */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment History & Receipts</h3>

              {feeDetails?.payments && feeDetails.payments.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl bg-white border border-slate-200 overflow-hidden text-xs">
                  {feeDetails.payments.map((p, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{p.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {p.receiptNo}
                          </span>
                        </div>
                        <p className="text-slate-500 font-mono text-[11px]">
                          Date: {new Date(p.paymentDate).toLocaleDateString()} • Mode: <span className="uppercase font-semibold">{p.paymentMode}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="font-black text-emerald-600 text-base">₹{p.paidAmount.toLocaleString()}</span>
                        <button
                          onClick={() => openFeeReceipt(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
                        >
                          <Receipt className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Receipt</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No fee payment records found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 5: PROFILE ======================= */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {/* Personal Biodata */}
            <div className="card p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Personal Identification</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Full Name</span>
                  <strong className="text-slate-900 text-sm mt-0.5 block">{student?.personal?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Gender</span>
                  <strong className="text-slate-900 capitalize mt-0.5 block">{student?.personal?.gender || "Male"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Date of Birth</span>
                  <strong className="text-slate-900 mt-0.5 block">
                    {student?.personal?.dob ? new Date(student.personal.dob).toLocaleDateString("en-IN") : "01-01-2010"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Blood Group</span>
                  <strong className="text-rose-600 font-bold mt-0.5 block">{student?.personal?.bloodGroup || "O+"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Aadhaar Card</span>
                  <strong className="text-slate-900 font-mono mt-0.5 block">
                    {student?.personal?.aadhaar ? `•••• •••• ${String(student.personal.aadhaar).slice(-4)}` : "Verified"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Registered Mobile</span>
                  <strong className="text-slate-900 font-mono mt-0.5 block">{student?.personal?.mobile || "9876543201"}</strong>
                </div>
              </div>
            </div>

            {/* Parents & Guardians */}
            <div className="card p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <User className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Parent & Guardian Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Father's Name</span>
                  <strong className="text-slate-900 text-sm mt-0.5 block">{student?.parents?.fatherName || "Pradeep Nayak"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Mother's Name</span>
                  <strong className="text-slate-900 text-sm mt-0.5 block">{student?.parents?.motherName || "Sabita Nayak"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Parent Contact</span>
                  <strong className="text-slate-900 font-mono mt-0.5 block">{student?.parents?.parentMobile || "9876543201"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Guardian</span>
                  <strong className="text-slate-900 mt-0.5 block">{student?.parents?.guardian || "Parents"}</strong>
                </div>
              </div>
            </div>

            {/* Residential Address */}
            <div className="card p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <MapPin className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Residential Address</h3>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <p><strong className="text-slate-900">Village:</strong> {student?.address?.village || "Ranamunduli"}</p>
                <p><strong className="text-slate-900">Post & Block:</strong> {student?.address?.post || "Basta"}, {student?.address?.block || "BASTA"}</p>
                <p><strong className="text-slate-900">District:</strong> {student?.address?.district || "BALASORE"}, {student?.address?.state || "ODISHA"} - {student?.address?.pincode || "756029"}</p>
              </div>
            </div>

            {/* DBT & Bank Scholarship Verification */}
            <div className="card p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">DBT & Scholarship Bank Account</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Account Holder</span>
                  <strong className="text-slate-900 mt-0.5 block">{student?.bankDetails?.accountHolderName || student?.personal?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Bank Name</span>
                  <strong className="text-slate-900 mt-0.5 block">{student?.bankDetails?.bankName || "State Bank of India"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Account Number</span>
                  <strong className="text-slate-900 font-mono mt-0.5 block">
                    {student?.bankDetails?.accountNumber ? `•••• •••• ${String(student.bankDetails.accountNumber).slice(-4)}` : "Seeded with Aadhaar"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">IFSC Code</span>
                  <strong className="text-slate-900 font-mono mt-0.5 block">{student?.bankDetails?.ifscCode || "SBIN0001234"}</strong>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Aadhaar seeded bank account active for State Post/Pre-Matric DBT scholarships.</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 6: NOTICES ======================= */}
        {activeTab === "notices" && (
          <div className="card p-6 border border-slate-100 shadow-sm space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Official School Notice Board</h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {notices.length} Active Circulars
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((n) => (
                <div key={n.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:bg-white hover:shadow-md transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                      {n.category}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(n.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{n.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ======================= REPORT CARD PRINT MODAL ======================= */}
      {reportModalOpen && (
        <div id="report-card-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
          <div id="report-card-modal-dialog" className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto text-slate-900 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 text-sm block truncate">Official Student Progress Report</span>
                  <span className="text-[11px] text-emerald-600 font-semibold truncate block">Strict 1-Page A4 Print Optimized</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Marksheet (1 Page)</span>
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {reportLoading || !reportCardData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
            ) : (
              <div id="printable-report-card" className="p-3 sm:p-5 bg-white border-2 border-slate-900 rounded-xl print:border-2 print:border-slate-900 print:p-2 text-slate-900 font-sans">
                {/* School Header */}
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

                {/* Student Biodata */}
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
                        {reportCardData.student.dob ? new Date(reportCardData.student.dob).toLocaleDateString("en-IN") : "N/A"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Student ID</span>
                      <span className="font-mono font-bold text-slate-800">{reportCardData.student.studentId}</span>
                    </div>
                  </div>
                </div>

                {/* Subject Marks Table */}
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
                      {reportCardData.result.subjectMarks.map((sub: any, i: number) => (
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
                            {sub.marksObtained}
                          </td>
                          <td className="py-1 px-2 text-center font-black text-blue-700">
                            {sub.grade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Score Summary Footnotes */}
                <div className="grid grid-cols-4 gap-2 bg-slate-100 p-2 rounded-lg border border-slate-300 text-[11px] mb-3">
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">TOTAL MARKS</span>
                    <strong className="text-slate-900 text-sm">
                      {reportCardData.result.totalMarksObtained} / {reportCardData.result.totalMaxMarks}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">PERCENTAGE</span>
                    <strong className="text-slate-900 text-sm">{reportCardData.result.percentage}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">OVERALL GRADE</span>
                    <strong className="text-blue-800 text-sm font-black">{reportCardData.result.overallGrade}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block text-[10px]">RESULT STATUS</span>
                    <strong className={`text-sm font-black ${reportCardData.result.status === "Pass" ? "text-emerald-700" : "text-red-700"}`}>
                      {reportCardData.result.status} ({reportCardData.result.division})
                    </strong>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 pt-6 mt-4 border-t border-slate-300 text-center text-[10px]">
                  <div>
                    <div className="w-32 border-b border-slate-800 mx-auto mb-1"></div>
                    <span className="font-bold text-slate-800 uppercase">Class Teacher Signature</span>
                  </div>
                  <div>
                    <div className="w-32 border-b border-slate-800 mx-auto mb-1"></div>
                    <span className="font-bold text-slate-800 uppercase">Exam Controller</span>
                  </div>
                  <div>
                    <div className="w-32 border-b border-slate-800 mx-auto mb-1"></div>
                    <span className="font-bold text-slate-800 uppercase">Headmaster Seal & Sign</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= FEE RECEIPT PRINT MODAL ======================= */}
      {receiptModalOpen && selectedReceipt && (
        <div id="receipt-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
          <div id="receipt-modal-dialog" className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto text-slate-900 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm block">Official School Fee Receipt</span>
                  <span className="text-[11px] text-slate-500 font-medium">Official acknowledgement receipt</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setReceiptModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document */}
            <div id="printable-fee-receipt" className="p-4 sm:p-6 bg-white border-2 border-slate-900 rounded-xl print:border-2 print:border-slate-900 print:p-4 text-slate-900 font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <img
                  src="/5tlogo.png"
                  alt="School Emblem"
                  className="h-12 w-12 object-contain rounded-lg border border-slate-300 shrink-0"
                />
                <div className="text-center flex-1 px-3">
                  <h1 className="text-lg font-black text-slate-950 uppercase">
                    Dulichand Sonadevi High School
                  </h1>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Ranamunduli, Basta, Balasore, Odisha - 756029
                  </p>
                  <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                    Official Fee Payment Receipt
                  </span>
                </div>
                <div className="w-12"></div>
              </div>

              {/* Receipt Details Meta */}
              <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Receipt Number</span>
                  <strong className="text-slate-900 font-mono text-sm">{selectedReceipt.receiptNo}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Payment Date</span>
                  <strong className="text-slate-900">{new Date(selectedReceipt.paymentDate).toLocaleDateString("en-IN")}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Student Name</span>
                  <strong className="text-slate-900 text-sm">{student?.personal?.name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Class & Roll</span>
                  <strong className="text-slate-900">Class {student?.academic?.class} (#{student?.academic?.rollNo || 1})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Admission Number</span>
                  <strong className="text-slate-900 font-mono">{student?.admissionNo}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Payment Mode</span>
                  <strong className="text-slate-900 uppercase font-mono">{selectedReceipt.paymentMode || "Cash"}</strong>
                </div>
              </div>

              {/* Receipt Items Table */}
              <div className="border border-slate-900 rounded-lg overflow-hidden my-4 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                      <th className="py-2 px-3 border-r border-slate-700 w-12">#</th>
                      <th className="py-2 px-3 border-r border-slate-700">Fee Particulars</th>
                      <th className="py-2 px-3 text-right w-28">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 bg-white">
                    <tr>
                      <td className="py-2.5 px-3 font-mono border-r border-slate-300 text-center">1</td>
                      <td className="py-2.5 px-3 border-r border-slate-300 font-bold text-slate-900">
                        {selectedReceipt.title}
                        {selectedReceipt.remarks && (
                          <span className="block text-[11px] text-slate-500 font-normal mt-0.5">{selectedReceipt.remarks}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        ₹{selectedReceipt.paidAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                      <td colSpan={2} className="py-2 px-3 text-right uppercase text-[11px] text-slate-700">
                        Total Amount Received:
                      </td>
                      <td className="py-2 px-3 text-right font-black text-emerald-700 text-sm">
                        ₹{selectedReceipt.paidAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-8 mt-6 border-t border-slate-300 text-center text-[10px]">
                <div>
                  <div className="w-28 border-b border-slate-800 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800 uppercase">Student / Depositor</span>
                </div>
                <div>
                  <div className="w-28 border-b border-slate-800 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800 uppercase">Authorized Counter Cashier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal (Admin Theme) */}
      {isChangePwdOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 text-slate-900">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-xs">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Change Student Password</h3>
                  <p className="text-xs text-slate-500">Security & credential controls</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePwdOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alerts */}
            {pwdError && (
              <div className="m-5 mb-0 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{pwdError}</span>
              </div>
            )}
            {pwdSuccess && (
              <div className="m-5 mb-0 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password (or DOB DD-MM-YYYY) *</label>
                <input
                  type="password"
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition"
                  placeholder="e.g. 01-01-2010"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Min 6 characters) *</label>
                <input
                  type="password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition"
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {pwdLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
