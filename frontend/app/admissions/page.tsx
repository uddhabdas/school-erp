"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Eye,
  CheckCircle,
  XCircle,
  GraduationCap,
  User,
  Users,
  MapPin,
  FileText,
  Loader2,
  CreditCard,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Building,
  Calendar,
  Phone,
  Inbox
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type Application = {
  _id: string;
  applicationId: string;
  status: string;
  student: {
    name: string;
    gender: string;
    dob: string;
    bloodGroup: string;
    aadhaar: string;
    mobile: string;
    photo?: string;
  };
  parents: {
    fatherName: string;
    motherName: string;
    guardian?: string;
    parentMobile: string;
  };
  address: {
    village: string;
    post: string;
    block: string;
    district: string;
    state: string;
    pincode: string;
  };
  academic: {
    sessionName: string;
    class: string;
    previousSchool?: string;
  };
  documents?: {
    photo?: string;
    aadhaar?: string;
    birthCertificate?: string;
    transferCertificate?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };
  createdAt: string;
  rejectionReason?: string;
};

type ApprovedStudentResult = {
  name: string;
  studentId: string;
  admissionNo: string;
  rollNo: number;
  class: string;
  defaultPassword: string;
};

export default function Admissions() {
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Document preview lightbox
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  // Rejection modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Approval result modal
  const [approvedResult, setApprovedResult] = useState<ApprovedStudentResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (classFilter !== "all") params.append("class", classFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`${API_BASE_URL}/admissions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load applications (${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setApplications(data);
      } else {
        setApplications([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token, filter, classFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Approve Enrollment (Super Admin Only)
  const handleApprove = async (id: string) => {
    if (!isSuperAdmin) {
      setError("Unauthorized: Only the Super Admin (Principal) has authorization to approve admissions and generate student IDs.");
      return;
    }

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admissions/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve application");

      setApprovedResult({
        name: data.personal?.name || "Student",
        studentId: data.studentId,
        admissionNo: data.admissionNo,
        rollNo: data.academic?.rollNo || data.rollNo || 1,
        class: data.academic?.class || "8",
        defaultPassword: data.defaultPassword || "DOB (DD-MM-YYYY)",
      });

      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "approved" } : a))
      );
      if (selectedApp?._id === id) {
        setSelectedApp({ ...selectedApp, status: "approved" });
      }
      setSuccess("Application successfully approved! Official student record and credentials generated.");
    } catch (err: any) {
      setError(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Verified (Admin or Super Admin)
  const handleVerify = async (id: string) => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admissions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "pending_verification" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to mark application as verified");

      setApplications((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "pending_verification" } : a))
      );
      if (selectedApp?._id === id) {
        setSelectedApp({ ...selectedApp, status: "pending_verification" });
      }
      setSuccess("Application marked as verified! Ready for Principal (Super Admin) approval.");
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Application
  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAppId) return;

    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admissions/${rejectingAppId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject application");

      setApplications((prev) =>
        prev.map((a) => (a._id === rejectingAppId ? { ...a, status: "rejected", rejectionReason } : a))
      );
      if (selectedApp?._id === rejectingAppId) {
        setSelectedApp({ ...selectedApp, status: "rejected", rejectionReason });
      }
      setSuccess("Application rejected.");
      setRejectingAppId(null);
      setRejectionReason("");
    } catch (err: any) {
      setError(err.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Submitted (Pending Review)
          </span>
        );
      case "pending_verification":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Verified (Awaiting Super Admin)
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved & Enrolled
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 capitalize">
            {status}
          </span>
        );
    }
  };

  // Calculate counts
  const totalCount = applications.length;
  const submittedCount = applications.filter((a) => a.status === "submitted").length;
  const pendingCount = applications.filter((a) => a.status === "pending_verification").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Admission Applications
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Verify student applications, inspect uploaded identity documents, and approve enrollment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchApplications}
              disabled={loading}
              className="btn btn-secondary flex items-center gap-2 py-2.5 px-3.5 text-xs font-semibold text-slate-700 shadow-sm"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/admissions/apply"
              className="btn btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-2.5 px-4 text-xs shadow-md hover:shadow-lg transition-all"
            >
              New Student Application
            </Link>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="p-1 hover:bg-rose-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="p-1 hover:bg-emerald-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setFilter("all")}
            className={`card p-4 border cursor-pointer transition-all ${
              filter === "all" ? "border-blue-500 shadow-md ring-2 ring-blue-500/20" : "border-slate-200/80 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applications</div>
                <div className="text-xl font-black text-slate-900">{totalCount}</div>
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilter("submitted")}
            className={`card p-4 border cursor-pointer transition-all ${
              filter === "submitted" ? "border-amber-500 shadow-md ring-2 ring-amber-500/20" : "border-slate-200/80 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">New Submissions</div>
                <div className="text-xl font-black text-amber-700">{submittedCount}</div>
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilter("pending_verification")}
            className={`card p-4 border cursor-pointer transition-all ${
              filter === "pending_verification" ? "border-blue-500 shadow-md ring-2 ring-blue-500/20" : "border-slate-200/80 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified (Ready)</div>
                <div className="text-xl font-black text-blue-700">{pendingCount}</div>
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilter("approved")}
            className={`card p-4 border cursor-pointer transition-all ${
              filter === "approved" ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20" : "border-slate-200/80 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Students</div>
                <div className="text-xl font-black text-emerald-700">{approvedCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="card p-4 border border-slate-200/80 bg-white shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            {/* Status Pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "submitted", label: "Submitted" },
                { id: "pending_verification", label: "Verified / Awaiting" },
                { id: "approved", label: "Approved" },
                { id: "rejected", label: "Rejected" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filter === tab.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="input text-xs font-semibold py-2 px-3 text-slate-700 w-36"
              >
                <option value="all">All Classes</option>
                <option value="8">Class 8</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
              </select>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student, ID, mobile, or parent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-9 pr-8 w-full text-xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="card py-20 flex flex-col items-center justify-center gap-3 border border-slate-200/80 bg-white">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading admission records...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => {
              const studentInitial = (app.student?.name || "S").charAt(0).toUpperCase();

              return (
                <div
                  key={app._id}
                  className="card p-5 hover:shadow-md transition-all border border-slate-200/80 bg-white"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Student Info Left */}
                    <div className="flex items-start gap-4">
                      {/* Avatar / Photo */}
                      {app.student?.photo ? (
                        <img
                          src={app.student.photo}
                          alt={app.student.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-black text-xl flex items-center justify-center border border-blue-200 shadow-sm">
                          {studentInitial}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-lg font-black text-slate-900">{app.student.name}</h3>
                          {getStatusBadge(app.status)}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {app.applicationId}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            Class {app.academic.class} ({app.academic.sessionName})
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {app.student.mobile}
                          </span>
                          <span>
                            Father: <strong className="text-slate-800">{app.parents?.fatherName || "-"}</strong>
                          </span>
                          <span className="text-slate-400">
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Right */}
                    <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="btn btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 text-slate-700"
                        title="View Full Application"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        Details
                      </button>

                      {/* Submitted status actions */}
                      {app.status === "submitted" && (
                        <>
                          {!isSuperAdmin && (
                            <button
                              onClick={() => handleVerify(app._id)}
                              disabled={actionLoading}
                              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all border border-blue-200 flex items-center gap-1.5"
                              title="Verify Documents for Principal Approval"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                              Mark Verified
                            </button>
                          )}

                          {isSuperAdmin ? (
                            <button
                              onClick={() => handleApprove(app._id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                              title="Super Admin: Approve & Generate Student Credentials"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve Enrollment
                            </button>
                          ) : (
                            <span
                              className="px-3 py-2 bg-slate-50 text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1"
                              title="Only the Principal (Super Admin) can approve enrollment"
                            >
                              <Shield className="w-3 h-3 text-slate-400" />
                              Approval Locked
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setRejectingAppId(app._id);
                              setRejectionReason("");
                            }}
                            disabled={actionLoading}
                            className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all border border-rose-200 flex items-center gap-1.5"
                            title="Reject Application"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Reject
                          </button>
                        </>
                      )}

                      {/* Pending Verification status actions */}
                      {app.status === "pending_verification" && (
                        <>
                          {isSuperAdmin ? (
                            <button
                              onClick={() => handleApprove(app._id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
                              title="Super Admin: Final Approve & Enroll"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Approve Enrollment
                            </button>
                          ) : (
                            <span
                              className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5"
                              title="Awaiting Principal review and enrollment authorization"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                              Awaiting Principal
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setRejectingAppId(app._id);
                              setRejectionReason("");
                            }}
                            disabled={actionLoading}
                            className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all border border-rose-200 flex items-center gap-1.5"
                            title="Reject Application"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {applications.length === 0 && (
              <div className="card text-center py-20 border border-slate-200/80 bg-white">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No applications found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There are no admission applications matching the selected criteria. Try changing the filter tab or class selector.
                </p>
              </div>
            )}
          </div>
        )}

        {/* View Application Details Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">{selectedApp.student.name}</h2>
                      {getStatusBadge(selectedApp.status)}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Application ID: <strong className="text-blue-700">{selectedApp.applicationId}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 hover:bg-slate-200/60 rounded-xl transition-all text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Authorization Notice for Admins */}
                {!isSuperAdmin && (selectedApp.status === "submitted" || selectedApp.status === "pending_verification") && (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <strong>Principal Approval Required:</strong> In accordance with school governance policies, official enrollment approval and student profile generation are reserved exclusively for the <strong>Super Admin (Principal)</strong>. Admins may review and mark documents as verified.
                    </div>
                  </div>
                )}

                {/* Personal Information */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    Student Personal Profile
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Full Name</span>
                      <strong className="text-slate-900 text-sm">{selectedApp.student.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Gender</span>
                      <strong className="text-slate-900 capitalize">{selectedApp.student.gender}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                      <strong className="text-slate-900">
                        {selectedApp.student.dob ? new Date(selectedApp.student.dob).toLocaleDateString() : "-"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Blood Group</span>
                      <strong className="text-slate-900">{selectedApp.student.bloodGroup || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Aadhaar Number</span>
                      <strong className="text-slate-900 font-mono">{selectedApp.student.aadhaar || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Mobile Contact</span>
                      <strong className="text-slate-900">{selectedApp.student.mobile}</strong>
                    </div>
                  </div>
                </div>

                {/* Academic Target */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    Target Academic Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Academic Session</span>
                      <strong className="text-slate-900">{selectedApp.academic.sessionName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Target Class</span>
                      <strong className="text-slate-900 font-black text-sm text-blue-700">
                        Class {selectedApp.academic.class}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Previous School</span>
                      <strong className="text-slate-900">{selectedApp.academic.previousSchool || "-"}</strong>
                    </div>
                  </div>
                </div>

                {/* Parent & Address Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      Parent / Guardian Information
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400">Father's Name:</span>{" "}
                        <strong className="text-slate-900">{selectedApp.parents?.fatherName || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Mother's Name:</span>{" "}
                        <strong className="text-slate-900">{selectedApp.parents?.motherName || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Guardian:</span>{" "}
                        <strong className="text-slate-900">{selectedApp.parents?.guardian || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Parent Mobile:</span>{" "}
                        <strong className="text-slate-900">{selectedApp.parents?.parentMobile || "-"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      Residential Address
                    </h3>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div>
                        <strong>Village / Street:</strong> {selectedApp.address?.village || "-"}
                      </div>
                      <div>
                        <strong>Post & Block:</strong> {selectedApp.address?.post || "-"},{" "}
                        {selectedApp.address?.block || "-"}
                      </div>
                      <div>
                        <strong>District & State:</strong> {selectedApp.address?.district || "-"},{" "}
                        {selectedApp.address?.state || "ODISHA"} - {selectedApp.address?.pincode || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents Inspection */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Uploaded Verification Documents
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {[
                      { key: "photo", label: "Passport Photo", url: selectedApp.documents?.photo || selectedApp.student?.photo },
                      { key: "aadhaar", label: "Aadhaar Card", url: selectedApp.documents?.aadhaar },
                      { key: "birthCertificate", label: "Birth Certificate", url: selectedApp.documents?.birthCertificate },
                      { key: "transferCertificate", label: "Transfer Certificate (TC)", url: selectedApp.documents?.transferCertificate },
                    ].map((doc) => (
                      <div
                        key={doc.key}
                        className="p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col justify-between"
                      >
                        <div className="font-semibold text-slate-800 text-[11px] mb-2">{doc.label}</div>
                        {doc.url ? (
                          <div className="space-y-2">
                            <img
                              src={doc.url}
                              alt={doc.label}
                              className="w-full h-24 object-cover rounded-lg border border-slate-100 cursor-pointer hover:opacity-90"
                              onClick={() => setPreviewDoc({ title: doc.label, url: doc.url! })}
                            />
                            <button
                              onClick={() => setPreviewDoc({ title: doc.label, url: doc.url! })}
                              className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Inspect Document
                            </button>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-slate-300 italic text-[11px] bg-slate-50 rounded-lg">
                            Not Uploaded
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Details */}
                {selectedApp.bankDetails && selectedApp.bankDetails.accountNumber && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-slate-600" />
                      Scholarship Bank Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Bank Name</span>
                        <strong className="text-slate-800">{selectedApp.bankDetails.bankName || "-"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Account Number</span>
                        <strong className="text-slate-800 font-mono">
                          {selectedApp.bankDetails.accountNumber || "-"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">IFSC Code</span>
                        <strong className="text-slate-800 font-mono">
                          {selectedApp.bankDetails.ifscCode || "-"}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Reason Display if Rejected */}
                {selectedApp.rejectionReason && (
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                    <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                      Reason for Rejection
                    </h4>
                    <p className="text-xs text-rose-700">{selectedApp.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="btn btn-secondary px-4 py-2 text-xs font-semibold"
                >
                  Close Window
                </button>

                <div className="flex items-center gap-2">
                  {(selectedApp.status === "submitted" || selectedApp.status === "pending_verification") && (
                    <>
                      <button
                        onClick={() => {
                          setRejectingAppId(selectedApp._id);
                          setRejectionReason("");
                        }}
                        className="btn bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold border border-rose-200 px-4 py-2"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Reject
                      </button>

                      {!isSuperAdmin && selectedApp.status === "submitted" && (
                        <button
                          onClick={() => handleVerify(selectedApp._id)}
                          disabled={actionLoading}
                          className="btn bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Mark Verified
                        </button>
                      )}

                      {isSuperAdmin ? (
                        <button
                          onClick={() => handleApprove(selectedApp._id)}
                          disabled={actionLoading}
                          className="btn bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve Enrollment
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic bg-white px-3 py-2 rounded-xl border border-slate-200">
                          Super Admin approval required
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Lightbox Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900">{previewDoc.title}</h3>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-slate-100 rounded-2xl p-2 flex items-center justify-center max-h-[70vh] overflow-auto">
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[65vh] w-auto object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {rejectingAppId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
              <div className="p-6 border-b border-slate-100 bg-rose-50/50">
                <div className="flex items-center gap-3 text-rose-700">
                  <div className="p-2.5 bg-rose-100 rounded-2xl">
                    <XCircle className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-rose-900">Reject Application</h3>
                    <p className="text-xs text-rose-600">Provide official rejection justification</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRejectConfirm} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Reason for Rejection *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete documentation, age criteria not met, invalid Aadhaar details..."
                    className="input w-full text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectingAppId(null)}
                    className="btn btn-secondary px-4 py-2 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="btn bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2 shadow-sm"
                  >
                    {actionLoading ? "Processing..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enrollment Approval Success Modal */}
        {approvedResult && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h3 className="text-xl font-black text-slate-900">Student Enrolled Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Official student profile created for Dulichand Sonadevi High School
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2.5 border border-slate-200 mb-6 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <strong className="text-slate-900 font-bold">{approvedResult.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-mono font-bold text-blue-700">{approvedResult.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission No:</span>
                  <span className="font-mono font-bold text-slate-900">{approvedResult.admissionNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class & Roll No:</span>
                  <strong className="text-slate-900">
                    Class {approvedResult.class} — Roll #{approvedResult.rollNo}
                  </strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500 flex items-center gap-1 font-semibold">
                    <Key className="w-3.5 h-3.5 text-amber-600" /> Default Password:
                  </span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {approvedResult.defaultPassword}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() =>
                    handleCopy(
                      `Student: ${approvedResult.name}\nStudent ID: ${approvedResult.studentId}\nAdmission No: ${approvedResult.admissionNo}\nClass: ${approvedResult.class} (Roll #${approvedResult.rollNo})\nPassword: ${approvedResult.defaultPassword}`,
                      "credentials"
                    )
                  }
                  className="btn btn-secondary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  {copiedKey === "credentials" ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" /> Credentials Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Student Credentials
                    </>
                  )}
                </button>

                <button
                  onClick={() => setApprovedResult(null)}
                  className="btn btn-primary w-full bg-slate-900 text-white font-bold py-2.5 text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
