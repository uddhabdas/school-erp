"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  GraduationCap,
  Loader2,
  ArrowUpRight,
  Shield,
  FileText,
  Settings,
  Clock,
  CreditCard,
  Award
} from "lucide-react";

type Stats = {
  totalStudents: number;
  totalFaculty: number;
  pendingVerifications: number;
  approvedAdmissions: number;
  activeSession: any;
  passedOut: number;
  totalFeesCollected?: number;
};

type AuditLog = {
  _id: string;
  user: {
    name: string;
    role: string;
  };
  action: string;
  collection: string;
  timestamp: string;
};

export default function Dashboard() {
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statsRes = await fetch(`${API_BASE_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        setStats(statsData);

        if (isSuperAdmin || user?.role === "admin") {
          const logsRes = await fetch(`${API_BASE_URL}/dashboard/audit-logs`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const logsData = await logsRes.json();
          const list = Array.isArray(logsData) ? logsData : (logsData.logs || []);
          setRecentLogs(list.slice(0, 5));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token, isSuperAdmin]);

  const statCards = stats
    ? [
        {
          label: "Active Students",
          value: stats.totalStudents,
          icon: Users,
          gradient: "from-blue-500 to-blue-600",
          bg: "bg-blue-50",
          link: "/students",
        },
        ...(isSuperAdmin || user?.role === "admin"
          ? [
              {
                label: "Fees Collected",
                value: stats.totalFeesCollected ? `₹${stats.totalFeesCollected.toLocaleString()}` : "₹0",
                icon: CreditCard,
                gradient: "from-indigo-500 to-purple-600",
                bg: "bg-indigo-50",
                link: "/fees",
              },
            ]
          : [
              {
                label: "Class Routine & Schedule",
                value: "View Routine",
                icon: Clock,
                gradient: "from-indigo-500 to-purple-600",
                bg: "bg-indigo-50",
                link: "/timetable",
              },
            ]),
        {
          label: "Pending Admissions",
          value: stats.pendingVerifications,
          icon: UserPlus,
          gradient: "from-orange-500 to-rose-600",
          bg: "bg-orange-50",
          link: "/admissions",
        },
        {
          label: "Faculty & Staff",
          value: stats.totalFaculty,
          icon: UserCheck,
          gradient: "from-slate-600 to-slate-800",
          bg: "bg-slate-50",
          link: "/faculty",
        },
        {
          label: "Passed Out Students",
          value: stats.passedOut,
          icon: GraduationCap,
          gradient: "from-purple-500 to-indigo-600",
          bg: "bg-purple-50",
          link: "/students?status=passed_out",
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Welcome back, {user?.name}!</h1>
              <p className="text-slate-300 mt-1 max-w-xl text-xs sm:text-sm">
                Dulichand Sonadevi High School ERP system overview, academic operations, and administrative controls.
              </p>
            </div>

            {stats?.activeSession && (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/30 flex items-center justify-center text-white shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-blue-200 uppercase font-bold tracking-wider">Active Session</div>
                  <div className="text-base sm:text-lg font-bold">{stats.activeSession.sessionName}</div>
                  <span className="text-xs text-emerald-300 font-medium">
                    {stats.activeSession.admissionOpen ? "● Admissions Open" : "○ Admissions Closed"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={i}
                    href={card.link}
                    className="card p-6 border border-slate-100 hover:shadow-xl hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                          {card.label}
                        </p>
                        <p className="text-3xl font-black text-slate-900 mt-2">
                          {card.value}
                        </p>
                      </div>
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Super Admin Quick Actions */}
            {isSuperAdmin && (
              <div className="card p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Super Admin Quick Actions</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  <Link
                    href="/exams"
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 hover:shadow-md transition-all flex flex-col items-center text-center group"
                  >
                    <div className="p-3 bg-amber-500 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform mb-2">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">Examinations</span>
                    <span className="text-xs text-slate-500 mt-0.5">Marks & reports</span>
                  </Link>

                  <Link
                    href="/certificates"
                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:shadow-md transition-all flex flex-col items-center text-center group"
                  >
                    <div className="p-3 bg-purple-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform mb-2">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">Certificates</span>
                    <span className="text-xs text-slate-500 mt-0.5">TC & Bonafide</span>
                  </Link>

                  <Link
                    href="/timetable"
                    className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 hover:shadow-md transition-all flex flex-col items-center text-center group"
                  >
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform mb-2">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">Timetable</span>
                    <span className="text-xs text-slate-500 mt-0.5">Weekly routine</span>
                  </Link>

                  <Link
                    href="/students"
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md transition-all flex flex-col items-center text-center group"
                  >
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform mb-2">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">Promote</span>
                    <span className="text-xs text-slate-500 mt-0.5">Cohort moves</span>
                  </Link>

                  <Link
                    href="/faculty"
                    className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 hover:shadow-md transition-all flex flex-col items-center text-center group"
                  >
                    <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform mb-2">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">Staff Directory</span>
                    <span className="text-xs text-slate-500 mt-0.5">Faculty accounts</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50 border border-slate-200 hover:shadow-md transition-all flex flex-col items-center text-center group"
                  >
                    <div className="p-3 bg-slate-800 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform mb-2">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm">Settings</span>
                    <span className="text-xs text-slate-500 mt-0.5">School codes</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Recent Audit Logs Preview */}
            {(isSuperAdmin || user?.role === "admin") && recentLogs.length > 0 && (
              <div className="card p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">Recent Administrative Activity</h2>
                  </div>
                  <Link
                    href="/audit-logs"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View All Audit Logs →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentLogs.map((log) => (
                    <div key={log._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                          {log.action}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {log.user?.name} on {log.collection}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
