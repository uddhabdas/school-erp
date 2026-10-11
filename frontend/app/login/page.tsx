"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useParentAuth } from "@/context/ParentAuthContext";
import {
  ShieldCheck,
  GraduationCap,
  HeartHandshake,
  Lock,
  Mail,
  User,
  Phone,
  CreditCard,
  Eye,
  EyeOff,
  Sparkles,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  FileSearch,
  UserPlus,
  ArrowRight,
  School,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  KeyRound
} from "lucide-react";

type LoginType = "admin" | "student" | "parent";

export default function Login() {
  const { login: adminLogin } = useAuth();
  const { login: studentLogin } = useStudentAuth();
  const { login: parentLogin } = useParentAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<LoginType>("admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo accounts drawer state
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);

  // Help & Forgot password modal state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Load remember me identifier on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp_remember_login");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.identifier) {
          setIdentifier(parsed.identifier);
          if (parsed.tab) setActiveTab(parsed.tab);
          setRememberMe(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleTabChange = (tab: LoginType) => {
    setActiveTab(tab);
    setError("");
    // If not remembered, clear inputs
    if (!rememberMe) {
      setIdentifier("");
      setPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (rememberMe) {
        localStorage.setItem(
          "erp_remember_login",
          JSON.stringify({ identifier, tab: activeTab })
        );
      } else {
        localStorage.removeItem("erp_remember_login");
      }

      if (activeTab === "admin") {
        await adminLogin(identifier, password);
        router.push("/dashboard");
      } else if (activeTab === "student") {
        await studentLogin(identifier, password);
        router.push("/student-dashboard");
      } else if (activeTab === "parent") {
        await parentLogin(identifier, password);
        router.push("/parent-dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (tab: LoginType, idVal: string, pwdVal: string) => {
    setActiveTab(tab);
    setIdentifier(idVal);
    setPassword(pwdVal);
    setError("");
    setShowDemoDrawer(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl"></div>
      </div>

      {/* Main Split Authentication Wrapper */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col lg:flex-row">
        
        {/* ======================================================== */}
        {/* LEFT PANEL: SCHOOL SHOWCASE & 5T INSTITUTION HERO        */}
        {/* ======================================================== */}
        <div className="lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="relative z-10 space-y-6">
            {/* School Emblem & Brand */}
            <div className="flex items-center gap-3.5">
              <img
                src="/5tlogo.png"
                alt="5T Odisha Logo"
                className="h-14 w-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg shrink-0"
              />
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Govt. of Odisha • 5T Initiative
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight mt-1 text-slate-100">
                  Dulichand Sonadevi
                </h1>
                <p className="text-xs text-slate-400 font-medium">High School ERP Portal</p>
              </div>
            </div>

            {/* Institution Highlight Statement */}
            <div className="pt-2 pb-1">
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                Unified Digital Academic & Administrative Management System
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Empowering students, faculty, and parents with real-time academic records, biometric attendance, DBT scholarships, and fee ledger automation.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Student & Academic Dossier</h3>
                  <p className="text-[11px] text-slate-400">1-Page A4 printable marksheet & curriculum progress.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Fee Ledger & Official Receipts</h3>
                  <p className="text-[11px] text-slate-400">Cashier verified payment vouchers & DBT Aadhaar seeding.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Live Period Timetable</h3>
                  <p className="text-[11px] text-slate-400">Daily subject schedule, room allocations & class routines.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Info */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Ranamunduli, Basta, Balasore, Odisha - 756029</span>
            </p>
            <p className="flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Office Helpline: +91 98765 43210</span>
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: INTERACTIVE ROLE LOGIN FORM                */}
        {/* ======================================================== */}
        <div className="lg:w-7/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white">
          <div>
            {/* Top Header & Role Switcher */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Sign In to ERP
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose your role to access your dedicated portal
                </p>
              </div>

              {/* Help & Support Button */}
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 text-xs font-bold transition shadow-xs"
                title="Help & Login Guide"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Help</span>
              </button>
            </div>

            {/* Role Tabs */}
            <div className="flex gap-1.5 sm:gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5 border border-slate-200/80">
              {[
                { id: "admin", label: "Staff & Faculty", short: "Staff", icon: ShieldCheck, color: "blue" },
                { id: "student", label: "Student", short: "Student", icon: GraduationCap, color: "blue" },
                { id: "parent", label: "Parent", short: "Parent", icon: HeartHandshake, color: "indigo" }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id as LoginType)}
                    className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.short}</span>
                  </button>
                );
              })}
            </div>

            {/* Demo Quick-Fill Accordion */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowDemoDrawer(!showDemoDrawer)}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/90 transition"
              >
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Demo Credentials</span>
                </span>
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <span>{showDemoDrawer ? "Hide" : "Show One-Click Logins"}</span>
                  {showDemoDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {showDemoDrawer && (
                <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 animate-in fade-in">
                  <p className="text-[11px] text-slate-500 font-medium">Click any account below to autofill and test immediately:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => fillDemo("admin", "admin@school.com", "admin123")}
                      className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs group-hover:text-blue-700">Admin</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-extrabold uppercase">Staff</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">admin@school.com</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillDemo("student", "2345678903", "01-01-2010")}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left transition group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs group-hover:text-emerald-700">Student</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold uppercase">Learner</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">ID: 2345678903</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => fillDemo("parent", "9876543201", "01-01-2010")}
                      className="p-2 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-left transition group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs group-hover:text-purple-700">Parent</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-extrabold uppercase">Family</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">Mob: 9876543201</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Identifier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {activeTab === "admin" && "Staff Email / Mobile / Employee ID"}
                  {activeTab === "student" && "Student Aadhaar / Admission No"}
                  {activeTab === "parent" && "Registered Parent Mobile Number"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {activeTab === "admin" && <Mail className="w-4 h-4" />}
                    {activeTab === "student" && <CreditCard className="w-4 h-4" />}
                    {activeTab === "parent" && <Phone className="w-4 h-4" />}
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder={
                      activeTab === "admin"
                        ? "e.g. admin@school.com or employee ID"
                        : activeTab === "student"
                        ? "e.g. 2345678903 or ADM-2024-0002"
                        : "e.g. 9876543201 or student ID"
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none transition"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {activeTab === "admin"
                      ? "Password"
                      : activeTab === "student"
                      ? "Password (DOB: DD-MM-YYYY)"
                      : "Password (Child DOB: DD-MM-YYYY)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={
                      activeTab === "admin"
                        ? "Enter your secure password"
                        : "e.g. 01-01-2010"
                    }
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {(activeTab === "student" || activeTab === "parent") && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-slate-400" />
                    <span>Format: DD-MM-YYYY (e.g. <strong>01-01-2010</strong>) or your custom password</span>
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Remember my credentials</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to {activeTab === "admin" ? "Staff ERP" : activeTab === "student" ? "Student Portal" : "Parent Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Quick Links (Admission & Website) */}
          <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/track-admission"
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold flex items-center justify-center gap-1.5 transition text-center"
              >
                <FileSearch className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Track Admission</span>
              </Link>
              <Link
                href="/admissions/apply"
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold flex items-center justify-center gap-1.5 transition text-center"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Online Admission</span>
              </Link>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <Link href="/" className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
                <School className="w-3.5 h-3.5" />
                <span>Return to School Homepage</span>
              </Link>
              <span className="text-slate-400">🔒 256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* HELP & FORGOT PASSWORD MODAL                             */}
      {/* ======================================================== */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">ERP Access & Login Help</h3>
                  <p className="text-xs text-slate-500">Credential guides & contact information</p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Guidance Sections */}
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Student Portal Credentials</span>
                </h4>
                <p className="text-blue-800 leading-relaxed">
                  Your <strong>Identifier</strong> is your 10-digit Student ID or 12-digit Aadhaar Number. Default password is your <strong>Date of Birth in DD-MM-YYYY</strong> format (e.g. 01-01-2010). If you have changed your password and forgotten it, contact your Class Teacher or the School Computer Lab.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-1">
                <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-purple-600" />
                  <span>Parent Portal Credentials</span>
                </h4>
                <p className="text-purple-800 leading-relaxed">
                  Use the <strong>10-digit Mobile Number</strong> registered during school admission. Your password is your <strong>Child's Date of Birth (DD-MM-YYYY)</strong>. If your phone number has changed, please bring verification to the School Administration Desk.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span>Staff & Faculty Members</span>
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Faculty and Admin logins are managed through official school emails or Employee IDs. For master password resets, please approach the Headmaster or Super Administrator.
                </p>
              </div>
            </div>

            {/* Official Support Desk */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400">School Administrative Desk</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone: +91 98765 43210</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>helpdesk@dulichand.edu</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mon - Sat: 9:00 AM - 4:00 PM</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Basta, Balasore, Odisha</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
