"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Printer,
  ChevronRight,
  User,
  Calendar,
  FileCheck,
  Building,
  ArrowLeft,
  X,
  Loader2,
  Phone
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function TrackAdmissionPage() {
  const [applicationNo, setApplicationNo] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applicationData, setApplicationData] = useState<any | null>(null);

  // Print Slip Modal State
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [slipData, setSlipData] = useState<any | null>(null);
  const [slipLoading, setSlipLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationNo.trim()) return;

    try {
      setLoading(true);
      setError("");
      setApplicationData(null);

      const params = new URLSearchParams();
      params.append("applicationNo", applicationNo.trim());
      if (dob) params.append("dob", dob);

      const res = await fetch(`${API_BASE_URL}/admissions/public/track?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setApplicationData(data.application);
      } else {
        setError(data.message || "No application record found with this registration number.");
      }
    } catch (err) {
      console.error("Tracking error:", err);
      setError("Unable to connect to server. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSlip = async () => {
    if (!applicationData) return;
    try {
      setSlipLoading(true);
      setSlipModalOpen(true);
      const res = await fetch(`${API_BASE_URL}/admissions/public/slip/${encodeURIComponent(applicationData.applicationId)}`);
      const data = await res.json();
      if (data.success) {
        setSlipData(data);
      } else {
        alert(data.message || "Failed to load slip");
        setSlipModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading slip");
      setSlipModalOpen(false);
    } finally {
      setSlipLoading(false);
    }
  };

  const getStepStatus = (stepIndex: number, currentStatus: string) => {
    // 0: submitted, 1: under_review, 2: approved
    if (currentStatus === "rejected") {
      if (stepIndex === 0) return "completed";
      if (stepIndex === 1) return "completed";
      return "rejected";
    }
    if (currentStatus === "approved") return "completed";
    if (currentStatus === "under_review") {
      if (stepIndex === 0) return "completed";
      if (stepIndex === 1) return "current";
      return "upcoming";
    }
    // 'submitted'
    if (stepIndex === 0) return "completed";
    return "upcoming";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <img
              src="/5tlogo.png"
              alt="School Emblem"
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-xl border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-black text-slate-900 leading-tight truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                Dulichand Sonadevi High School
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 truncate">Online Admission Tracking Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Back to Home</span><span className="xs:hidden">Home</span>
            </Link>
            <Link
              href="/login"
              className="text-xs font-bold text-blue-600 px-2 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <span className="hidden xs:inline">Staff Portal Login</span><span className="xs:hidden">Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Tracking Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 w-full space-y-6 sm:space-y-8 flex-1">
        {/* Banner */}
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 inline-block">
            Application Verification
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Track Admission Status
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Enter the <strong>Application Registration Number</strong> provided at the time of online form submission to check current scrutiny and enrollment status.
          </p>
        </div>

        {/* Search Card */}
        <div className="card p-4 sm:p-8 bg-white border border-slate-200 shadow-md rounded-2xl sm:rounded-3xl">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Application Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APP-2026-0001, APP-2025-0012"
                  value={applicationNo}
                  onChange={(e) => setApplicationNo(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Applicant's Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || !applicationNo.trim()}
                className="w-full md:w-auto px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Track Application Status
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 sm:mt-6 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tracking Result Display */}
        {applicationData && (
          <div className="card p-4 sm:p-8 bg-white border border-slate-200 shadow-xl rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 sm:pb-6 border-b border-slate-100 gap-3 sm:gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {applicationData.applicationId}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {applicationData.studentName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applied for: <strong>Class {applicationData.applyingForClass}</strong> • Session: <strong>{applicationData.sessionName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenSlip}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition w-full sm:w-auto"
                >
                  <Printer className="w-4 h-4" />
                  Print Acknowledgment Slip
                </button>
              </div>
            </div>

            {/* Visual Stepper */}
            <div className="py-2 sm:py-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 sm:mb-6">
                Admission Application Lifecycle
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* Step 1 */}
                <div
                  className={`p-4 rounded-2xl border text-center space-y-2 ${
                    getStepStatus(0, applicationData.status) === "completed"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xs font-bold shadow">
                    ✓
                  </div>
                  <h5 className="font-black text-xs">1. Form Submitted</h5>
                  <p className="text-[10px] text-slate-500">
                    {new Date(applicationData.submissionDate).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  className={`p-4 rounded-2xl border text-center space-y-2 ${
                    getStepStatus(1, applicationData.status) === "completed"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : getStepStatus(1, applicationData.status) === "current"
                      ? "bg-blue-50 border-blue-300 text-blue-900"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow ${
                      getStepStatus(1, applicationData.status) === "completed"
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    2
                  </div>
                  <h5 className="font-black text-xs">2. Document Scrutiny</h5>
                  <p className="text-[10px] text-slate-500">
                    Aadhaar, TC & Marks check
                  </p>
                </div>

                {/* Step 3 */}
                <div
                  className={`p-4 rounded-2xl border text-center space-y-2 ${
                    getStepStatus(2, applicationData.status) === "completed"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow ${
                      getStepStatus(2, applicationData.status) === "completed"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    3
                  </div>
                  <h5 className="font-black text-xs">3. Headmaster Review</h5>
                  <p className="text-[10px] text-slate-500">
                    Eligibility & Seat Allocation
                  </p>
                </div>

                {/* Step 4 */}
                <div
                  className={`p-4 rounded-2xl border text-center space-y-2 ${
                    applicationData.status === "approved"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                      : applicationData.status === "rejected"
                      ? "bg-red-50 border-red-300 text-red-900"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow ${
                      applicationData.status === "approved"
                        ? "bg-white text-emerald-800"
                        : applicationData.status === "rejected"
                        ? "bg-red-600 text-white"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {applicationData.status === "approved" ? "★" : "4"}
                  </div>
                  <h5 className="font-black text-xs">
                    {applicationData.status === "approved"
                      ? "Admission Confirmed"
                      : applicationData.status === "rejected"
                      ? "Not Admitted"
                      : "4. Final Enrollment"}
                  </h5>
                  <p className={`text-[10px] ${applicationData.status === "approved" ? "text-emerald-100" : "text-slate-500"}`}>
                    {applicationData.status === "approved"
                      ? "Seat Confirmed!"
                      : "Pending final sanction"}
                  </p>
                </div>
              </div>
            </div>

            {/* Applicant Profile & Document Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Applicant Profile
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Father's Name:</span>
                  <strong className="text-slate-900">{applicationData.fatherName || "N/A"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mother's Name:</span>
                  <strong className="text-slate-900">{applicationData.motherName || "N/A"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Birth:</span>
                  <strong className="text-slate-900">
                    {applicationData.dob ? new Date(applicationData.dob).toLocaleDateString("en-IN") : "N/A"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile No:</span>
                  <strong className="text-slate-900 font-mono">{applicationData.mobile || "N/A"}</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Submitted Document Verification
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Passport Photograph:</span>
                  <span className={`font-bold ${applicationData.documentsSubmitted.photo ? "text-emerald-700" : "text-amber-700"}`}>
                    {applicationData.documentsSubmitted.photo ? "✓ Uploaded" : "○ Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Aadhaar Card Copy:</span>
                  <span className={`font-bold ${applicationData.documentsSubmitted.aadhaar ? "text-emerald-700" : "text-amber-700"}`}>
                    {applicationData.documentsSubmitted.aadhaar ? "✓ Uploaded" : "○ Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Birth Certificate:</span>
                  <span className={`font-bold ${applicationData.documentsSubmitted.birthCertificate ? "text-emerald-700" : "text-amber-700"}`}>
                    {applicationData.documentsSubmitted.birthCertificate ? "✓ Uploaded" : "○ Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Previous School TC:</span>
                  <span className={`font-bold ${applicationData.documentsSubmitted.transferCertificate ? "text-emerald-700" : "text-amber-700"}`}>
                    {applicationData.documentsSubmitted.transferCertificate ? "✓ Uploaded" : "○ Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* School Instructions */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <strong className="block text-blue-950 font-bold">Important Instructions for Applicants:</strong>
              <p>
                1. Please bring 2 hard copies of the <strong>Printable Acknowledgment Slip</strong> and original documents (Birth Certificate, Transfer Certificate, Aadhaar) to the school office for physical verification.
              </p>
              <p>
                2. School Office hours: <strong>Monday to Saturday, 9:30 AM to 3:30 PM</strong>.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* PRINT APPLICATION ACKNOWLEDGMENT SLIP MODAL */}
      {slipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:m-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm">Admission Application Acknowledgment Slip</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  Print Acknowledgment Slip (A4)
                </button>
                <button
                  onClick={() => setSlipModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {slipLoading || !slipData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
            ) : (
              <div id="printable-slip" className="p-8 bg-white border-2 border-slate-900 rounded-2xl print:border-none print:p-0 text-slate-900 font-sans text-xs">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <img
                    src="/5tlogo.png"
                    alt="Emblem"
                    className="h-16 w-16 object-contain rounded-xl border border-slate-300"
                  />
                  <div className="text-center flex-1 px-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-900 block">
                      GOVERNMENT OF ODISHA • SCHOOL & MASS EDUCATION DEPARTMENT
                    </span>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-950 uppercase mt-0.5">
                      {slipData.school.name}
                    </h1>
                    <p className="text-xs text-slate-700 font-medium">
                      {slipData.school.address}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-800">
                      5T High School Transformation | School Code: {slipData.school.schoolCode}
                    </p>
                  </div>
                  <div className="w-16 text-center">
                    <div className="w-14 h-16 rounded border border-slate-400 mx-auto flex items-center justify-center text-[9px] text-slate-400 uppercase font-bold text-center p-1">
                      Affix Photo
                    </div>
                  </div>
                </div>

                {/* Slip Title */}
                <div className="text-center my-4">
                  <span className="inline-block px-6 py-1 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-wider">
                    ONLINE ADMISSION APPLICATION ACKNOWLEDGMENT SLIP (2026-2027)
                  </span>
                </div>

                {/* Details Grid */}
                <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
                  <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-300 p-2.5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Registration No:</span>
                      <strong className="text-sm font-mono text-blue-900">{slipData.application.applicationId}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Submission Date:</span>
                      <strong className="text-sm">
                        {new Date(slipData.application.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-b border-slate-300 p-2.5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Pupil's Full Name:</span>
                      <strong className="text-sm uppercase">{slipData.application.personal?.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Applying for Class:</span>
                      <strong className="text-sm text-emerald-800">Class {slipData.application.academic?.class}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 border-b border-slate-300 p-2.5 bg-slate-50/50">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Father's Name:</span>
                      <strong>{slipData.application.parents?.fatherName || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Mother's Name:</span>
                      <strong>{slipData.application.parents?.motherName || "N/A"}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 p-2.5">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Date of Birth:</span>
                      <strong>
                        {slipData.application.personal?.dob
                          ? new Date(slipData.application.personal.dob).toLocaleDateString("en-IN")
                          : "N/A"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Contact Mobile:</span>
                      <strong className="font-mono">{slipData.application.parents?.parentMobile || slipData.application.personal?.mobile || "N/A"}</strong>
                    </div>
                  </div>
                </div>

                {/* Instructions Box */}
                <div className="border border-dashed border-slate-400 p-3 rounded-xl bg-slate-50 mb-6 space-y-1 text-[11px] text-slate-700">
                  <strong className="text-slate-900 block font-bold">Physical Verification Instructions:</strong>
                  <p>• The parent/guardian must present this slip along with original documents at Dulichand Sonadevi High School office within 7 working days.</p>
                  <p>• Required Documents: Original Birth Certificate, Aadhaar Card, Transfer Certificate from previous school, and 3 passport photographs.</p>
                </div>

                {/* Counter Foil Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-400 text-center">
                  <div>
                    <div className="h-8 border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                    <span className="font-bold text-slate-800 mt-2 block">Signature of Parent / Guardian</span>
                  </div>

                  <div>
                    <div className="h-8 border-b border-dashed border-slate-400 w-3/4 mx-auto" />
                    <span className="font-bold text-slate-800 mt-2 block">Receiving Clerk / Verifier (School Seal)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        Dulichand Sonadevi High School, Ranamunduli, Basta, Balasore, Odisha • 5T High School Transformation
      </footer>
    </div>
  );
}
