"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Printer,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Award,
  UserCheck,
  Calendar,
  Building,
  RefreshCw,
  Ban
} from "lucide-react";

interface Certificate {
  _id: string;
  certificateType: "transfer_certificate" | "bonafide" | "character";
  certificateNo: string;
  bookNo: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  fatherName?: string;
  motherName?: string;
  nationality: string;
  category: string;
  dob?: string;
  dobInWords?: string;
  admissionDate?: string;
  admissionClass?: string;
  currentClass: string;
  section?: string;
  academicSession: string;
  lastExamPassed?: string;
  whetherFailedOnce?: boolean;
  subjectsStudied?: string[];
  qualifiedForPromotion?: string;
  monthUptoDuesPaid?: string;
  feeConcession?: string;
  totalAttendanceDays?: number;
  totalWorkingDays?: number;
  nccCadetOrScout?: string;
  generalConduct?: string;
  dateOfApplication?: string;
  dateOfIssue: string;
  reasonForLeaving?: string;
  remarks?: string;
  status: "active" | "cancelled";
  issuedBy?: {
    name: string;
    email: string;
  };
}

export default function CertificatesPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"register" | "issue">("register");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Issue Form State
  const [studentLookupId, setStudentLookupId] = useState("");
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [issuing, setIssuing] = useState(false);

  const [form, setForm] = useState({
    certificateType: "transfer_certificate",
    reasonForLeaving: "Completed High School Certificate Examination (Passed Out)",
    generalConduct: "Good & Exemplary",
    lastExamPassed: "Class 10 High School Board Examination",
    qualifiedForPromotion: "Yes, Qualified for Higher Secondary / College Studies",
    monthUptoDuesPaid: "All school dues cleared up to date",
    totalAttendanceDays: 215,
    totalWorkingDays: 240,
    remarks: "A sincere, obedient, and diligent pupil. We wish them all success in life.",
    updateStudentStatus: true
  });

  // Print Modal
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("certificateType", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`${API_BASE_URL}/certificates?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCertificates();
  }, [token, typeFilter, statusFilter]);

  // Lookup student for issuing certificate
  const handleStudentLookup = async () => {
    if (!studentLookupId.trim()) return;
    try {
      setLookingUp(true);
      setLookupError("");
      setFoundStudent(null);

      const res = await fetch(`${API_BASE_URL}/students/search?q=${encodeURIComponent(studentLookupId.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.students || [];

      if (list.length > 0) {
        setFoundStudent(list[0]);
      } else {
        setLookupError("No student found with this Admission No or Student ID");
      }
    } catch (err) {
      console.error(err);
      setLookupError("Error searching student record");
    } finally {
      setLookingUp(false);
    }
  };

  // Submit Issue Certificate
  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundStudent) {
      alert("Please search and select a student first");
      return;
    }

    try {
      setIssuing(true);
      const res = await fetch(`${API_BASE_URL}/certificates/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentIdentifier: foundStudent.admissionNo || foundStudent.studentId || foundStudent._id,
          ...form
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setActiveTab("register");
        setSelectedCert(data.certificate);
        setIsPrintModalOpen(true);
        fetchCertificates();
        // Reset form
        setFoundStudent(null);
        setStudentLookupId("");
      } else {
        alert(data.message || "Failed to issue certificate");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setIssuing(false);
    }
  };

  // Cancel / Revoke Certificate
  const handleCancelCert = async (certId: string, certNo: string) => {
    if (!confirm(`Are you sure you want to cancel certificate ${certNo}? This action is irreversible.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/certificates/${certId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchCertificates();
      } else {
        alert(data.message || "Failed to cancel");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 p-7 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                    Administrative Certificates
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200">
                    Govt. of Odisha Format
                  </span>
                </div>
                <h1 className="text-3xl font-black tracking-tight">Transfer & Bonafide Certificates</h1>
                <p className="text-slate-300 mt-1 text-sm max-w-xl">
                  Issue official Transfer Certificates (TC), Bonafide certificates, and Character certificates with sequential serial numbers and A4 print layout.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab("issue")}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Issue New Certificate
                </button>
              )}
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap sm:flex-nowrap border-b border-slate-200 bg-white rounded-2xl p-2 shadow-sm gap-2">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === "register" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileText className="w-4 h-4" />
              Certificate Register ({certificates.length})
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab("issue")}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === "issue" ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Plus className="w-4 h-4" />
                Issue Certificate Form
              </button>
            )}
          </div>

          {/* TAB 1: CERTIFICATE REGISTER */}
          {activeTab === "register" && (
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="card p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student, serial, admission..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchCertificates()}
                      className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    />
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 w-full sm:w-auto"
                  >
                    <option value="all">All Certificate Types</option>
                    <option value="transfer_certificate">Transfer Certificate (TC)</option>
                    <option value="bonafide">Bonafide Certificate</option>
                    <option value="character">Character Certificate</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 w-full sm:w-auto"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Valid</option>
                    <option value="cancelled">Cancelled / Revoked</option>
                  </select>
                </div>

                <button
                  onClick={fetchCertificates}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
              ) : certificates.length === 0 ? (
                <div className="card p-12 text-center border border-dashed border-slate-300">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Certificates Found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    No certificates have been issued matching this filter criteria. Click "Issue New Certificate" to generate one.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Mobile Cards View */}
                  <div className="md:hidden space-y-3">
                    {certificates.map((cert) => (
                      <div
                        key={cert._id}
                        className="card p-4 border border-slate-200 bg-white shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono font-black text-blue-700 text-xs">
                              {cert.certificateNo}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">{cert.studentName}</h4>
                            <p className="text-xs text-slate-500 font-mono">Adm: {cert.admissionNo} • Class {cert.currentClass}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              cert.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {cert.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                              cert.certificateType === "transfer_certificate"
                                ? "bg-purple-100 text-purple-800"
                                : cert.certificateType === "bonafide"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {cert.certificateType.replace("_", " ")}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Issued: {new Date(cert.dateOfIssue).toLocaleDateString("en-IN")}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCert(cert);
                              setIsPrintModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition flex-1 sm:flex-initial justify-center"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print
                          </button>

                          {isAdmin && cert.status === "active" && (
                            <button
                              onClick={() => handleCancelCert(cert._id, cert.certificateNo)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block card overflow-hidden border border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs min-w-[720px]">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider">
                            <th className="py-3 px-3">Serial No</th>
                            <th className="py-3 px-3">Certificate Type</th>
                            <th className="py-3 px-3">Student Name</th>
                            <th className="py-3 px-3">Admission No</th>
                            <th className="py-3 px-3">Class</th>
                            <th className="py-3 px-3">Issue Date</th>
                            <th className="py-3 px-3 text-center">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {certificates.map((cert) => (
                            <tr key={cert._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-mono font-black text-blue-700">
                                {cert.certificateNo}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                    cert.certificateType === "transfer_certificate"
                                      ? "bg-purple-100 text-purple-800"
                                      : cert.certificateType === "bonafide"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {cert.certificateType.replace("_", " ")}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                                {cert.studentName}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {cert.admissionNo}
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-700">
                                Class {cert.currentClass}
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {new Date(cert.dateOfIssue).toLocaleDateString("en-IN")}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    cert.status === "active"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {cert.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedCert(cert);
                                    setIsPrintModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Print
                                </button>

                                {isAdmin && cert.status === "active" && (
                                  <button
                                    onClick={() => handleCancelCert(cert._id, cert.certificateNo)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ISSUE NEW CERTIFICATE FORM */}
          {activeTab === "issue" && (
            <div className="card p-6 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Certificate Generation Counter</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a registered pupil to populate their biodata and generate an official printable certificate with sequential numbering.
                </p>
              </div>

              {/* Student Search & Select Box */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Step 1: Look Up Student Record *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Student ID or Admission No (e.g. 2345678903, STU-2024-0001)..."
                    value={studentLookupId}
                    onChange={(e) => setStudentLookupId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStudentLookup()}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleStudentLookup}
                    disabled={lookingUp}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition flex items-center gap-1.5 shadow"
                  >
                    {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Search Student
                  </button>
                </div>

                {lookupError && (
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {lookupError}
                  </p>
                )}

                {foundStudent && (
                  <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{foundStudent.personal?.name}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          Class {foundStudent.academic?.class}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Admission No: <strong className="font-mono text-slate-800">{foundStudent.admissionNo}</strong> • Father: <strong className="text-slate-800">{foundStudent.parents?.fatherName || "N/A"}</strong> • DOB: <strong className="text-slate-800">{new Date(foundStudent.personal?.dob).toLocaleDateString("en-IN")}</strong>
                      </p>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Ready to Issue
                    </span>
                  </div>
                )}
              </div>

              {/* Certificate Details Form */}
              <form onSubmit={handleIssueCertificate} className="space-y-5 text-xs font-semibold">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                      Certificate Type *
                    </label>
                    <select
                      value={form.certificateType}
                      onChange={(e) => setForm({ ...form, certificateType: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="transfer_certificate">Transfer Certificate (School Leaving Certificate)</option>
                      <option value="bonafide">Bonafide Student Certificate (Scholarship/Bank)</option>
                      <option value="character">Character & Conduct Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                      General Conduct
                    </label>
                    <select
                      value={form.generalConduct}
                      onChange={(e) => setForm({ ...form, generalConduct: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    >
                      <option value="Good & Exemplary">Good & Exemplary</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                      Reason for Leaving / Purpose *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.reasonForLeaving}
                      onChange={(e) => setForm({ ...form, reasonForLeaving: e.target.value })}
                      placeholder="e.g. Passed Class 10 HSC Examination, Parent Relocation"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                      Last Examination Passed
                    </label>
                    <input
                      type="text"
                      value={form.lastExamPassed}
                      onChange={(e) => setForm({ ...form, lastExamPassed: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                      Promotion Qualification
                    </label>
                    <input
                      type="text"
                      value={form.qualifiedForPromotion}
                      onChange={(e) => setForm({ ...form, qualifiedForPromotion: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                      Attendance Days
                    </label>
                    <input
                      type="number"
                      value={form.totalAttendanceDays}
                      onChange={(e) => setForm({ ...form, totalAttendanceDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                      Total Working Days
                    </label>
                    <input
                      type="number"
                      value={form.totalWorkingDays}
                      onChange={(e) => setForm({ ...form, totalWorkingDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 uppercase tracking-wider mb-1 font-bold">
                    Headmaster Remarks & Recommendations
                  </label>
                  <textarea
                    rows={2}
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                {form.certificateType === "transfer_certificate" && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                      <input
                        type="checkbox"
                        checked={form.updateStudentStatus}
                        onChange={(e) => setForm({ ...form, updateStudentStatus: e.target.checked })}
                        className="rounded text-amber-600 w-4 h-4"
                      />
                      <span>Automatically update pupil status to "Transferred / Outgoing" in School Directory</span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuing || !foundStudent}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    Issue Certificate & Open Print Preview
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* OFFICIAL CERTIFICATE PRINT MODAL */}
          {isPrintModalOpen && selectedCert && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:m-0">
                {/* Print Modal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">
                      {selectedCert.certificateType.replace("_", " ").toUpperCase()} - {selectedCert.certificateNo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition"
                    >
                      <Printer className="w-4 h-4" />
                      Print Official Certificate (A4)
                    </button>
                    <button
                      onClick={() => setIsPrintModalOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Printable Document Body */}
                <div id="printable-certificate" className="p-4 sm:p-8 bg-white border-4 sm:border-8 border-double border-slate-900 rounded-xl sm:rounded-2xl print:border-2 print:border-slate-900 print:p-3 print:rounded-lg text-slate-900 font-serif leading-relaxed overflow-x-auto">
                  <div className="min-w-[560px]">
                  {/* School Crest & State Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 print:pb-1.5">
                    <img
                      src="/5tlogo.png"
                      alt="5T Emblem"
                      className="h-16 w-16 sm:h-20 sm:w-20 print:h-12 print:w-12 object-contain rounded-xl border border-slate-300"
                    />
                    <div className="text-center flex-1 px-4">
                      <span className="text-[11px] print:text-[9px] font-sans font-black uppercase tracking-widest text-blue-900 block">
                        GOVERNMENT OF ODISHA • SCHOOL & MASS EDUCATION DEPARTMENT
                      </span>
                      <h1 className="text-xl sm:text-2xl md:text-3xl print:text-lg font-black font-sans tracking-tight text-slate-950 mt-0.5 uppercase">
                        Dulichand Sonadevi High School
                      </h1>
                      <p className="text-xs print:text-[10px] font-sans text-slate-700 font-semibold mt-0.5">
                        At/Po: Ranamunduli, Via: Basta, Dist: Balasore, Odisha - 756029
                      </p>
                      <p className="text-[11px] print:text-[9px] font-sans font-bold text-emerald-800 mt-0.5">
                        School Code: 0408102 • UDISE: 21080314502 • Affiliated to BSE, Odisha
                      </p>
                    </div>
                    <div className="w-16 print:w-12 text-center">
                      <div className="w-16 h-16 print:w-12 print:h-14 rounded-xl border-2 border-dashed border-slate-300 mx-auto flex items-center justify-center text-[10px] print:text-[8px] font-sans text-slate-400 font-bold uppercase">
                        Affix Photo
                      </div>
                    </div>
                  </div>

                  {/* Certificate Title */}
                  <div className="text-center my-3 print:my-1.5">
                    <span className="inline-block px-6 py-1 print:px-4 print:py-0.5 rounded-full border-2 border-slate-900 bg-slate-100 font-sans font-black text-sm print:text-xs uppercase tracking-wider">
                      {selectedCert.certificateType === "transfer_certificate"
                        ? "TRANSFER CERTIFICATE / SCHOOL LEAVING CERTIFICATE"
                        : selectedCert.certificateType === "bonafide"
                        ? "BONAFIDE STUDENT CERTIFICATE"
                        : "CHARACTER & CONDUCT CERTIFICATE"}
                    </span>
                    <div className="flex justify-between items-center text-xs print:text-[9.5px] font-sans font-bold text-slate-700 mt-1.5 px-2">
                      <span>Book No: <strong>{selectedCert.bookNo}</strong></span>
                      <span>Serial No: <strong className="text-blue-900 text-sm print:text-xs font-mono">{selectedCert.certificateNo}</strong></span>
                      <span>Admission No: <strong className="font-mono">{selectedCert.admissionNo}</strong></span>
                    </div>
                  </div>

                  {/* Certificate Clauses (Formal 1 to 17) */}
                  <div className="space-y-1.5 print:space-y-0.5 text-xs print:text-[9.5px] text-slate-900 px-2 py-1 print:leading-tight">
                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">1. Name of Pupil:</span>
                      <strong className="flex-1 uppercase font-bold text-sm print:text-xs">{selectedCert.studentName}</strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">2. Father's / Guardian's Name:</span>
                      <strong className="flex-1 uppercase">{selectedCert.fatherName || "N/A"}</strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">3. Mother's Name:</span>
                      <strong className="flex-1 uppercase">{selectedCert.motherName || "N/A"}</strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">4. Nationality & Category:</span>
                      <span className="flex-1 font-semibold">{selectedCert.nationality} • {selectedCert.category}</span>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">5. Date of First Admission in School:</span>
                      <span className="flex-1 font-semibold">
                        {selectedCert.admissionDate ? new Date(selectedCert.admissionDate).toLocaleDateString("en-IN") : "-"} (Class {selectedCert.admissionClass || 8})
                      </span>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">6. Date of Birth (in figures):</span>
                      <strong className="flex-1">
                        {selectedCert.dob ? new Date(selectedCert.dob).toLocaleDateString("en-IN") : "N/A"}
                      </strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">7. Date of Birth (in words):</span>
                      <strong className="flex-1 uppercase font-bold text-blue-900">{selectedCert.dobInWords || "N/A"}</strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">8. Class in which pupil last studied:</span>
                      <strong className="flex-1">Class {selectedCert.currentClass} (Academic Session {selectedCert.academicSession})</strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">9. School / Board Annual Examination last taken:</span>
                      <span className="flex-1 font-semibold">{selectedCert.lastExamPassed}</span>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">10. Subjects Studied:</span>
                      <span className="flex-1 font-semibold">
                        {(selectedCert.subjectsStudied || []).join(", ") || "Odia, English, Mathematics, Science, Social Science, Hindi/Sanskrit"}
                      </span>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">11. Whether qualified for promotion:</span>
                      <strong className="flex-1 text-emerald-800">{selectedCert.qualifiedForPromotion}</strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">12. Month up to which school dues paid:</span>
                      <span className="flex-1 font-semibold">{selectedCert.monthUptoDuesPaid}</span>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">13. Total Attendance & Working Days:</span>
                      <span className="flex-1 font-semibold">
                        {selectedCert.totalAttendanceDays} Days attended out of {selectedCert.totalWorkingDays} Working Days
                      </span>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">14. Whether NCC Cadet / Boy Scout / Guide:</span>
                      <span className="flex-1 font-semibold">{selectedCert.nccCadetOrScout}</span>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">15. General Conduct & Character:</span>
                      <strong className="flex-1 text-slate-900">{selectedCert.generalConduct}</strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">16. Reasons for leaving school:</span>
                      <strong className="flex-1 text-slate-900">{selectedCert.reasonForLeaving}</strong>
                    </div>

                    <div className="flex border-b border-dotted border-slate-300 pb-0.5">
                      <span className="w-72 font-semibold">17. Any other remarks:</span>
                      <span className="flex-1 italic">{selectedCert.remarks}</span>
                    </div>
                  </div>

                  {/* Signatures & Seal Box */}
                  <div className="grid grid-cols-3 gap-4 pt-6 mt-3 print:pt-4 print:mt-2 border-t border-slate-900 text-center font-sans text-xs print:text-[9.5px]">
                    <div>
                      <div className="h-8 print:h-6 border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                      <span className="font-extrabold text-slate-800 mt-1.5 block">Prepared By (Clerk)</span>
                    </div>

                    <div className="relative">
                      <div className="w-16 h-16 print:w-12 print:h-12 rounded-full border-2 border-double border-slate-400 mx-auto -mt-4 print:-mt-2 flex items-center justify-center text-[9px] print:text-[7.5px] text-slate-400 font-black uppercase text-center p-1">
                        School Seal
                      </div>
                      <span className="font-extrabold text-slate-800 mt-1.5 block">Checked By (Senior Faculty)</span>
                    </div>

                    <div>
                      <div className="h-8 print:h-6 border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                      <span className="font-extrabold text-slate-800 mt-1.5 block">Headmaster / Principal</span>
                      <span className="text-[10px] print:text-[8px] text-slate-500 block">Dulichand Sonadevi High School</span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
