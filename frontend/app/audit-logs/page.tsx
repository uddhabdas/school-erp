"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  FileText,
  RefreshCw,
  Search,
  Clock,
  User as UserIcon,
  Shield,
  AlertCircle,
  Eye,
  X,
  Download,
  Trash2,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Activity,
  LogIn,
  PlusCircle,
  Edit3,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Lock,
  Archive,
  Calendar,
  GraduationCap,
  Users,
  Settings as SettingsIcon,
  ShieldAlert,
  Info
} from "lucide-react";

type AuditLog = {
  _id: string;
  user: {
    _id: string;
    name: string;
    role: string;
    email?: string;
    employeeId?: string;
  } | null;
  action: string;
  collection: string;
  documentId?: string;
  oldData?: any;
  newData?: any;
  timestamp: string;
};

type AuditStats = {
  totalAll: number;
  todayCount: number;
  actions: { _id: string; count: number }[];
  collections: { _id: string; count: number }[];
};

export default function AuditLogsPage() {
  const { token, user, logout } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  // Data states
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pages, setPages] = useState(1);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [dateRange, setDateRange] = useState("all");

  // UI modal states
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [diffViewMode, setDiffViewMode] = useState<"formatted" | "raw">("formatted");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Clear modal states (Super Admin)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearRetention, setClearRetention] = useState("30");
  const [clearSecurityCode, setClearSecurityCode] = useState("");
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState("");

  // Notification states
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch logs with query params
  const fetchLogs = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (actionFilter) params.append("action", actionFilter);
      if (collectionFilter) params.append("collection", collectionFilter);

      // Date calculations
      if (dateRange === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.append("startDate", today.toISOString());
      } else if (dateRange === "7days") {
        const last7 = new Date();
        last7.setDate(last7.getDate() - 7);
        last7.setHours(0, 0, 0, 0);
        params.append("startDate", last7.toISOString());
      } else if (dateRange === "30days") {
        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);
        last30.setHours(0, 0, 0, 0);
        params.append("startDate", last30.toISOString());
      }

      const res = await fetch(`${API_BASE_URL}/dashboard/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        if (res.status === 403) {
          throw new Error("Access Denied: Only administrators have permission to view System Audit Logs.");
        }
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to load logs (${res.status})`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setLogs(data);
        setTotal(data.length);
        setPages(1);
      } else {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, page, limit, debouncedSearch, actionFilter, collectionFilter, dateRange]);

  // Handle Purge / Clear Logs
  const handleClearLogs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clearSecurityCode) {
      setClearError("Master security code is required");
      return;
    }

    try {
      setClearing(true);
      setClearError("");

      const res = await fetch(`${API_BASE_URL}/dashboard/audit-logs`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          securityCode: clearSecurityCode,
          retentionDays: clearRetention === "all" ? 0 : parseInt(clearRetention, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to clear audit logs");
      }

      setSuccessMsg(data.message || "Audit logs successfully purged");
      setIsClearModalOpen(false);
      setClearSecurityCode("");
      fetchLogs();

      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setClearError(err.message || "Failed to clear audit logs");
    } finally {
      setClearing(false);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ["ID", "Timestamp", "Admin Name", "Admin Role", "Admin Email", "Action", "Target Entity", "Document ID", "Details"];
    const rows = logs.map((log) => [
      `"${log._id}"`,
      `"${new Date(log.timestamp).toLocaleString()}"`,
      `"${log.user?.name || "System"}"`,
      `"${log.user?.role || "automated"}"`,
      `"${log.user?.email || ""}"`,
      `"${log.action}"`,
      `"${log.collection}"`,
      `"${log.documentId || ""}"`,
      `"${JSON.stringify(log.newData || log.oldData || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `school_erp_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Helper
  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `school_erp_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Relative time helper
  const getRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Action Badge Helper
  const renderActionBadge = (action: string) => {
    const act = action?.toLowerCase();
    switch (act) {
      case "login":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <LogIn className="w-3 h-3 text-sky-500" /> Login
          </span>
        );
      case "create":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle className="w-3 h-3 text-emerald-500" /> Create
          </span>
        );
      case "update":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Edit3 className="w-3 h-3 text-blue-500" /> Update
          </span>
        );
      case "delete":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3 text-rose-500" /> Delete
          </span>
        );
      case "approve":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-500" /> Approve
          </span>
        );
      case "reject":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <XCircle className="w-3 h-3 text-amber-600" /> Reject
          </span>
        );
      case "promote":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <ArrowUpRight className="w-3 h-3 text-purple-500" /> Promote
          </span>
        );
      case "close":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            <Lock className="w-3 h-3 text-orange-500" /> Close
          </span>
        );
      case "archive":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            <Archive className="w-3 h-3 text-slate-500" /> Archive
          </span>
        );
      case "clear":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300">
            <ShieldAlert className="w-3 h-3 text-red-600" /> Purge Logs
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-200 capitalize">
            {action}
          </span>
        );
    }
  };

  // Entity Icon Helper
  const renderEntityBadge = (collection: string) => {
    switch (collection) {
      case "Student":
        return (
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <div className="p-1 rounded-lg bg-blue-100 text-blue-700">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span>Student</span>
          </div>
        );
      case "User":
        return (
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span>Staff / User</span>
          </div>
        );
      case "AdmissionApplication":
        return (
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <div className="p-1 rounded-lg bg-purple-100 text-purple-700">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span>Admission Application</span>
          </div>
        );
      case "AcademicSession":
        return (
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <div className="p-1 rounded-lg bg-amber-100 text-amber-700">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span>Academic Session</span>
          </div>
        );
      case "SchoolSetting":
        return (
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <div className="p-1 rounded-lg bg-indigo-100 text-indigo-700">
              <SettingsIcon className="w-3.5 h-3.5" />
            </div>
            <span>School Settings</span>
          </div>
        );
      case "AuditLog":
        return (
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <div className="p-1 rounded-lg bg-rose-100 text-rose-700">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span>Audit Trail</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span>{collection}</span>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">System Audit Logs</h1>
                <p className="text-sm text-slate-500">
                  Comprehensive audit trail of security events, administrative updates, and user modifications
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="btn btn-secondary flex items-center gap-2 py-2 px-3.5 text-xs font-semibold text-slate-700 shadow-sm"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="btn btn-secondary flex items-center gap-2 py-2 px-3.5 text-xs font-semibold text-slate-700 shadow-sm"
              title="Export visible records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              CSV
            </button>

            <button
              onClick={handleExportJSON}
              disabled={logs.length === 0}
              className="btn btn-secondary flex items-center gap-2 py-2 px-3.5 text-xs font-semibold text-slate-700 shadow-sm"
              title="Export visible records as JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              JSON
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setIsClearModalOpen(true)}
                className="btn bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold shadow-sm transition-all"
                title="Purge historical audit logs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Purge Logs
              </button>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {error.includes("sign in") || error.includes("session") || error.includes("expired") || error.includes("Unauthorized") ? (
              <button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs px-3.5 py-1.5 font-bold rounded-xl shadow-sm transition-all"
              >
                Log In Again
              </button>
            ) : (
              <button onClick={() => setError("")} className="p-1 hover:bg-rose-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="p-1 hover:bg-emerald-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats KPI Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 border border-slate-200/80 bg-white shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Events</div>
              <div className="text-xl font-black text-slate-900">{stats?.totalAll ?? total}</div>
            </div>
          </div>

          <div className="card p-4 border border-slate-200/80 bg-white shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Activity</div>
              <div className="text-xl font-black text-emerald-700">{stats?.todayCount ?? 0}</div>
            </div>
          </div>

          <div className="card p-4 border border-slate-200/80 bg-white shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Events</div>
              <div className="text-xl font-black text-purple-700">
                {(stats?.actions?.find(a => a._id === "login")?.count || 0) +
                 (stats?.actions?.find(a => a._id === "clear")?.count || 0)}
              </div>
            </div>
          </div>

          <div className="card p-4 border border-slate-200/80 bg-white shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Modifications</div>
              <div className="text-xl font-black text-amber-700">
                {(stats?.actions?.find(a => a._id === "create")?.count || 0) +
                 (stats?.actions?.find(a => a._id === "update")?.count || 0) +
                 (stats?.actions?.find(a => a._id === "delete")?.count || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="card p-4 border border-slate-200/80 bg-white shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by actor name, email, action, entity, or document ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 pr-9 w-full text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Filter */}
            <div className="md:col-span-2">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="input w-full text-sm font-medium text-slate-700"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
                <option value="promote">Promote</option>
                <option value="close">Close</option>
                <option value="archive">Archive</option>
                <option value="clear">Purge</option>
              </select>
            </div>

            {/* Target Collection / Entity */}
            <div className="md:col-span-3">
              <select
                value={collectionFilter}
                onChange={(e) => {
                  setCollectionFilter(e.target.value);
                  setPage(1);
                }}
                className="input w-full text-sm font-medium text-slate-700"
              >
                <option value="">All Target Entities</option>
                <option value="Student">Student</option>
                <option value="User">Staff / User</option>
                <option value="AdmissionApplication">Admission Application</option>
                <option value="AcademicSession">Academic Session</option>
                <option value="SchoolSetting">School Setting</option>
                <option value="AuditLog">Audit Log</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setPage(1);
                }}
                className="input w-full text-sm font-medium text-slate-700"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>

          {(actionFilter || collectionFilter || dateRange !== "all" || debouncedSearch) && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Active Filters:</span>
                {actionFilter && (
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                    action: {actionFilter}
                  </span>
                )}
                {collectionFilter && (
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                    entity: {collectionFilter}
                  </span>
                )}
                {dateRange !== "all" && (
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                    time: {dateRange}
                  </span>
                )}
                {debouncedSearch && (
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                    query: "{debouncedSearch}"
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearch("");
                  setActionFilter("");
                  setCollectionFilter("");
                  setDateRange("all");
                  setPage(1);
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="card py-20 flex flex-col items-center justify-center gap-3 border border-slate-200/80 bg-white">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading audit log records...</p>
          </div>
        ) : (
          <div className="card overflow-hidden shadow-sm border border-slate-200/80 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Performed By
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Target Entity
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Document ID
                    </th>
                    <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {logs.map((log) => {
                    const hasData = Boolean(log.oldData || log.newData);
                    const userInitial = (log.user?.name || "S").charAt(0).toUpperCase();

                    return (
                      <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Timestamp */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 pl-5">
                            <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">{getRelativeTime(log.timestamp)}</span>
                          </div>
                        </td>

                        {/* Performed By */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                              {userInitial}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {log.user?.name || "System Automated"}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="capitalize font-medium text-slate-600">
                                  {log.user?.role?.replace("_", " ") || "system"}
                                </span>
                                {log.user?.email && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-400">{log.user.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {renderActionBadge(log.action)}
                        </td>

                        {/* Target Entity */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {renderEntityBadge(log.collection)}
                        </td>

                        {/* Document ID */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {log.documentId ? (
                            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600">
                              <span>...{String(log.documentId).slice(-8)}</span>
                              <button
                                onClick={() => handleCopy(String(log.documentId), log._id)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition-all"
                                title="Copy Document ID"
                              >
                                {copiedKey === log._id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </td>

                        {/* Details Action */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          {hasData ? (
                            <button
                              onClick={() => {
                                setSelectedLog(log);
                                setDiffViewMode("formatted");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Changes
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No diff data</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-10 h-10 text-slate-300" />
                          <div className="font-bold text-slate-800 text-base">No audit events found</div>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Try adjusting your search criteria, selecting "All Actions", or changing the date filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>
                  Showing <strong className="text-slate-900">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to{" "}
                  <strong className="text-slate-900">{Math.min(page * limit, total)}</strong> of{" "}
                  <strong className="text-slate-900">{total}</strong> records
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <div className="text-xs font-bold text-slate-700 px-2">
                  Page {page} of {pages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="btn btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Details Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  {renderActionBadge(selectedLog.action)}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span>{selectedLog.collection} Mutation</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Executed at {new Date(selectedLog.timestamp).toLocaleString()} ({getRelativeTime(selectedLog.timestamp)})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-slate-200/60 rounded-xl transition-all text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Meta Cards: Actor & Entity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Initiating Actor
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                        {(selectedLog.user?.name || "S").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{selectedLog.user?.name || "System"}</div>
                        <div className="text-xs text-slate-500 capitalize">
                          {selectedLog.user?.role?.replace("_", " ") || "Automated Process"}
                        </div>
                        {selectedLog.user?.email && (
                          <div className="text-xs text-slate-400">{selectedLog.user.email}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Target Document
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-800">
                        Collection: <span className="font-mono text-blue-700">{selectedLog.collection}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <span>ID:</span>
                        <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-700">
                          {selectedLog.documentId || selectedLog._id}
                        </code>
                        <button
                          onClick={() => handleCopy(String(selectedLog.documentId || selectedLog._id), "modal-id")}
                          className="p-1 hover:text-blue-600 rounded text-slate-400"
                          title="Copy ID"
                        >
                          {copiedKey === "modal-id" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diff View Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDiffViewMode("formatted")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                          diffViewMode === "formatted"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Formatted State
                      </button>
                      <button
                        onClick={() => setDiffViewMode("raw")}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                          diffViewMode === "raw"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Raw JSON Inspector
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(
                            { oldData: selectedLog.oldData, newData: selectedLog.newData },
                            null,
                            2
                          ),
                          "full-payload"
                        )
                      }
                      className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold"
                    >
                      {copiedKey === "full-payload" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied Payload
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy JSON
                        </>
                      )}
                    </button>
                  </div>

                  {diffViewMode === "formatted" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Old State */}
                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                        <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Previous State
                        </div>
                        {selectedLog.oldData ? (
                          <div className="space-y-2 text-xs">
                            {Object.entries(selectedLog.oldData).map(([k, v]) => {
                              if (k === "__v" || k === "password") return null;
                              return (
                                <div key={k} className="flex flex-col bg-white p-2 rounded-xl border border-rose-100/80">
                                  <span className="text-slate-400 font-mono text-[11px]">{k}</span>
                                  <span className="text-slate-800 font-medium break-all">
                                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic py-6 text-center">
                            No previous state (new record creation)
                          </div>
                        )}
                      </div>

                      {/* New State */}
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                        <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          New State / Payload
                        </div>
                        {selectedLog.newData ? (
                          <div className="space-y-2 text-xs">
                            {Object.entries(selectedLog.newData).map(([k, v]) => {
                              if (k === "__v" || k === "password") return null;
                              return (
                                <div key={k} className="flex flex-col bg-white p-2 rounded-xl border border-emerald-100/80">
                                  <span className="text-slate-400 font-mono text-[11px]">{k}</span>
                                  <span className="text-slate-800 font-medium break-all">
                                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic py-6 text-center">
                            No new state (record deleted or purged)
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedLog.oldData && (
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase mb-1">Previous Data (JSON):</div>
                          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs overflow-x-auto max-h-56 font-mono">
                            {JSON.stringify(selectedLog.oldData, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedLog.newData && (
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase mb-1">New Data (JSON):</div>
                          <pre className="p-4 bg-slate-900 text-blue-300 rounded-2xl text-xs overflow-x-auto max-h-56 font-mono">
                            {JSON.stringify(selectedLog.newData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="btn btn-secondary px-5 py-2 text-xs font-semibold"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Purge Modal */}
        {isClearModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
              <div className="p-6 border-b border-slate-100 bg-rose-50/50">
                <div className="flex items-center gap-3 text-rose-700">
                  <div className="p-2.5 bg-rose-100 rounded-2xl">
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-rose-900">Purge Audit Logs</h3>
                    <p className="text-xs text-rose-600">Restricted Super Admin action</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleClearLogs} className="p-6 space-y-4">
                {clearError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{clearError}</span>
                  </div>
                )}

                <div className="text-xs text-slate-600 leading-relaxed">
                  Purging removes historical audit records from the database. A secure clearance event record will remain logged to preserve accountability.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Retention Threshold
                  </label>
                  <select
                    value={clearRetention}
                    onChange={(e) => setClearRetention(e.target.value)}
                    className="input w-full text-sm font-medium"
                  >
                    <option value="30">Delete records older than 30 days</option>
                    <option value="90">Delete records older than 90 days</option>
                    <option value="all">Purge ALL historical records</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Master Security Code
                  </label>
                  <input
                    type="password"
                    placeholder="Enter school master security code"
                    value={clearSecurityCode}
                    onChange={(e) => setClearSecurityCode(e.target.value)}
                    className="input w-full text-sm"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default security code: admin123</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsClearModalOpen(false);
                      setClearError("");
                      setClearSecurityCode("");
                    }}
                    className="btn btn-secondary px-4 py-2 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={clearing}
                    className="btn bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2"
                  >
                    {clearing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Confirm Purge
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
