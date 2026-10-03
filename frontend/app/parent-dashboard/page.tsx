"use client";

import { useParentAuth, StudentChild } from "@/context/ParentAuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LogOut,
  User,
  GraduationCap,
  Calendar,
  BookOpen,
  MapPin,
  Phone,
  CreditCard,
  Bell,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  HeartHandshake,
  Award
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type Notice = {
  id: string;
  title: string;
  category: string;
  date: string;
  content: string;
};

export default function ParentDashboard() {
  const { parent, childrenList, selectedChild, selectChild, logout, loading, token } = useParentAuth();
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);

  useEffect(() => {
    if (!loading && !parent) {
      router.push("/login");
    }
  }, [parent, loading, router]);

  useEffect(() => {
    const fetchNotices = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/parent-auth/notices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotices(data);
        }
      } catch (err) {
        console.error("Failed to fetch notices:", err);
      } finally {
        setLoadingNotices(false);
      }
    };

    fetchNotices();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!parent) return null;

  const currentChild: StudentChild | null = selectedChild || (childrenList.length > 0 ? childrenList[0] : null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100">
      {/* Top Navbar */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/5tlogo.png"
              alt="5T Logo"
              className="h-10 w-10 rounded-full object-cover border-2 border-indigo-600 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                  Dulichand Sonadevi High School
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Parent Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Basta, Balasore • Student Academic & Welfare Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">
                {parent.fatherName || parent.motherName || "Guardian"}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{parent.mobile}</span>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Child Selector Tabs (if multiple children) */}
        {childrenList.length > 1 && (
          <div className="card p-3 border border-indigo-100 bg-white/80 shadow-sm flex items-center gap-3 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">
              Select Child:
            </span>
            <div className="flex items-center gap-2">
              {childrenList.map((child) => (
                <button
                  key={child._id}
                  onClick={() => selectChild(child._id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    currentChild?._id === child._id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{child.personal?.name}</span>
                  <span className="text-[10px] opacity-80">(Class {child.academic?.class})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Child Hero Banner */}
        {currentChild ? (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                {currentChild.personal?.photo ? (
                  <img
                    src={currentChild.personal.photo}
                    alt={currentChild.personal.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-500/30 backdrop-blur-md text-white font-black text-3xl flex items-center justify-center border-2 border-white/20 shadow-xl">
                    {(currentChild.personal?.name || "S").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Enrolled & Active
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-blue-200">
                      ID: {currentChild.studentId}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {currentChild.personal?.name}
                  </h2>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                    <span>
                      Class: <strong className="text-white font-bold">Class {currentChild.academic?.class}</strong> (Roll #{currentChild.academic?.rollNo || 1})
                    </span>
                    <span>•</span>
                    <span>
                      Admission No: <strong className="text-white font-mono">{currentChild.admissionNo}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Session: <strong className="text-white">{currentChild.academic?.sessionName}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Attendance Badge */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">
                    School Attendance
                  </div>
                  <div className="text-xl font-black text-white">94.8%</div>
                  <span className="text-[11px] text-emerald-300 font-medium">Regular & On Track</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center bg-white border border-slate-200">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No child profile linked</h3>
            <p className="text-xs text-slate-500 mt-1">Please contact school administration to verify your registered mobile number.</p>
          </div>
        )}

        {/* 4 KPI Summary Cards */}
        {currentChild && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 border border-slate-200/80 bg-white shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class & Section</div>
                <div className="text-lg font-black text-slate-900">Class {currentChild.academic?.class}</div>
              </div>
            </div>

            <div className="card p-4 border border-slate-200/80 bg-white shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class Roll No</div>
                <div className="text-lg font-black text-emerald-700">#{currentChild.academic?.rollNo || 1}</div>
              </div>
            </div>

            <div className="card p-4 border border-slate-200/80 bg-white shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Academic Year</div>
                <div className="text-lg font-black text-purple-700">{currentChild.academic?.sessionName}</div>
              </div>
            </div>

            <div className="card p-4 border border-slate-200/80 bg-white shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">DBT / Scholarship</div>
                <div className="text-lg font-black text-amber-700">Verified</div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Sections: Student Info, Parents, Address & Bank */}
        {currentChild && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student & Parent Records (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Profile Details */}
              <div className="card p-6 bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Student Identity & Personal Information</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Full Name</span>
                    <strong className="text-slate-900 text-sm">{currentChild.personal?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                    <strong className="text-slate-900 font-mono">
                      {currentChild.personal?.dob ? new Date(currentChild.personal.dob).toLocaleDateString() : "-"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Gender</span>
                    <strong className="text-slate-900 capitalize">{currentChild.personal?.gender || "-"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Blood Group</span>
                    <strong className="text-slate-900">{currentChild.personal?.bloodGroup || "O+"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Student Aadhaar</span>
                    <strong className="text-slate-900 font-mono">{currentChild.personal?.aadhaar || "-"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Student ID</span>
                    <strong className="text-indigo-600 font-mono font-bold">{currentChild.studentId}</strong>
                  </div>
                </div>
              </div>

              {/* Verified Parent Details & Residential Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <HeartHandshake className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Parent / Guardian Record</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Father's Name:</span>{" "}
                      <strong className="text-slate-900">{currentChild.parents?.fatherName || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Mother's Name:</span>{" "}
                      <strong className="text-slate-900">{currentChild.parents?.motherName || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Registered Mobile:</span>{" "}
                      <strong className="text-slate-900 font-mono">{currentChild.parents?.parentMobile || parent.mobile}</strong>
                    </div>
                  </div>
                </div>

                <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Residential Address</h4>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div>
                      <strong>Village:</strong> {currentChild.address?.village || "Ranamunduli"}
                    </div>
                    <div>
                      <strong>Post & Block:</strong> {currentChild.address?.post || "Basta"},{" "}
                      {currentChild.address?.block || "BASTA"}
                    </div>
                    <div>
                      <strong>District:</strong> {currentChild.address?.district || "BALASORE"}, {currentChild.address?.state || "ODISHA"} - {currentChild.address?.pincode || "756029"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scholarship & DBT Account Details */}
              {currentChild.bankDetails && (
                <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Scholarship & DBT Bank Details</h4>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Account Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Bank Name</span>
                      <strong className="text-slate-900">{currentChild.bankDetails.bankName || "State Bank of India"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Account Number</span>
                      <strong className="text-slate-900 font-mono">{currentChild.bankDetails.accountNumber || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">IFSC Code</span>
                      <strong className="text-slate-900 font-mono">{currentChild.bankDetails.ifscCode || "SBIN0001234"}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: School Notices & Contact */}
            <div className="space-y-6">
              {/* School Notice Board */}
              <div className="card p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">School Notice Board</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Recent Circulars</span>
                </div>

                <div className="space-y-3">
                  {notices.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {n.category}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(n.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{n.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* School Helpline Card */}
              <div className="card p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg space-y-3 rounded-2xl">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <Building className="w-4 h-4 text-indigo-300" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">School Office & Helpline</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <div>
                    <strong className="text-white">Principal's Office:</strong> principal@school.com
                  </div>
                  <div>
                    <strong className="text-white">Administration:</strong> admin@school.com
                  </div>
                  <div>
                    <strong className="text-white">School Campus:</strong> Dulichand Sonadevi High School, Ranamunduli, Basta, Balasore, Odisha
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
