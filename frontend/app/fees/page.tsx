"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import {
  CreditCard,
  Plus,
  Search,
  Receipt,
  Printer,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Layers,
  History,
  X,
  Trash2,
  ArrowRight,
  User,
  Users,
  ChevronRight,
  Sparkles,
  RefreshCw
} from "lucide-react";

type FeeStructure = {
  _id: string;
  title: string;
  class: string;
  amount: number;
  frequency: string;
  description?: string;
};

type Payment = {
  _id: string;
  receiptNo: string;
  studentId: {
    _id: string;
    studentId: string;
    admissionNo: string;
    personal: {
      name: string;
      mobile?: string;
    };
    academic?: {
      class?: string;
      section?: string;
      rollNo?: number;
    };
  };
  sessionId?: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  paymentMode: string;
  transactionId?: string;
  paymentDate: string;
  status: string;
  collectedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  remarks?: string;
};

type Student = {
  _id: string;
  studentId: string;
  admissionNo: string;
  personal: {
    name: string;
    mobile?: string;
  };
  academic: {
    class: string;
    section?: string;
    rollNo?: number;
  };
};

type HeadBreakdown = {
  _id: string;
  title: string;
  amount: number;
  frequency: string;
  description?: string;
  paidAmount: number;
  balanceDue: number;
  status: "paid" | "partial" | "unpaid";
  lastPaymentDate?: string | null;
};

type StudentFeeDetails = {
  student: {
    id: string;
    studentId: string;
    admissionNo: string;
    name: string;
    mobile?: string;
    class: string;
    section?: string;
    rollNo?: number;
  };
  totalPayable: number;
  totalPaid: number;
  balanceDue: number;
  structures: FeeStructure[];
  headsBreakdown?: HeadBreakdown[];
  payments: Payment[];
};

