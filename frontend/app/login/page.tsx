"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useStudentAuth } from "@/context/StudentAuthContext";
import { useParentAuth } from "@/context/ParentAuthContext";

type LoginType = "admin" | "student" | "parent";

export default function Login() {
  const { login: adminLogin, user, loading: adminLoading } = useAuth();
  const { login: studentLogin, student, loading: studentLoading } = useStudentAuth();
  const { login: parentLogin, loading: parentLoading } = useParentAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LoginType>("admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
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
      setError(err.message || "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/5tlogo.png" alt="5T Logo" className="h-20 w-20 rounded-full border-4 border-white shadow-xl" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-800 bg-clip-text text-transparent">School ERP</h1>
          <p className="text-slate-600">Dulichand Sonadevi High School</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: "admin", label: "Staff Login" },
            { id: "student", label: "Student Login" },
            { id: "parent", label: "Parent Login" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as LoginType);
                setError("");
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold capitalize transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {activeTab === "admin" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email / Mobile
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  placeholder="Enter email or mobile"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  placeholder="Enter password"
                  required
                />
              </div>
            </>
          )}

          {activeTab === "student" && (
            <>
              {/* Demo Credentials Helper */}
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100/80 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center justify-between text-blue-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Demo Student Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("2345678903");
                      setPassword("01-01-2010");
                      setError("");
                    }}
                    className="text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-200 font-bold transition-all hover:bg-blue-50"
                  >
                    Quick Fill
                  </button>
                </div>
                <div className="text-[11px] text-blue-700/90 leading-tight">
                  Aadhaar / Admission: <strong className="font-mono text-slate-800">2345678903</strong>
                  <br />
                  Default Password (DOB): <strong className="font-mono text-slate-800">01-01-2010</strong>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Aadhaar / Admission No
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all font-medium"
                  placeholder="e.g. 2345678903"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password (DOB: DD-MM-YYYY)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all font-medium"
                  placeholder="e.g. 01-01-2010"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: Day-Month-Year (e.g., 01-01-2010) or standard password
                </p>
              </div>
            </>
          )}

          {activeTab === "parent" && (
            <>
              {/* Demo Credentials Helper for Parents */}
              <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-100/80 text-xs text-purple-900 space-y-1.5">
                <div className="font-bold flex items-center justify-between text-purple-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                    Demo Parent Credentials
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("9876543201");
                      setPassword("01-01-2010");
                      setError("");
                    }}
                    className="text-purple-700 hover:text-purple-900 bg-white px-2 py-0.5 rounded-lg border border-purple-200 font-bold transition-all hover:bg-purple-50"
                  >
                    Quick Fill
                  </button>
                </div>
                <div className="text-[11px] text-purple-700/90 leading-tight">
                  Registered Mobile: <strong className="font-mono text-slate-800">9876543201</strong>
                  <br />
                  Password (Child DOB): <strong className="font-mono text-slate-800">01-01-2010</strong>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Registered Mobile / Student ID
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all font-medium"
                  placeholder="e.g. 9876543201 or Student ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password (Child's DOB: DD-MM-YYYY)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all font-medium"
                  placeholder="Enter child's DOB as DD-MM-YYYY"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: Day-Month-Year (e.g., 01-01-2010) or parent password
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-700 hover:underline font-semibold">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
