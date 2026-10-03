"use client";

import { useStudentAuth } from "@/context/StudentAuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User, BookOpen, GraduationCap, Edit2 } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { student, logout, loading } = useStudentAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !student) {
      router.push("/login");
    }
  }, [student, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      {/* Header */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/5tlogo.png" alt="5T Logo" className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-lg" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent">School ERP</h1>
              <p className="text-xs text-slate-600">Dulichand Sonadevi High School</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent">
            Welcome, {student?.personal?.name}!
          </h1>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Class</p>
                <p className="text-2xl font-bold text-slate-900">{student?.academic?.class}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Roll No</p>
                <p className="text-2xl font-bold text-slate-900">{student?.academic?.rollNo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <User className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Student ID</p>
                <p className="text-lg font-bold text-slate-900">{student?.studentId}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white">
                <User className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Admission No</p>
                <p className="text-lg font-bold text-slate-900">{student?.admissionNo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Details */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-700" />
              Personal Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-slate-600">Name:</p>
                <p className="text-slate-900 font-medium">{student?.personal?.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-slate-600">DOB:</p>
                <p className="text-slate-900 font-medium">{new Date(student?.personal?.dob).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-slate-600">Aadhaar:</p>
                <p className="text-slate-900 font-medium">{student?.personal?.aadhaar || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-slate-600">Mobile:</p>
                <p className="text-slate-900 font-medium">{student?.personal?.mobile}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-700" />
              Parent Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <p className="text-slate-600">Father's Name:</p>
                <p className="text-slate-900 font-medium">{student?.parents?.fatherName}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-slate-600">Mother's Name:</p>
                <p className="text-slate-900 font-medium">{student?.parents?.motherName}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <p className="text-slate-600">Parent's Mobile:</p>
                <p className="text-slate-900 font-medium">{student?.parents?.parentMobile}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-md border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Edit2 className="w-6 h-6 text-indigo-700" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="#"
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl text-blue-800 font-semibold hover:bg-blue-100 transition-all"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </Link>
            <Link
              href="#"
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl text-green-800 font-semibold hover:bg-green-100 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              View Documents
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