export default function FeesPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [activeTab, setActiveTab] = useState<"collect" | "history" | "structures">("collect");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Student Roster & Selection State (Always visible without search!)
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentClassFilter, setStudentClassFilter] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentFeeDetails, setStudentFeeDetails] = useState<StudentFeeDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fee Structures State
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureForm, setStructureForm] = useState({
    title: "",
    class: "all",
    amount: "",
    frequency: "monthly",
    description: "",
  });

  // Cashier Counter Form State
  const [feeForm, setFeeForm] = useState({
    title: "Monthly Tuition Fee",
    totalAmount: "350",
    paidAmount: "350",
    paymentMode: "cash",
    transactionId: "",
    remarks: "Paid at school counter",
  });
  const [isCustomHead, setIsCustomHead] = useState(false);
  const [customHeadTitle, setCustomHeadTitle] = useState("");

  // Payments History State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Printable Receipt Modal State
  const [receiptToPrint, setReceiptToPrint] = useState<Payment | null>(null);
  const [receiptCopyMode, setReceiptCopyMode] = useState<"single" | "double">("single");

  // Helper to format number into Indian Rupees words
  const formatAmountInWords = (amount: number): string => {
    if (!amount || isNaN(amount)) return "Zero Rupees Only";
    const num = Math.floor(amount);
    const ones = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const convert = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
      if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
      if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
      if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
      return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
    };

    return `${convert(num)} Rupees Only`;
  };

  // Fetch All Enrolled Students (Loads names immediately!)
  const fetchAllStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await fetch(`${API_BASE_URL}/students?status=active`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.students || [];
        setAllStudents(list);
      }
    } catch (err) {
      console.error("Error fetching students roster:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch Fee Structures
  const fetchStructures = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/fees/structures`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setStructures(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching structures:", err);
    }
  };

  // Fetch Payments History
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (paymentSearch) params.append("search", paymentSearch);
      if (modeFilter !== "all") params.append("paymentMode", modeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${API_BASE_URL}/fees/payments?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllStudents();
      fetchStructures();
      fetchPayments();
    }
  }, [token]);

  // Filter students based on Class filter and real-time search term
  const filteredStudents = allStudents.filter((s) => {
    if (studentClassFilter !== "all" && s.academic?.class !== studentClassFilter) {
      return false;
    }
    if (studentSearch.trim() !== "") {
      const q = studentSearch.toLowerCase().trim();
      const name = (s.personal?.name || "").toLowerCase();
      const adm = (s.admissionNo || "").toLowerCase();
      const stuId = (s.studentId || "").toLowerCase();
      const roll = String(s.academic?.rollNo || "");
      const phone = (s.personal?.mobile || "").toLowerCase();
      return name.includes(q) || adm.includes(q) || stuId.includes(q) || roll === q || phone.includes(q);
    }
    return true;
  });

  // Fetch Fee Details for a Selected Student
  const fetchStudentFeeSummary = async (studentIdOrAdm: string) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(`${API_BASE_URL}/fees/student/${encodeURIComponent(studentIdOrAdm)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data: StudentFeeDetails = await res.json();
        setStudentFeeDetails(data);

        // Pre-fill form with the first unpaid head or default structure
        const unpaidHead = data.headsBreakdown?.find((h: HeadBreakdown) => h.status !== "paid");
        if (unpaidHead) {
          setIsCustomHead(false);
          setFeeForm({
            title: unpaidHead.title,
            totalAmount: String(unpaidHead.amount),
            paidAmount: String(unpaidHead.balanceDue > 0 ? unpaidHead.balanceDue : unpaidHead.amount),
            paymentMode: "cash",
            transactionId: "",
            remarks: `Fee payment for ${unpaidHead.title}`,
          });
        } else if (data.structures && data.structures.length > 0) {
          const firstSt = data.structures[0];
          setIsCustomHead(false);
          setFeeForm({
            title: firstSt.title,
            totalAmount: String(firstSt.amount),
            paidAmount: String(firstSt.amount),
            paymentMode: "cash",
            transactionId: "",
            remarks: `Fee payment for ${firstSt.title}`,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load student fee summary:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    fetchStudentFeeSummary(s._id || s.admissionNo);
  };

  // Collect Fee Submit
  const handleCollectFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setMessage({ type: "error", text: "Please select a student from the list first" });
      return;
    }

    const effectiveTitle = isCustomHead ? customHeadTitle.trim() : feeForm.title.trim();
    if (!effectiveTitle) {
      setMessage({ type: "error", text: "Please specify a fee head or title" });
      return;
    }

    const numPaid = Number(feeForm.paidAmount);
    const numTotal = Number(feeForm.totalAmount) || numPaid;

    if (isNaN(numPaid) || numPaid <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount greater than ₹0" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch(`${API_BASE_URL}/fees/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: selectedStudent._id || selectedStudent.admissionNo,
          title: effectiveTitle,
          totalAmount: Math.max(numTotal, numPaid),
          paidAmount: numPaid,
          paymentMode: feeForm.paymentMode,
          transactionId: feeForm.transactionId,
          remarks: feeForm.remarks,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Payment of ₹${numPaid.toLocaleString()} collected successfully! Receipt No: ${data.payment.receiptNo}`,
        });
        // Automatically open the official receipt modal for immediate printing
        setReceiptToPrint(data.payment);
        fetchPayments();
        if (selectedStudent) {
          fetchStudentFeeSummary(selectedStudent._id || selectedStudent.admissionNo);
        }
      } else {
        setMessage({ type: "error", text: data.message || "Failed to record payment" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error while recording fee" });
    } finally {
      setLoading(false);
    }
  };

  // Create Fee Structure Submit
  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch(`${API_BASE_URL}/fees/structures`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: structureForm.title,
          class: structureForm.class,
          amount: Number(structureForm.amount),
          frequency: structureForm.frequency,
          description: structureForm.description,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Fee head structure created successfully!" });
        setIsStructureModalOpen(false);
        setStructureForm({ title: "", class: "all", amount: "", frequency: "monthly", description: "" });
        fetchStructures();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to create fee structure" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  // Delete Fee Structure
  const handleDeleteStructure = async (structureId: string) => {
    if (!confirm("Are you sure you want to delete this fee head structure?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/fees/structures/${structureId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Fee head deleted successfully." });
        fetchStructures();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.message || "Failed to delete fee structure" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const renderReceiptCard = (p: Payment, copyLabel: string, isHalfPage: boolean) => {
    const studentName = p.studentId?.personal?.name || selectedStudent?.personal?.name || "Student";
    const admNo = p.studentId?.admissionNo || selectedStudent?.admissionNo || "N/A";
    const studentClass = p.studentId?.academic?.class || selectedStudent?.academic?.class || "N/A";
    const studentSection = p.studentId?.academic?.section || selectedStudent?.academic?.section || "";
    const studentRoll = p.studentId?.academic?.rollNo || selectedStudent?.academic?.rollNo;
    const paidAmt = p.paidAmount || 0;
    const totalAmt = p.totalAmount || paidAmt;
    const cashierName = p.collectedBy?.name || "Official Cashier";

    return (
      <div
        className={`bg-white border-2 border-slate-900 rounded-lg text-slate-900 ${
          isHalfPage ? "p-3 sm:p-4 text-[11px] space-y-2.5" : "p-5 sm:p-6 text-xs space-y-3.5"
        }`}
      >
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-2 text-center">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              ESTD. 1984
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-slate-800 rounded bg-slate-50">
              {copyLabel}
            </span>
            <span className="text-[10px] font-bold text-slate-500 font-mono">
              DISE: 21080308001
            </span>
          </div>

          <h2 className={`font-black uppercase tracking-wider text-slate-900 ${isHalfPage ? "text-base sm:text-lg" : "text-xl sm:text-2xl"}`}>
            Dulichand Sonadevi High School
          </h2>
          <p className="text-[11px] text-slate-600 font-medium">
            Ranamunduli, Basta, Balasore, Odisha - 756045 • Govt. of Odisha Recognized
          </p>
          <div className="mt-1 inline-block bg-slate-100 border border-slate-400 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-slate-900">
            OFFICIAL FEE & COUNTER MONEY RECEIPT
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-dashed border-slate-300 pb-2 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase font-bold">Receipt No</span>
            <span className="font-mono font-black text-slate-900 text-xs">{p.receiptNo}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase font-bold">Date & Time</span>
            <span className="font-medium text-slate-900">
              {new Date(p.paymentDate).toLocaleDateString()} {new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase font-bold">Payment Mode</span>
            <span className="font-bold text-slate-900 uppercase">
              {p.paymentMode} {p.transactionId ? `(${p.transactionId})` : ""}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase font-bold">Status</span>
            <span className="font-black text-emerald-800 uppercase">
              {p.status === "paid" ? "FULL PAID" : "PARTIAL PAID"}
            </span>
          </div>
        </div>

        {/* Student Particulars */}
        <div className="bg-slate-50/80 p-2.5 rounded border border-slate-300 text-[11px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-slate-500 text-[10px] block">Student Name:</span>
              <strong className="text-slate-900 uppercase font-black">{studentName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Admission No / ID:</span>
              <span className="font-mono font-bold text-slate-900">{admNo}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Class & Roll:</span>
              <span className="font-bold text-slate-900">
                Class {studentClass} {studentSection ? `(${studentSection})` : ""} {studentRoll ? `• Roll #${studentRoll}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Fee Particulars Table */}
        <table className="w-full text-left border border-slate-400 text-[11px]">
          <thead className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-1.5 border-r border-slate-400 w-8 text-center">#</th>
              <th className="p-1.5 border-r border-slate-400">Fee Head / Description</th>
              <th className="p-1.5 border-r border-slate-400 text-right w-24">Due (₹)</th>
              <th className="p-1.5 text-right w-28">Received (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-1.5 border-r border-slate-300 text-center font-mono">1</td>
              <td className="p-1.5 border-r border-slate-300">
                <p className="font-bold text-slate-900">{p.title}</p>
                {p.remarks && <p className="text-[10px] text-slate-500 italic">{p.remarks}</p>}
              </td>
              <td className="p-1.5 border-r border-slate-300 text-right font-medium">
                ₹{totalAmt.toLocaleString()}
              </td>
              <td className="p-1.5 text-right font-black text-slate-900 text-xs">
                ₹{paidAmt.toLocaleString()}
              </td>
            </tr>
            <tr className="bg-slate-50 border-t-2 border-slate-900 font-bold">
              <td colSpan={3} className="p-1.5 border-r border-slate-400 text-right uppercase text-[10px]">
                Net Amount Received (INR):
              </td>
              <td className="p-1.5 text-right font-black text-slate-950 text-xs sm:text-sm">
                ₹{paidAmt.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px] flex items-center justify-between">
          <p>
            <strong className="text-slate-700">Amount in Words: </strong>
            <span className="font-bold text-slate-900 uppercase">{formatAmountInWords(paidAmt)}</span>
          </p>
          <span className="font-mono text-slate-500">Cashier: {cashierName}</span>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end pt-5 text-[10px] text-slate-800">
          <div className="text-center">
            <div className="w-28 border-b border-slate-400 mb-0.5"></div>
            <span>Depositor / Student</span>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-slate-400 mb-0.5"></div>
            <span className="font-bold">Authorized Cashier / Accountant</span>
          </div>
        </div>

        {/* Note */}
        <p className="text-[9px] text-center text-slate-400 border-t border-slate-100 pt-1 font-mono">
          System Generated Official Receipt • Dulichand Sonadevi High School ERP Portal
        </p>
      </div>
    );
  };

  const totalCollectedRevenue = payments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <DashboardLayout>
      {/* Print Specific CSS to print strictly on ONE single A4 page */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
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
          #printable-receipt-root,
          #printable-receipt-root * {
            visibility: visible !important;
          }
          #printable-receipt-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 282mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            z-index: 9999999 !important;
          }
          .print-hidden, .print\\:hidden, button {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                <CreditCard className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Fee Management & Billing Counter
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dulichand Sonadevi High School • Fast counter collection, fee heads & instant official receipts
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchAllStudents();
                fetchPayments();
                fetchStructures();
                if (selectedStudent) {
                  fetchStudentFeeSummary(selectedStudent._id || selectedStudent.admissionNo);
                }
              }}
              title="Refresh all records"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 px-4 py-2.5 rounded-xl shadow-xs">
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <IndianRupee className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">Total Fees Collected</p>
                <p className="text-xl font-black text-emerald-950">₹{totalCollectedRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium animate-fadeIn ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-3 sm:px-6 pt-2 rounded-t-2xl shadow-sm overflow-x-auto whitespace-nowrap gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab("collect")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "collect"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Cashier Collection Counter
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              fetchPayments();
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            Transactions History ({payments.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("structures");
              fetchStructures();
            }}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap ${
              activeTab === "structures"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            Fee Structure Heads ({structures.length})
          </button>
        </div>

        {/* TAB 1: Cashier Collection Counter */}
        {activeTab === "collect" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Student Search & Details (Left Column: 5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Student Directory Card (Names shown directly without search!) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        1. Select Student for Counter Billing
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Student names listed below. Pick from dropdown or click card.
                      </p>
                    </div>
                  </div>
                  {selectedStudent && (
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentFeeDetails(null);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Deselect
                    </button>
                  )}
                </div>


                {/* Class Filter Tabs */}
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setStudentClassFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      studentClassFilter === "all"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({allStudents.length})
                  </button>
                  {["8", "9", "10"].map((cls) => {
                    const count = allStudents.filter((s) => s.academic?.class === cls).length;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setStudentClassFilter(cls)}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                          studentClassFilter === cls
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Class {cls} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Search / Filter Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type to filter names, adm no, or roll..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {studentSearch && (
                    <button
                      onClick={() => setStudentSearch("")}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Student Names Roster (Displayed without search!) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>
                      {studentSearch ? "Filtered Results" : "Available Student Names"} ({filteredStudents.length})
                    </span>
                    <span>Click card to bill</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl max-h-60 overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
                    {loadingStudents ? (
                      <div className="p-6 text-center text-xs text-slate-400">Loading student directory...</div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No students found matching your criteria.
                      </div>
                    ) : (
                      filteredStudents.map((s) => {
                        const isSelected = selectedStudent?._id === s._id;
                        return (
                          <div
                            key={s._id}
                            onClick={() => handleSelectStudent(s)}
                            className={`p-3 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-indigo-50 border-l-4 border-indigo-600 text-indigo-950 font-medium"
                                : "hover:bg-white hover:shadow-xs"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected
                                    ? "bg-indigo-600 text-white"
                                    : "bg-indigo-100 text-indigo-700"
                                }`}
                              >
                                {s.personal?.name ? s.personal.name.slice(0, 2).toUpperCase() : "ST"}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {s.personal?.name}
                                </p>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-slate-700 font-medium">Adm: {s.admissionNo}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">
                                    Class {s.academic?.class}
                                    {s.academic?.section ? ` (${s.academic.section})` : ""}
                                  </span>
                                  {s.academic?.rollNo ? (
                                    <>
                                      <span>•</span>
                                      <span>Roll #{s.academic.rollNo}</span>
                                    </>
                                  ) : null}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                  Selected
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-300 px-2 py-1 rounded-lg flex items-center gap-1 transition-all">
                                  Select
                                  <ChevronRight className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Student Profile & Financial Status */}
              {selectedStudent ? (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                          Enrolled Student
                        </span>
                        {studentFeeDetails && (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              studentFeeDetails.balanceDue <= 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {studentFeeDetails.balanceDue <= 0
                              ? "✓ All Dues Cleared"
                              : `Pending Due: ₹${studentFeeDetails.balanceDue.toLocaleString()}`}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">
                        {selectedStudent.personal.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Adm No: <strong className="font-mono text-slate-800">{selectedStudent.admissionNo}</strong> • Class:{" "}
                        <strong className="text-slate-800">{selectedStudent.academic.class}</strong>
                        {selectedStudent.academic.section ? ` - Sec ${selectedStudent.academic.section}` : ""}
                        {selectedStudent.academic.rollNo ? ` • Roll #${selectedStudent.academic.rollNo}` : ""}
                        {selectedStudent.personal.mobile ? ` • Ph: ${selectedStudent.personal.mobile}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Financial Balance Summary Cards */}
                  {loadingDetails ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Calculating ledger balances and dues...
                    </div>
                  ) : studentFeeDetails ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                          <p className="text-[10px] text-slate-500 font-semibold uppercase">Total Fee</p>
                          <p className="text-base font-bold text-slate-900 mt-0.5">₹{studentFeeDetails.totalPayable.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                          <p className="text-[10px] text-emerald-700 font-semibold uppercase">Total Paid</p>
                          <p className="text-base font-bold text-emerald-800 mt-0.5">₹{studentFeeDetails.totalPaid.toLocaleString()}</p>
                        </div>
                        <div className={`p-3 rounded-xl border text-center ${
                          studentFeeDetails.balanceDue > 0 
                            ? "bg-rose-50 border-rose-200" 
                            : "bg-emerald-50/70 border-emerald-200"
                        }`}>
                          <p className={`text-[10px] font-semibold uppercase ${
                            studentFeeDetails.balanceDue > 0 ? "text-rose-700" : "text-emerald-700"
                          }`}>Balance Due</p>
                          <p className={`text-base font-black mt-0.5 ${
                            studentFeeDetails.balanceDue > 0 ? "text-rose-800" : "text-emerald-800"
                          }`}>₹{studentFeeDetails.balanceDue.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Fee Heads Breakdown with 1-click Pay */}
                      {studentFeeDetails.headsBreakdown && studentFeeDetails.headsBreakdown.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                            <span>Applicable Fee Heads</span>
                            <span className="text-[11px] font-normal text-slate-400">Click to fill counter</span>
                          </p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {studentFeeDetails.headsBreakdown.map((head) => (
                              <div
                                key={head._id}
                                onClick={() => {
                                  setIsCustomHead(false);
                                  setFeeForm({
                                    ...feeForm,
                                    title: head.title,
                                    totalAmount: String(head.amount),
                                    paidAmount: String(head.balanceDue > 0 ? head.balanceDue : head.amount),
                                    remarks: `Fee payment for ${head.title}`,
                                  });
                                }}
                                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                  head.status === "paid"
                                    ? "bg-slate-50 border-slate-200 opacity-75 hover:opacity-100"
                                    : "bg-indigo-50/40 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50"
                                }`}
                              >
                                <div>
                                  <p className="font-semibold text-slate-900">{head.title}</p>
                                  <p className="text-[11px] text-slate-500">
                                    Fee: ₹{head.amount} • Paid: ₹{head.paidAmount} • <strong className={head.balanceDue > 0 ? "text-rose-700" : "text-emerald-700"}>Due: ₹{head.balanceDue}</strong>
                                  </p>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      head.status === "paid"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : head.status === "partial"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-indigo-100 text-indigo-800"
                                    }`}
                                  >
                                    {head.status}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Student Receipts */}
                      {studentFeeDetails.payments && studentFeeDetails.payments.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Past Receipts for this Student ({studentFeeDetails.payments.length})
                          </p>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {studentFeeDetails.payments.map((p) => (
                              <div
                                key={p._id}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs"
                              >
                                <div>
                                  <span className="font-mono font-bold text-indigo-700">{p.receiptNo}</span>
                                  <span className="text-slate-500 ml-2 font-medium">₹{p.paidAmount}</span>
                                  <span className="text-[10px] text-slate-400 ml-1.5">({new Date(p.paymentDate).toLocaleDateString()})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setReceiptToPrint(p)}
                                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1"
                                >
                                  <Printer className="w-3 h-3" />
                                  Print
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                  <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-600 text-sm">No Student Selected Yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click any student name from the list above or pick from the dropdown to load dues and record payment.
                  </p>
                </div>
              )}
            </div>

            {/* Fee Collection Form (Right Column: 7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  2. Cashier Fee Counter & Receipt Generator
                </h2>
                {selectedStudent ? (
                  <span className="text-xs font-semibold text-slate-500">
                    Recording for: <strong className="text-slate-900">{selectedStudent.personal.name}</strong>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Pick a student to begin
                  </span>
                )}
              </div>

              {!selectedStudent ? (
                <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">Cashier Counter Waiting for Student Selection</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Select a student name on the left panel (either directly from the list, or via the quick dropdown) to activate the billing counter.
                  </p>
                  {allStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectStudent(allStudents[0])}
                      className="mt-4 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                    >
                      Select First Student ({allStudents[0].personal?.name})
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCollectFee} className="space-y-4">
                  {/* Fee Head & Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Fee Head / Purpose *
                      </label>
                      <select
                        value={isCustomHead ? "custom" : feeForm.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "custom") {
                            setIsCustomHead(true);
                            return;
                          }
                          setIsCustomHead(false);

                          const matchingHead = studentFeeDetails?.headsBreakdown?.find((h) => h.title === val);
                          const matchingStructure = structures.find((s) => s.title === val);

                          let nextTotal = feeForm.totalAmount;
                          let nextPaid = feeForm.paidAmount;

                          if (matchingHead) {
                            nextTotal = String(matchingHead.amount);
                            nextPaid = String(matchingHead.balanceDue > 0 ? matchingHead.balanceDue : matchingHead.amount);
                          } else if (matchingStructure) {
                            nextTotal = String(matchingStructure.amount);
                            nextPaid = String(matchingStructure.amount);
                          }

                          setFeeForm({
                            ...feeForm,
                            title: val,
                            totalAmount: nextTotal,
                            paidAmount: nextPaid,
                            remarks: `Fee payment for ${val}`,
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        {/* Applicable heads for student */}
                        {studentFeeDetails?.headsBreakdown && studentFeeDetails.headsBreakdown.length > 0 && (
                          <optgroup label="Student's Applicable Fee Heads">
                            {studentFeeDetails.headsBreakdown.map((h) => (
                              <option key={h._id} value={h.title}>
                                {h.title} (Fee: ₹{h.amount} • Due: ₹{h.balanceDue})
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {/* General Structures */}
                        <optgroup label="All School Fee Structures">
                          {structures.map((s) => (
                            <option key={s._id} value={s.title}>
                              {s.title} (₹{s.amount} - {s.frequency})
                            </option>
                          ))}
                        </optgroup>

                        {/* Common fallbacks */}
                        <optgroup label="Other Standard Heads">
                          <option value="Monthly Tuition Fee">Monthly Tuition Fee</option>
                          <option value="Annual Development & Examination Fee">Annual Development & Examination Fee</option>
                          <option value="Science Laboratory & Equipment Fee">Science Laboratory & Equipment Fee</option>
                          <option value="Class 10 Board Registration Fee">Class 10 Board Registration Fee</option>
                          <option value="Admission & Prospectus Fee">Admission & Prospectus Fee</option>
                          <option value="Late Fee / Miscellaneous Charges">Late Fee / Miscellaneous Charges</option>
                        </optgroup>

                        <option value="custom">✏️ Other / Custom Purpose...</option>
                      </select>

                      {isCustomHead && (
                        <div className="mt-2">
                          <input
                            type="text"
                            required
                            placeholder="Enter custom fee head title (e.g. Sports Day Fee)..."
                            value={customHeadTitle}
                            onChange={(e) => setCustomHeadTitle(e.target.value)}
                            className="w-full bg-white border border-indigo-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Payment Mode *
                      </label>
                      <select
                        value={feeForm.paymentMode}
                        onChange={(e) => setFeeForm({ ...feeForm, paymentMode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="cash">Cash (Office Counter)</option>
                        <option value="upi">UPI / QR Code Scan</option>
                        <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
                        <option value="cheque">Cheque / Demand Draft</option>
                        <option value="online">Online Student Portal</option>
                      </select>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Total Fee Amount (₹) *
                      </label>
                      <input
                        type="number"
                        value={feeForm.totalAmount}
                        onChange={(e) => setFeeForm({ ...feeForm, totalAmount: e.target.value })}
                        required
                        min="1"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Amount Collected Now (₹) *
                      </label>
                      <input
                        type="number"
                        value={feeForm.paidAmount}
                        onChange={(e) => setFeeForm({ ...feeForm, paidAmount: e.target.value })}
                        required
                        min="1"
                        className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-2.5 text-sm text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                      {Number(feeForm.paidAmount) < Number(feeForm.totalAmount) ? (
                        <p className="text-[11px] text-amber-700 mt-1 font-medium">
                          ⚠️ Partial payment: ₹{Number(feeForm.totalAmount) - Number(feeForm.paidAmount)} will remain due
                        </p>
                      ) : (
                        <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                          ✓ Full payment: Clears this fee head completely
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-semibold">Quick Amounts:</span>
                    {studentFeeDetails && studentFeeDetails.balanceDue > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setFeeForm({
                            ...feeForm,
                            paidAmount: String(studentFeeDetails.balanceDue),
                            totalAmount: String(studentFeeDetails.balanceDue),
                          })
                        }
                        className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-semibold hover:bg-rose-100 transition-colors"
                      >
                        Full Due (₹{studentFeeDetails.balanceDue})
                      </button>
                    )}
                    {["350", "500", "800", "1200"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() =>
                          setFeeForm({
                            ...feeForm,
                            paidAmount: amt,
                            totalAmount: Number(feeForm.totalAmount) < Number(amt) ? amt : feeForm.totalAmount,
                          })
                        }
                        className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  {/* Transaction details & Remarks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Transaction / Cheque ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref / Cheque No / Bank Ref"
                        value={feeForm.transactionId}
                        onChange={(e) => setFeeForm({ ...feeForm, transactionId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Cashier Remarks / Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Received at counter, Oct fee cleared"
                        value={feeForm.remarks}
                        onChange={(e) => setFeeForm({ ...feeForm, remarks: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Submit Action Button */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      Receipt will be formally generated under{" "}
                      <strong className="text-slate-800">{selectedStudent.personal.name}</strong>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !selectedStudent}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50 text-sm"
                    >
                      <Receipt className="w-4 h-4" />
                      {loading ? "Recording..." : `Collect ₹${feeForm.paidAmount} & Print Receipt`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Transactions History */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4 sm:p-5">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt, student name or adm..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchPayments();
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-auto"
                >
                  <option value="all">All Payment Modes</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none w-full sm:w-auto"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Full Paid</option>
                  <option value="partial">Partial</option>
                </select>

                <button
                  onClick={fetchPayments}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors w-full sm:w-auto"
                >
                  Apply Filter
                </button>
              </div>
            </div>

            {/* Payments Table */}
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading fee payment records...</div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No payment transactions found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                {/* Desktop Payments Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        <th className="py-3 px-4">Receipt No</th>
                        <th className="py-3 px-4">Student Info</th>
                        <th className="py-3 px-4">Fee Head</th>
                        <th className="py-3 px-4">Amount Paid</th>
                        <th className="py-3 px-4">Mode</th>
                        <th className="py-3 px-4">Cashier</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {payments.map((p) => {
                        const studentName = p.studentId?.personal?.name || "Student";
                        const admNo = p.studentId?.admissionNo || "N/A";
                        const studentClass = p.studentId?.academic?.class;
                        return (
                          <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                              {p.receiptNo}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900">{studentName}</p>
                              <p className="text-[11px] text-slate-500">
                                Adm: <span className="font-mono">{admNo}</span>
                                {studentClass ? ` • Cl ${studentClass}` : ""}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">
                              {p.title}
                              {p.remarks && <p className="text-[10px] text-slate-400">{p.remarks}</p>}
                            </td>
                            <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                              ₹{p.paidAmount?.toLocaleString()}
                              {p.totalAmount && p.totalAmount > p.paidAmount && (
                                <span className="block text-[10px] font-normal text-rose-600">
                                  (Due: ₹{p.totalAmount - p.paidAmount})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="capitalize px-2.5 py-1 text-[11px] rounded-full bg-slate-100 text-slate-700 font-semibold">
                                {p.paymentMode}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-medium">
                              {p.collectedBy?.name || "Counter Admin"}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setReceiptToPrint(p)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Receipt
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Transaction Cards View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {payments.map((p) => {
                    const studentName = p.studentId?.personal?.name || "Student";
                    const admNo = p.studentId?.admissionNo || "N/A";
                    const studentClass = p.studentId?.academic?.class;
                    return (
                      <div key={p._id} className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {p.receiptNo}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm text-slate-900">{studentName}</p>
                            <p className="text-xs text-slate-500">
                              Adm: <span className="font-mono">{admNo}</span>
                              {studentClass ? ` • Class ${studentClass}` : ""}
                            </p>
                            <p className="text-xs text-slate-700 font-medium mt-0.5">{p.title}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-black text-emerald-700">
                              ₹{p.paidAmount?.toLocaleString()}
                            </p>
                            <span className="capitalize px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-semibold inline-block mt-0.5">
                              {p.paymentMode}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400">
                            By {p.collectedBy?.name || "Cashier"}
                          </span>
                          <button
                            onClick={() => setReceiptToPrint(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>View Receipt</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Fee Structures Setup */}
        {activeTab === "structures" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Configured Fee Heads & Schedules</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establish standard institutional fee heads, tuition charges, and exam fees for Dulichand Sonadevi High School
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setIsStructureModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add New Fee Head
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {structures.map((s) => (
                <div key={s._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold uppercase">
                      {s.frequency}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-emerald-700">
                    ₹{s.amount.toLocaleString()}
                  </div>

                  <p className="text-xs text-slate-500">
                    Applicable to: <strong className="text-slate-800">{s.class === "all" ? "All Classes (8, 9, 10)" : `Class ${s.class}`}</strong>
                  </p>

                  {s.description && (
                    <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">{s.description}</p>
                  )}

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDeleteStructure(s._id)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Head
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Printable Official Money Receipt (Guaranteed 1-Page A4) */}
        {receiptToPrint && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
              {/* Modal Top Bar */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      Official Money Receipt
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">
                      ✓ Guaranteed 1-Page A4 Print
                    </span>
                  </div>
                </div>

                {/* Print Layout Toggle */}
                <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setReceiptCopyMode("single")}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                      receiptCopyMode === "single"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="hidden sm:inline">📄 Single Receipt (1-Page)</span>
                    <span className="sm:hidden">📄 1-Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptCopyMode("double")}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                      receiptCopyMode === "double"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="hidden sm:inline">📑 2-in-1 (Student + Office)</span>
                    <span className="sm:hidden">📑 2-in-1</span>
                  </button>
                </div>

                <button
                  onClick={() => setReceiptToPrint(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Receipt Root (Strictly formatted to print on 1 single page) */}
              <div id="printable-receipt-root" className="p-4 sm:p-6 overflow-y-auto bg-white max-h-[75vh]">
                {receiptCopyMode === "single" ? (
                  // Single 1-Page Full Receipt
                  renderReceiptCard(receiptToPrint, "OFFICIAL MONEY RECEIPT", false)
                ) : (
                  // Double 2-in-1 Copies on Single 1-Page Sheet (Student Copy + Office Copy)
                  <div className="space-y-3">
                    {renderReceiptCard(receiptToPrint, "ORIGINAL • STUDENT COPY", true)}

                    {/* Tear / Cut Divider */}
                    <div className="py-1 text-center flex items-center justify-center gap-2 text-slate-400 text-[10px] font-mono">
                      <span>✂ - - - - - - - - - - - - - - - - - - - - - - - - -</span>
                      <span className="font-bold text-slate-500 uppercase tracking-wider">Cut / Tear Along This Line</span>
                      <span>- - - - - - - - - - - - - - - - - - - - - - - - - ✂</span>
                    </div>

                    {renderReceiptCard(receiptToPrint, "DUPLICATE • OFFICE COUNTER COPY", true)}
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden">
                <p className="text-xs text-slate-500 hidden sm:block">
                  Click below or press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Ctrl+P</kbd> to print.
                </p>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setReceiptToPrint(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all hover:shadow-lg"
                  >
                    <Printer className="w-4 h-4" />
                    Print 1-Page Receipt (A4)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Fee Structure */}
        {isStructureModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">Add New Fee Head Structure</h3>
                <button
                  onClick={() => setIsStructureModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStructure} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fee Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Lab & Smart Class Fee"
                    value={structureForm.title}
                    onChange={(e) => setStructureForm({ ...structureForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Applicable Class *
                    </label>
                    <select
                      value={structureForm.class}
                      onChange={(e) => setStructureForm({ ...structureForm, class: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="all">All Classes (8, 9, 10)</option>
                      <option value="8">Class 8</option>
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500"
                      value={structureForm.amount}
                      onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={structureForm.frequency}
                    onChange={(e) => setStructureForm({ ...structureForm, frequency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="term">Term / Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="one_time">One Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description / Purpose
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Details about books, exams, lab maintenance..."
                    value={structureForm.description}
                    onChange={(e) => setStructureForm({ ...structureForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsStructureModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
                  >
                    {loading ? "Saving..." : "Save Fee Head"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  </ProtectedRoute>
  );
}
