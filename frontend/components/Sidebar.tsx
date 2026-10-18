"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  CreditCard,
  Award,
  Clock,
  BookOpen,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield
} from "lucide-react";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export const Sidebar = () => {
  const { user, token, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Change Password Modal State
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
  const [pwdTab, setPwdTab] = useState<"self" | "superadmin">("self");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  // Super Admin Universal Reset State
  const [targetType, setTargetType] = useState<"staff" | "student">("staff");
  const [targetIdentifier, setTargetIdentifier] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [allUsersList, setAllUsersList] = useState<any[]>([]);
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [fetchingTargets, setFetchingTargets] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;

  const handleOpenModal = () => {
    setPwdError("");
    setPwdSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setAdminNewPassword("");
    setTargetIdentifier("");
    setPwdTab("self");
    setIsChangePwdOpen(true);
    setIsOpen(false);

    if (isSuperAdmin && token) {
      loadAdminTargets();
    }
  };

  const loadAdminTargets = async () => {
    try {
      setFetchingTargets(true);
      const [usersRes, studentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/students?status=all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (usersRes.ok) {
        const uData = await usersRes.json();
        if (Array.isArray(uData)) setAllUsersList(uData);
      }
      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        if (Array.isArray(sData)) setAllStudentsList(sData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingTargets(false);
    }
  };

  const handleSelfPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters long");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");

      setPwdSuccess("Your password has been changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setIsChangePwdOpen(false);
        setPwdSuccess("");
      }, 2000);
    } catch (err: any) {
      setPwdError(err.message || "Error changing password");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSuperAdminResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!targetIdentifier) {
      setPwdError(`Please select the ${targetType} to reset`);
      return;
    }

    if (adminNewPassword.length < 4) {
      setPwdError("New password must be at least 4 characters long");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/superadmin-reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType,
          targetId: targetIdentifier,
          newPassword: adminNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      setPwdSuccess(data.message || "Password reset successfully!");
      setAdminNewPassword("");
      setTargetIdentifier("");
      setTimeout(() => {
        setIsChangePwdOpen(false);
        setPwdSuccess("");
      }, 2500);
    } catch (err: any) {
      setPwdError(err.message || "Error resetting password");
    } finally {
      setPwdLoading(false);
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admissions", label: "Admissions", icon: UserPlus },
    { href: "/students", label: "Students", icon: Users },
    ...(isAdmin ? [{ href: "/classes", label: "Classes & Subjects", icon: BookOpen }] : []),
    ...(isAdmin ? [{ href: "/fees", label: "Fees & Billing", icon: CreditCard }] : []),
    { href: "/exams", label: "Examinations & Marks", icon: Award },
    ...(isAdmin ? [{ href: "/certificates", label: "Certificates (TC)", icon: FileText }] : []),
    { href: "/timetable", label: "Class Timetable", icon: Clock },
    { href: "/faculty", label: "Faculty & Staff", icon: Users },
    ...(isAdmin ? [{ href: "/sessions", label: "Academic Sessions", icon: Calendar }] : []),
    ...(isAdmin ? [{ href: "/audit-logs", label: "Audit Logs", icon: FileText }] : []),
    ...(isSuperAdmin ? [{ href: "/settings", label: "Settings", icon: Settings }] : []),
  ];

  return (
    <>
      {/* Mobile Top App Header for Phones */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md shrink-0 print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(true)}
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
            <span className="font-bold text-sm tracking-tight text-slate-100 truncate max-w-[170px]">
              Dulichand Sonadevi
            </span>
          </div>
        </div>

        {/* User Role Badge & Avatar Shortcut on Mobile */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {user?.role?.replace("_", " ") || "Staff"}
          </span>
          <button
            onClick={handleOpenModal}
            className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm"
            title="Change Password"
          >
            {user?.name?.charAt(0) || "U"}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity print:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:z-40 w-72 max-w-[85vw] md:w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-800 print:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
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
              <p className="text-[11px] text-slate-400 font-medium">High School ERP</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close Navigation"
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollable if needed) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 min-h-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all text-base font-bold tracking-tight ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                    : "text-slate-200 hover:text-white hover:bg-slate-800/90"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Pinned User Profile & Quick Actions */}
        <div className="p-3.5 border-t border-slate-800/90 bg-slate-950/80 shrink-0 space-y-2.5">
          <div className="flex items-center gap-3 px-1.5 py-1">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm uppercase shadow">
                {user?.name?.charAt(0) || "U"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-100 truncate">{user?.name || "User"}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                    isSuperAdmin
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {user?.role?.replace("_", " ") || "Staff"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleOpenModal}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 transition-all text-xs font-bold border border-slate-800 shadow-xs"
              title="Change Password"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Password</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-slate-300 hover:text-red-300 bg-slate-900 hover:bg-red-500/10 transition-all text-xs font-bold border border-slate-800 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
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
                  <h3 className="text-base font-black text-slate-900">Password Management</h3>
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

            {/* Super Admin Tab Selector */}
            {isSuperAdmin && (
              <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPwdTab("self");
                    setPwdError("");
                    setPwdSuccess("");
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    pwdTab === "self"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  My Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPwdTab("superadmin");
                    setPwdError("");
                    setPwdSuccess("");
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    pwdTab === "superadmin"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-300" />
                  Super Admin Override (Everyone)
                </button>
              </div>
            )}

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

            {/* TAB 1: Self Password Change */}
            {pwdTab === "self" && (
              <form onSubmit={handleSelfPasswordSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input w-full text-sm"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePwdOpen(false)}
                    className="btn btn-secondary flex-1 text-xs py-2.5 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-2"
                  >
                    {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>{pwdLoading ? "Updating..." : "Update My Password"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Super Admin Override (Everyone) */}
            {pwdTab === "superadmin" && (
              <form onSubmit={handleSuperAdminResetSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 leading-relaxed">
                  👑 <strong>Super Admin Authority:</strong> You can change the password of ANY staff member or student directly without needing their old password.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Target Account Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType("staff");
                        setTargetIdentifier("");
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        targetType === "staff"
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      Staff / Faculty Member
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType("student");
                        setTargetIdentifier("");
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        targetType === "student"
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      Student Account
                    </button>
                  </div>
                </div>

                {targetType === "staff" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Staff / Faculty Member *
                    </label>
                    <select
                      value={targetIdentifier}
                      onChange={(e) => setTargetIdentifier(e.target.value)}
                      className="input w-full text-xs font-medium"
                      required
                    >
                      <option value="">-- Choose Staff Member ({allUsersList.length}) --</option>
                      {allUsersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role?.replace("_", " ")}) - {u.employeeId || u.mobile}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Student *
                    </label>
                    <select
                      value={targetIdentifier}
                      onChange={(e) => setTargetIdentifier(e.target.value)}
                      className="input w-full text-xs font-medium"
                      required
                    >
                      <option value="">-- Choose Student ({allStudentsList.length}) --</option>
                      {allStudentsList.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.personal?.name} (Class {s.academic?.class}-{s.academic?.section || "A"}) - ID: {s.studentId} / Adm: {s.admissionNo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Set New Password *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    placeholder="Enter new password to assign"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="input w-full text-sm font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The user will immediately be able to log in using this new password.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePwdOpen(false)}
                    className="btn btn-secondary flex-1 text-xs py-2.5 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-2"
                  >
                    {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    <span>{pwdLoading ? "Resetting..." : "Reset User Password"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
