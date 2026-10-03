"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useStudentAuth } from "@/context/StudentAuthContext";

type LoginType = "admin" | "student" | "parent";

export default function Login() {
  const { login: adminLogin, user, loading: adminLoading } = useAuth();
  const { login: studentLogin, student, loading: studentLoading } = useStudentAuth();
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
      } else {
        setError("Parent login coming soon!");
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Aadhaar / Admission No
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  placeholder="Enter Aadhaar or Admission No"
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  placeholder="Enter DOB as DD-MM-YYYY"
                  required
                />
              </div>
            </>
          )}

          {activeTab === "parent" && (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl">
              <p className="text-lg font-semibold mb-2">Parent Login</p>
              <p>Coming Soon!</p>
            </div>
          )}

          {activeTab !== "parent" && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          )}
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
