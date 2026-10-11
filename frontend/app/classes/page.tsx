"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
  RotateCcw,
  PlusCircle,
  Calendar,
  Check,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Clock,
  ArrowRight
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";

type SubjectConfig = {
  subjectCode: string;
  subjectName: string;
  isOptional?: boolean;
};

type ClassConfig = {
  className: string;
  sections: string[];
  subjects: SubjectConfig[];
  admissionOpen: boolean;
  capacity?: number;
};

type Session = {
  _id: string;
  sessionName: string;
  startDate: string;
  endDate: string;
  admissionOpen: boolean;
  allowedClasses: string[];
  classConfigs?: ClassConfig[];
  status: "active" | "inactive" | "archived";
};

const BSE_PRESET_SUBJECTS: Record<string, SubjectConfig[]> = {
  "8": [
    { subjectCode: "FLO", subjectName: "First Language (Odia)", isOptional: false },
    { subjectCode: "SLE", subjectName: "Second Language (English)", isOptional: false },
    { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false },
    { subjectCode: "GSC", subjectName: "General Science", isOptional: false },
    { subjectCode: "SSC", subjectName: "Social Science", isOptional: false },
    { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", isOptional: false },
    { subjectCode: "PET", subjectName: "Physical Education", isOptional: false },
  ],
  "9": [
    { subjectCode: "FLO", subjectName: "First Language (Odia)", isOptional: false },
    { subjectCode: "SLE", subjectName: "Second Language (English)", isOptional: false },
    { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false },
    { subjectCode: "GSC", subjectName: "General Science", isOptional: false },
    { subjectCode: "SSC", subjectName: "Social Science", isOptional: false },
    { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", isOptional: false },
    { subjectCode: "ICT", subjectName: "ICT & Computer Lab", isOptional: false },
  ],
  "10": [
    { subjectCode: "FLO", subjectName: "First Language (Odia)", isOptional: false },
    { subjectCode: "SLE", subjectName: "Second Language (English)", isOptional: false },
    { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false },
    { subjectCode: "GSC", subjectName: "General Science", isOptional: false },
    { subjectCode: "SSC", subjectName: "Social Science", isOptional: false },
    { subjectCode: "TLH", subjectName: "Third Language (Hindi / Sanskrit)", isOptional: false },
  ],
};

const QUICK_CLASSES = ["8", "9", "10", "6", "7", "11", "12"];

export default function ClassesPage() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Working configs for the currently selected session
  const [configs, setConfigs] = useState<ClassConfig[]>([]);

  // Inputs for adding a new class
  const [newClassName, setNewClassName] = useState("");
  const [newClassSections, setNewClassSections] = useState("A, B");
  const [newClassCapacity, setNewClassCapacity] = useState(60);

  // Subject input per class: { [className]: { code, name, isOptional } }
  const [subjectInputs, setSubjectInputs] = useState<
    Record<string, { code: string; name: string; isOptional: boolean }>
  >({});

  // Section input per class: { [className]: string }
  const [sectionInputs, setSectionInputs] = useState<Record<string, string>>({});

  const selectedSession = sessions.find((s) => s._id === selectedSessionId);

  const normalizeClassConfigs = (session: Session): ClassConfig[] => {
    if (session.classConfigs && session.classConfigs.length > 0) {
      return JSON.parse(JSON.stringify(session.classConfigs));
    }
    const classes =
      session.allowedClasses && session.allowedClasses.length > 0
        ? session.allowedClasses
        : ["8", "9", "10"];

    return classes.map((cls) => ({
      className: cls,
      sections: ["A", "B"],
      subjects: BSE_PRESET_SUBJECTS[cls]
        ? [...BSE_PRESET_SUBJECTS[cls]]
        : [
            { subjectCode: "FLO", subjectName: "First Language (Odia)", isOptional: false },
            { subjectCode: "SLE", subjectName: "Second Language (English)", isOptional: false },
            { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false },
            { subjectCode: "GSC", subjectName: "General Science", isOptional: false },
            { subjectCode: "SSC", subjectName: "Social Science", isOptional: false },
          ],
      admissionOpen: session.admissionOpen,
      capacity: 60,
    }));
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setError("Your session has expired. Please sign in again.");
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned error (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
        const active = data.find((s: Session) => s.status === "active") || data[0];
        if (active) {
          setSelectedSessionId(active._id);
          setConfigs(normalizeClassConfigs(active));
        }
      }
    } catch (err: any) {
      console.error("fetchSessions error:", err);
      const isNetworkError =
        err.message === "Load failed" ||
        err.message === "Failed to fetch" ||
        err.message?.includes("NetworkError");
      setError(
        isNetworkError
          ? "Unable to reach school server. Please check that the server is online and try again."
          : (err.message || "Failed to load academic sessions")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSessions();
    }
  }, [token]);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const target = sessions.find((s) => s._id === sessionId);
    if (target) {
      setConfigs(normalizeClassConfigs(target));
      setError("");
      setSuccess("");
    }
  };

  // Add a class manually
  const handleAddClass = (
    classNameInput: string,
    sectionsInput: string,
    capacityInput: number
  ) => {
    const raw = classNameInput.trim();
    if (!raw) {
      setError("Please specify a class name (e.g. 10 or Class 10 or Class 11 Science)");
      return;
    }
    setError("");

    const cleanClassName = raw.replace(/^Class\s+/i, "").trim() || raw;
    if (configs.some((c) => c.className.toLowerCase() === cleanClassName.toLowerCase())) {
      setError(`Class "${cleanClassName}" is already in this session!`);
      return;
    }

    const parsedSections = sectionsInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const finalSections = parsedSections.length > 0 ? parsedSections : ["A"];

    const defaultSubs = BSE_PRESET_SUBJECTS[cleanClassName]
      ? [...BSE_PRESET_SUBJECTS[cleanClassName]]
      : [
          { subjectCode: "L1", subjectName: "First Language", isOptional: false },
          { subjectCode: "L2", subjectName: "Second Language (English)", isOptional: false },
          { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false },
          { subjectCode: "SCI", subjectName: "General Science", isOptional: false },
          { subjectCode: "SST", subjectName: "Social Science", isOptional: false },
        ];

    setConfigs([
      ...configs,
      {
        className: cleanClassName,
        sections: finalSections,
        subjects: defaultSubs,
        admissionOpen: true,
        capacity: capacityInput || 60,
      },
    ]);

    setNewClassName("");
    setSuccess(`Class ${cleanClassName} added! Click "Save Changes" to apply.`);
  };

  // Remove a class
  const handleRemoveClass = (className: string) => {
    if (!confirm(`Are you sure you want to remove Class ${className} and its curriculum?`)) {
      return;
    }
    setConfigs(configs.filter((c) => c.className !== className));
    setSuccess(`Class ${className} removed. Click "Save Changes" to apply.`);
  };

  // Add subject manually
  const handleAddSubject = (className: string) => {
    const buffer = subjectInputs[className] || { code: "", name: "", isOptional: false };
    const name = buffer.name.trim();
    if (!name) {
      setError("Please enter the subject name");
      return;
    }
    setError("");

    const code =
      buffer.code.trim().toUpperCase() ||
      name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();

    setConfigs(
      configs.map((c) => {
        if (c.className !== className) return c;
        if (c.subjects.some((s) => s.subjectName.toLowerCase() === name.toLowerCase())) {
          setError(`Subject "${name}" already exists in Class ${className}`);
          return c;
        }
        return {
          ...c,
          subjects: [
            ...c.subjects,
            {
              subjectCode: code,
              subjectName: name,
              isOptional: buffer.isOptional,
            },
          ],
        };
      })
    );

    setSubjectInputs({
      ...subjectInputs,
      [className]: { code: "", name: "", isOptional: false },
    });
    setSuccess(
      `Added subject "${name}" to Class ${className}. Click "Save Changes" to apply.`
    );
  };

  // Remove subject
  const handleRemoveSubject = (className: string, subIdx: number) => {
    setConfigs(
      configs.map((c) => {
        if (c.className !== className) return c;
        const copy = [...c.subjects];
        copy.splice(subIdx, 1);
        return { ...c, subjects: copy };
      })
    );
  };

  // Add section
  const handleAddSection = (className: string) => {
    const raw = (sectionInputs[className] || "").trim().toUpperCase();
    if (!raw) return;

    setConfigs(
      configs.map((c) => {
        if (c.className !== className) return c;
        if (c.sections.includes(raw)) {
          setError(`Section ${raw} already exists in Class ${className}`);
          return c;
        }
        return {
          ...c,
          sections: [...c.sections, raw].sort(),
        };
      })
    );

    setSectionInputs({ ...sectionInputs, [className]: "" });
  };

  // Remove section
  const handleRemoveSection = (className: string, sec: string) => {
    setConfigs(
      configs.map((c) => {
        if (c.className !== className) return c;
        if (c.sections.length <= 1) {
          setError("Each class must have at least one section.");
          return c;
        }
        return {
          ...c,
          sections: c.sections.filter((s) => s !== sec),
        };
      })
    );
  };

  // Save changes to backend
  const handleSaveAll = async () => {
    if (!selectedSessionId) return;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      if (configs.length === 0) {
        throw new Error("Please add at least one class to save.");
      }

      const payload = {
        classConfigs: configs,
        allowedClasses: configs.map((c) => c.className),
        securityCode: "admin123",
      };

      const res = await fetch(`${API_BASE_URL}/sessions/${selectedSessionId}/classes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        // Fallback to standard session update
        const fallbackRes = await fetch(`${API_BASE_URL}/sessions/${selectedSessionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const fallbackData = await fallbackRes.json();
        if (!fallbackRes.ok) throw new Error(fallbackData.message || "Failed to save classes & subjects");
        setSessions(sessions.map((s) => (s._id === fallbackData._id ? fallbackData : s)));
        setConfigs(fallbackData.classConfigs || []);
      } else {
        setSessions(sessions.map((s) => (s._id === data._id ? data : s)));
        setConfigs(data.classConfigs || []);
      }

      setSuccess(`Classes, sections & subjects saved successfully to session "${selectedSession?.sessionName}"!`);
    } catch (err: any) {
      setError(err.message || "Error saving classes and subjects");
    } finally {
      setSaving(false);
    }
  };

  const totalClasses = configs.length;
  const totalSections = configs.reduce((acc, c) => acc + c.sections.length, 0);
  const totalSubjects = configs.reduce((acc, c) => acc + c.subjects.length, 0);

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Classes & Subjects Manager
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Manually add classes, sections, and separate curriculum subjects for each cohort
            </p>
          </div>

          {/* Big Session Switcher & Save Button */}
          <div className="flex flex-wrap items-center gap-3.5">
            {/* BIG SESSION SELECTOR BUTTON */}
            <div className="relative group bg-white border-2 border-blue-500/50 hover:border-blue-600 rounded-2xl shadow-sm hover:shadow-md transition-all p-2.5 sm:px-5 sm:py-3 flex items-center gap-3.5 bg-gradient-to-r from-blue-50/70 via-white to-white min-w-[240px] sm:min-w-[280px]">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Calendar className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
              </div>

              <div className="flex-1 min-w-0 flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                    Academic Session
                  </span>
                  {selectedSession?.status === "active" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                  )}
                </div>

                <div className="relative flex items-center mt-0.5">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => handleSelectSession(e.target.value)}
                    className="w-full bg-transparent text-base sm:text-lg font-black text-slate-900 border-none p-0 pr-8 focus:ring-0 cursor-pointer appearance-none outline-none tracking-tight"
                  >
                    {sessions.map((s) => (
                      <option key={s._id} value={s._id} className="text-sm font-bold text-slate-800 py-1">
                        Session {s.sessionName} {s.status === "active" ? "★ (Active)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-blue-600 pointer-events-none absolute right-0 font-bold" />
                </div>
              </div>
            </div>

            {/* BIG SAVE CHANGES BUTTON */}
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="btn btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm sm:text-base px-6 py-3 sm:px-7 sm:py-3.5 rounded-2xl flex items-center gap-2.5 shadow-lg hover:shadow-xl shadow-blue-600/20 transition-all h-[56px] sm:h-[62px]"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              )}
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchSessions();
                }}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition"
              >
                Retry
              </button>
              <button onClick={() => setError("")} className="text-red-400 hover:text-red-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span className="text-sm font-semibold">{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4 border border-slate-100 bg-white rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Classes</p>
              <h3 className="text-xl font-black text-slate-900">{totalClasses} Cohorts</h3>
            </div>
          </div>

          <div className="card p-4 border border-slate-100 bg-white rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Subjects</p>
              <h3 className="text-xl font-black text-slate-900">{totalSubjects} Subjects</h3>
            </div>
          </div>

          <div className="card p-4 border border-slate-100 bg-white rounded-2xl shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Sections</p>
              <h3 className="text-xl font-black text-slate-900">{totalSections} Active Sections</h3>
            </div>
          </div>
        </div>

        {/* SECTION 1: MANUALLY ADD NEW CLASS */}
        <div className="p-6 rounded-3xl border-2 border-dashed border-blue-400 bg-blue-50/60 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Manually Add New Class
              </h3>
              <p className="text-xs text-blue-800 font-medium">
                Enter any class number or name (e.g., 6, 7, 8, 9, 10, Class 11 Science) to create its distinct cohort
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfigs([
                    {
                      className: "8",
                      sections: ["A", "B"],
                      subjects: [...BSE_PRESET_SUBJECTS["8"]],
                      admissionOpen: true,
                      capacity: 60,
                    },
                    {
                      className: "9",
                      sections: ["A", "B"],
                      subjects: [...BSE_PRESET_SUBJECTS["9"]],
                      admissionOpen: true,
                      capacity: 60,
                    },
                    {
                      className: "10",
                      sections: ["A", "B"],
                      subjects: [...BSE_PRESET_SUBJECTS["10"]],
                      admissionOpen: true,
                      capacity: 60,
                    },
                  ]);
                  setSuccess("Loaded High School Template (Classes 8, 9, 10). Click Save Changes.");
                }}
                className="text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Template (8, 9, 10)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset all classes and start blank?")) {
                    setConfigs([]);
                  }
                }}
                className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Blank
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end pt-1">
            <div className="sm:col-span-4">
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Class Name *
              </label>
              <input
                type="text"
                placeholder="e.g. 10 or Class 10"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddClass(newClassName, newClassSections, newClassCapacity);
                  }
                }}
                className="input w-full py-2.5 text-sm bg-white font-bold"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Sections (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. A, B, C"
                value={newClassSections}
                onChange={(e) => setNewClassSections(e.target.value)}
                className="input w-full py-2.5 text-sm bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                value={newClassCapacity}
                onChange={(e) => setNewClassCapacity(parseInt(e.target.value, 10) || 60)}
                className="input w-full py-2.5 text-sm bg-white font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => handleAddClass(newClassName, newClassSections, newClassCapacity)}
                className="btn btn-primary w-full py-2.5 text-sm font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Class
              </button>
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
            <span className="font-extrabold text-slate-700">Quick Add:</span>
            {QUICK_CLASSES.map((qCls) => {
              const alreadyExists = configs.some((c) => c.className === qCls);
              return (
                <button
                  key={qCls}
                  type="button"
                  disabled={alreadyExists}
                  onClick={() => handleAddClass(qCls, "A, B", 60)}
                  className={`px-3 py-1 rounded-xl font-bold text-xs border transition-all ${
                    alreadyExists
                      ? "bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-blue-700 border-blue-300 hover:bg-blue-100 shadow-2xs"
                  }`}
                >
                  + Class {qCls}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: CLASS LIST & PER-CLASS SUBJECT BUILDER */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Configured Classes ({configs.length})
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              Each class has its own separate subject curriculum & section list
            </span>
          </div>

          {configs.length === 0 && (
            <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 text-sm space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <p className="font-bold text-slate-700">No classes configured for this session yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the <strong>"Manually Add New Class"</strong> form above or click <strong>Template (8, 9, 10)</strong> to get started!
                </p>
              </div>
            </div>
          )}

          {configs.map((cConfig) => {
            const cls = cConfig.className;
            const subInput = subjectInputs[cls] || { code: "", name: "", isOptional: false };
            const secInput = sectionInputs[cls] || "";

            return (
              <div
                key={cls}
                className="p-6 rounded-3xl border-2 border-slate-200 bg-white shadow-sm space-y-5 transition-all hover:border-slate-300"
              >
                {/* Header for this class */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-base rounded-2xl shadow-sm">
                      Class {cls}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">
                        Class {cls} Academic Cohort
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {cConfig.subjects.length} Subjects • {cConfig.sections.length} Sections (
                        {cConfig.sections.join(", ")}) • {cConfig.capacity || 60} Seat Limit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        checked={cConfig.admissionOpen}
                        onChange={(e) =>
                          setConfigs(
                            configs.map((c) =>
                              c.className === cls ? { ...c, admissionOpen: e.target.checked } : c
                            )
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Admissions Open</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveClass(cls)}
                      className="px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Class
                    </button>
                  </div>
                </div>

                {/* Sections of this class */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                    Sections for Class {cls}:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {cConfig.sections.map((sec) => (
                      <span
                        key={sec}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white text-indigo-700 border border-indigo-200 shadow-2xs"
                      >
                        Section {sec}
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(cls, sec)}
                          className="text-slate-400 hover:text-red-600 transition"
                          title="Remove section"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Sec (e.g. C)"
                        value={secInput}
                        onChange={(e) =>
                          setSectionInputs({ ...sectionInputs, [cls]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSection(cls);
                          }
                        }}
                        className="w-24 px-3 py-1.5 text-xs border border-slate-200 rounded-xl uppercase bg-white font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSection(cls)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                      >
                        + Add Sec
                      </button>
                    </div>
                  </div>
                </div>

                {/* Separate Subjects for this class */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Curriculum Subjects ({cConfig.subjects.length})
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const standard = BSE_PRESET_SUBJECTS[cls] || [
                          { subjectCode: "FLO", subjectName: "First Language (Odia)", isOptional: false },
                          { subjectCode: "SLE", subjectName: "Second Language (English)", isOptional: false },
                          { subjectCode: "MTH", subjectName: "Mathematics", isOptional: false },
                          { subjectCode: "GSC", subjectName: "General Science", isOptional: false },
                          { subjectCode: "SSC", subjectName: "Social Science", isOptional: false },
                        ];
                        setConfigs(
                          configs.map((c) =>
                            c.className === cls ? { ...c, subjects: [...standard] } : c
                          )
                        );
                        setSuccess(`Loaded standard BSE curriculum for Class ${cls}`);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Insert BSE Standard Subjects
                    </button>
                  </div>

                  {/* Subject List Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {cConfig.subjects.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white text-xs hover:border-blue-400 transition-all shadow-2xs group flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-mono text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shrink-0">
                              {sub.subjectCode}
                            </span>
                            <span className="font-bold text-slate-800 truncate" title={sub.subjectName}>
                              {sub.subjectName}
                            </span>
                            {sub.isOptional && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                                Elective
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(cls, sIdx)}
                            className="p-1 text-slate-300 group-hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Faculty Allocation Notice */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Faculty allocated in Timetable</span>
                          </div>
                          <Link
                            href="/timetable"
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5"
                            title="Allocate faculty for this subject in Class Routine & Timetable"
                          >
                            <span>Timetable</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Subject Row */}
                  <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-extrabold text-slate-600 mb-0.5 uppercase tracking-wider">
                        Subject Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MTH"
                        value={subInput.code}
                        onChange={(e) =>
                          setSubjectInputs({
                            ...subjectInputs,
                            [cls]: { ...subInput, code: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white uppercase font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-extrabold text-slate-600 mb-0.5 uppercase tracking-wider">
                        Subject Name *
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. Mathematics or Computer Applications`}
                        value={subInput.name}
                        onChange={(e) =>
                          setSubjectInputs({
                            ...subjectInputs,
                            [cls]: { ...subInput, name: e.target.value },
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSubject(cls);
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-medium"
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-between gap-2 pt-2 sm:pt-4">
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subInput.isOptional}
                          onChange={(e) =>
                            setSubjectInputs({
                              ...subjectInputs,
                              [cls]: { ...subInput, isOptional: e.target.checked },
                            })
                          }
                          className="rounded text-blue-600"
                        />
                        <span>Elective</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleAddSubject(cls)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap"
                      >
                        + Add Subject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating / Sticky Save Bottom Bar if user scrolls */}
        {configs.length > 0 && (
          <div className="sticky bottom-4 z-20 flex justify-end">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              <span>{saving ? "Saving Changes..." : "Save All Classes & Subjects"}</span>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  </ProtectedRoute>
);
}
