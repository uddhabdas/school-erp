"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  GraduationCap,
  Loader2
} from "lucide-react";

type Stats = {
  totalStudents: number;
  totalFaculty: number;
  pendingVerifications: number;
  approvedAdmissions: number;
  activeSession: any;
  passedOut: number;
};

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  const statCards = stats
    ? [
        {
          label: "Total Students",
          value: stats.totalStudents,
          icon: Users,
          gradient: "from-blue-500 to-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Total Faculty",
          value: stats.totalFaculty,
          icon: UserCheck,
          gradient: "from-green-500 to-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Pending Verifications",
          value: stats.pendingVerifications,
          icon: UserPlus,
          gradient: "from-yellow-500 to-orange-600",
          bg: "bg-yellow-50",
        },
        {
          label: "Passed Out",
          value: stats.passedOut,
          icon: GraduationCap,
          gradient: "from-purple-500 to-purple-600",
          bg: "bg-purple-50",
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="card p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md`}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {card.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Session */}
            {stats?.activeSession && (
              <div className="card p-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      Active Session
                    </h3>
                    <p className="text-xl text-gray-700 mt-1">
                      {stats.activeSession.sessionName}
                    </p>
                  </div>
                  {stats.activeSession.admissionOpen && (
                    <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-full shadow-md">
                      Admission Open
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
