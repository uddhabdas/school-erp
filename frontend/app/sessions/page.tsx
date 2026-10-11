"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Edit2,
  X,
  Plus,
  Archive,
  PowerOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Users,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Trash2,
  Check,
  PlusCircle,
  RotateCcw,
  Settings2,
  Save
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type SubjectConfig = {
  subjectCode: string;
  subjectName: string;
  isOptional?: boolean;
  assignedTeacher?: string;
  assignedTeacherId?: string;
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

const DEFAULT_HIGH_SCHOOL_SUBJECTS: Record<string, SubjectConfig[]> = {
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

export default function Sessions() {
  const { user, token } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Active View Tab: 'sessions' | 'classes-master'
  const [viewTab, setViewTab] = useState<"sessions" | "classes-master">("sessions");

  // Expanded class details in session cards
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [activeClassTabMap, setActiveClassTabMap] = useState<Record<string, string>>({});

  // Direct editing of Active Session's Class/Subject configs in the 'classes-master' tab
  const [activeSessionConfigs, setActiveSessionConfigs] = useState<ClassConfig[]>([]);
  const [masterSecurityCode, setMasterSecurityCode] = useState("");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: "close" | "archive";
    session: Session;
  } | null>(null);

  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [actionSecurityCode, setActionSecurityCode] = useState("");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    sessionName: "",
    startDate: "",
    endDate: "",
    admissionOpen: true,
    classConfigs: [] as ClassConfig[],
    securityCode: "",
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    sessionName: "",
    startDate: "",
    endDate: "",
    admissionOpen: false,
    classConfigs: [] as ClassConfig[],
    securityCode: "",
  });

  // Manual Class & Subject Add inputs
  const [manualClassName, setManualClassName] = useState("");
  const [manualClassSections, setManualClassSections] = useState("A, B");
  const [manualClassCapacity, setManualClassCapacity] = useState(60);

  // Per-class subject input buffer
  const [subjectInputs, setSubjectInputs] = useState<
    Record<string, { code: string; name: string; isOptional: boolean }>
  >({});

  // Per-class section input buffer
  const [sectionInputs, setSectionInputs] = useState<Record<string, string>>({});

  const activeSession = sessions.find((s) => s.status === "active") || sessions[0];

  const normalizeClassConfigs = (session: Session): ClassConfig[] => {
    if (session.classConfigs && session.classConfigs.length > 0) {
      return JSON.parse(JSON.stringify(session.classConfigs));
    }
    const classes = session.allowedClasses && session.allowedClasses.length > 0
      ? session.allowedClasses
      : ["8", "9", "10"];

    return classes.map((cls) => ({
      className: cls,
      sections: ["A", "B"],
      subjects: DEFAULT_HIGH_SCHOOL_SUBJECTS[cls]
        ? [...DEFAULT_HIGH_SCHOOL_SUBJECTS[cls]]
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
          setActiveSessionConfigs(normalizeClassConfigs(active));
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
          : (err.message || "Failed to fetch academic sessions")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSessions();
  }, [token]);

  const handleEditClick = (session: Session) => {
    setError("");
    setSuccess("");
    setEditingSession(session);
    setEditForm({
      sessionName: session.sessionName,
      startDate: session.startDate ? session.startDate.split("T")[0] : "",
      endDate: session.endDate ? session.endDate.split("T")[0] : "",
      admissionOpen: session.admissionOpen,
      classConfigs: normalizeClassConfigs(session),
      securityCode: "",
    });
    setSubjectInputs({});
    setSectionInputs({});
    setManualClassName("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (editForm.classConfigs.length === 0) {
        throw new Error("Please add at least one class to the session");
      }

      const payload = {
        sessionName: editForm.sessionName,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        admissionOpen: editForm.admissionOpen,
        classConfigs: editForm.classConfigs,
        allowedClasses: editForm.classConfigs.map((c) => c.className),
        securityCode: editForm.securityCode,
      };

      const res = await fetch(`${API_BASE_URL}/sessions/${editingSession._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update session");

      setSessions(sessions.map((s) => (s._id === data._id ? data : s)));
      if (editingSession._id === activeSession?._id) {
        setActiveSessionConfigs(data.classConfigs || []);
      }
      setSuccess("Session with manually configured classes & subjects updated successfully!");
      setIsEditModalOpen(false);
      setEditingSession(null);
    } catch (err: any) {
      setError(err.message || "Error updating session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (createForm.classConfigs.length === 0) {
        throw new Error("Please add at least one class to the session (use the Add Class button below)");
      }

      const payload = {
        sessionName: createForm.sessionName,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        admissionOpen: createForm.admissionOpen,
        classConfigs: createForm.classConfigs,
        allowedClasses: createForm.classConfigs.map((c) => c.className),
        securityCode: createForm.securityCode,
      };

      const res = await fetch(`${API_BASE_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create session");

      setSessions([data, ...sessions]);
      setSuccess("Academic session created with distinct classes & subjects successfully!");
      setIsCreateModalOpen(false);
      setCreateForm({
        sessionName: "",
        startDate: "",
        endDate: "",
        admissionOpen: true,
        classConfigs: [],
        securityCode: "",
      });
      setSubjectInputs({});
      setSectionInputs({});
      setManualClassName("");
    } catch (err: any) {
      setError(err.message || "Error creating session");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMasterConfigs = async () => {
    if (!activeSession) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (activeSessionConfigs.length === 0) {
        throw new Error("Please add at least one class to the session");
      }

      const payload = {
        classConfigs: activeSessionConfigs,
        allowedClasses: activeSessionConfigs.map((c) => c.className),
        securityCode: masterSecurityCode || "admin123",
      };

      const res = await fetch(`${API_BASE_URL}/sessions/${activeSession._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save classes & subjects");

      setSessions(sessions.map((s) => (s._id === data._id ? data : s)));
      setActiveSessionConfigs(data.classConfigs || []);
      setSuccess(`Classes & Subjects saved to active session "${activeSession.sessionName}" successfully!`);
      setMasterSecurityCode("");
    } catch (err: any) {
      setError(err.message || "Error saving classes & subjects");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    const { type, session } = actionModal;
    const endpoint = type === "close" ? "close" : "archive";

    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${session._id}/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ securityCode: actionSecurityCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${type} session`);

      setSuccess(`Session ${type === "close" ? "closed" : "archived"} successfully!`);
      setActionModal(null);
      setActionSecurityCode("");
      fetchSessions();
    } catch (err: any) {
      setError(err.message || `Failed to ${type} session`);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Manually add a class
  const handleAddClassManually = (
    nameInput: string,
    sectionsInput: string,
    capacityInput: number,
    configs: ClassConfig[],
    setConfigs: (c: ClassConfig[]) => void
  ) => {
    const rawName = nameInput.trim();
    if (!rawName) {
      alert("Please enter a class name (e.g. 10 or Class 10)");
      return;
    }

    const cleanClassName = rawName.replace(/^Class\s+/i, "").trim() || rawName;

    if (configs.some((c) => c.className.toLowerCase() === cleanClassName.toLowerCase())) {
      alert(`Class "${cleanClassName}" is already added!`);
      return;
    }

    const parsedSections = sectionsInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const finalSections = parsedSections.length > 0 ? parsedSections : ["A"];

    const defaultSubs = DEFAULT_HIGH_SCHOOL_SUBJECTS[cleanClassName]
      ? [...DEFAULT_HIGH_SCHOOL_SUBJECTS[cleanClassName]]
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

    setManualClassName("");
  };

  // 2. Remove class
  const handleRemoveClass = (
    className: string,
    configs: ClassConfig[],
    setConfigs: (c: ClassConfig[]) => void
  ) => {
    setConfigs(configs.filter((c) => c.className !== className));
  };

  // 3. Manually add a subject to a specific class
  const handleAddSubjectManually = (
    className: string,
    configs: ClassConfig[],
    setConfigs: (c: ClassConfig[]) => void
  ) => {
    const buffer = subjectInputs[className] || { code: "", name: "", isOptional: false };
    const name = buffer.name.trim();
    if (!name) {
      alert("Please enter the subject name");
      return;
    }

    const code =
      buffer.code.trim().toUpperCase() ||
      name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();

    setConfigs(
      configs.map((c) => {
        if (c.className !== className) return c;
        if (c.subjects.some((s) => s.subjectName.toLowerCase() === name.toLowerCase())) {
          alert(`Subject "${name}" already exists in Class ${className}`);
          return c;
        }
        return {
          ...c,
          subjects: [
            ...c.subjects,
            { subjectCode: code, subjectName: name, isOptional: buffer.isOptional },
          ],
        };
      })
    );

    setSubjectInputs({
      ...subjectInputs,
      [className]: { code: "", name: "", isOptional: false },
    });
  };

  // 4. Manually remove a subject
  const handleRemoveSubject = (
    className: string,
    subIdx: number,
    configs: ClassConfig[],
    setConfigs: (c: ClassConfig[]) => void
  ) => {
    setConfigs(
      configs.map((c) => {
        if (c.className !== className) return c;
        const copy = [...c.subjects];
        copy.splice(subIdx, 1);
        return { ...c, subjects: copy };
      })
    );
  };

  // 5. Manually add a section to a specific class
  const handleAddSectionManually = (
    className: string,
    configs: ClassConfig[],
    setConfigs: (c: ClassConfig[]) => void
  ) => {
    const raw = (sectionInputs[className] || "").trim().toUpperCase();
    if (!raw) return;

    setConfigs(
      configs.map((c) => {
        if (c.className !== className) return c;
        if (c.sections.includes(raw)) {
          alert(`Section ${raw} already exists in Class ${className}`);
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

  // 6. Manually remove a section
  const handleRemoveSection = (
    className: string,
    sec: string,
    configs: ClassConfig[],
    setConfigs: (c: ClassConfig[]) => void
  ) => {
    setConfigs(
      configs.map((c) => {
        if (c.className !== className) return c;
        if (c.sections.length <= 1) {
          alert("Each class must have at least one section.");
          return c;
        }
        return {
          ...c,
          sections: c.sections.filter((s) => s !== sec),
        };
      })
    );
  };

  // Render the manual class and subject builder
  const renderManualBuilder = (
    configs: ClassConfig[],
    setConfigs: (c: ClassConfig[]) => void
  ) => {
    return (
      <div className="space-y-6">
        {/* Section 1: Manual Class Adder Box */}
        <div className="p-5 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/60 space-y-3.5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-extrabold text-blue-950 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Manually Add New Class
              </h4>
              <p className="text-xs text-blue-800">
                Type any class name (e.g. 8, 9, 10, Class 6, Class 7, Class 11 Science) and click Add Class:
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
                      subjects: [...DEFAULT_HIGH_SCHOOL_SUBJECTS["8"]],
                      admissionOpen: true,
                      capacity: 60,
                    },
                    {
                      className: "9",
                      sections: ["A", "B"],
                      subjects: [...DEFAULT_HIGH_SCHOOL_SUBJECTS["9"]],
                      admissionOpen: true,
                      capacity: 60,
                    },
                    {
                      className: "10",
                      sections: ["A", "B"],
                      subjects: [...DEFAULT_HIGH_SCHOOL_SUBJECTS["10"]],
                      admissionOpen: true,
                      capacity: 60,
                    },
                  ]);
                }}
                className="text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Template (8, 9, 10)
              </button>
              <button
                type="button"
                onClick={() => setConfigs([])}
                className="text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Blank
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Class Name *
              </label>
              <input
                type="text"
                placeholder="e.g. 10 or Class 10"
                value={manualClassName}
                onChange={(e) => setManualClassName(e.target.value)}
                className="input w-full py-2.5 text-sm bg-white font-bold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddClassManually(
                      manualClassName,
                      manualClassSections,
                      manualClassCapacity,
                      configs,
                      setConfigs
                    );
                  }
                }}
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Sections (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. A, B"
                value={manualClassSections}
                onChange={(e) => setManualClassSections(e.target.value)}
                className="input w-full py-2.5 text-sm bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Seat Capacity
              </label>
              <input
                type="number"
                value={manualClassCapacity}
                onChange={(e) => setManualClassCapacity(parseInt(e.target.value, 10) || 60)}
                className="input w-full py-2.5 text-sm bg-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() =>
                  handleAddClassManually(
                    manualClassName,
                    manualClassSections,
                    manualClassCapacity,
                    configs,
                    setConfigs
                  )
                }
                className="btn btn-primary w-full py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Class
              </button>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
            <span className="font-bold text-slate-700">Quick add:</span>
            {QUICK_CLASSES.map((qCls) => {
              const alreadyExists = configs.some((c) => c.className === qCls);
              return (
                <button
                  key={qCls}
                  type="button"
                  disabled={alreadyExists}
                  onClick={() =>
                    handleAddClassManually(qCls, "A, B", 60, configs, setConfigs)
                  }
                  className={`px-3 py-1 rounded-lg font-bold text-xs border transition-all ${
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

        {/* Section 2: Cards for each class and their separate subjects */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Classes in this Session ({configs.length})
            </h4>
            <span className="text-xs text-slate-500">
              Each class below has its own distinct subjects & sections
            </span>
          </div>

          {configs.length === 0 && (
            <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 text-sm">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No classes added yet. Use the <strong>"Manually Add New Class"</strong> box above to add your first class!
            </div>
          )}

          {configs.map((cConfig) => {
            const cls = cConfig.className;
            const subInput = subjectInputs[cls] || { code: "", name: "", isOptional: false };
            const secInput = sectionInputs[cls] || "";

            return (
              <div
                key={cls}
                className="p-5 rounded-2xl border-2 border-slate-200 bg-white shadow-sm space-y-4 transition-all"
              >
                {/* Class Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-xs">
                      Class {cls}
                    </span>
                    <div>
                      <h5 className="font-black text-slate-900 text-base">
                        Class {cls} Curriculum & Setup
                      </h5>
                      <p className="text-xs text-slate-500">
                        {cConfig.subjects.length} Subjects • {cConfig.sections.length} Sections (
                        {cConfig.sections.join(", ")}) • {cConfig.capacity || 60} Seats
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
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
                      <span>Admission Open</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveClass(cls, configs, setConfigs)}
                      className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Class
                    </button>
                  </div>
                </div>

                {/* Section Manager for this Class */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-extrabold text-slate-700 block uppercase tracking-wider">
                    Sections for Class {cls}:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {cConfig.sections.map((sec) => (
                      <span
                        key={sec}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs"
                      >
                        Section {sec}
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(cls, sec, configs, setConfigs)}
                          className="text-slate-400 hover:text-red-600"
                          title="Remove section"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {/* Add new section */}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="New Sec"
                        value={secInput}
                        onChange={(e) =>
                          setSectionInputs({ ...sectionInputs, [cls]: e.target.value })
                        }
                        className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg uppercase bg-white font-bold"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSectionManually(cls, configs, setConfigs);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSectionManually(cls, configs, setConfigs)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                      >
                        + Add Sec
                      </button>
                    </div>
                  </div>
                </div>

                {/* Separate Subjects for this Class */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      Separate Subjects for Class {cls} ({cConfig.subjects.length})
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const standard = DEFAULT_HIGH_SCHOOL_SUBJECTS[cls] || [
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
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Insert BSE Standard Subjects
                    </button>
                  </div>

                  {/* List of Subjects */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cConfig.subjects.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs hover:border-slate-300 transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {sub.subjectCode}
                          </span>
                          <span className="font-bold text-slate-800">
                            {sub.subjectName}
                          </span>
                          {sub.isOptional && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                              Elective
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(cls, sIdx, configs, setConfigs)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Manual Add Subject Form for this Class */}
                  <div className="p-3.5 bg-blue-50/30 rounded-xl border border-blue-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
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
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white uppercase font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Subject Name *
                      </label>
                      <input
                        type="text"
                        placeholder={`e.g. Mathematics or Computer Science`}
                        value={subInput.name}
                        onChange={(e) =>
                          setSubjectInputs({
                            ...subjectInputs,
                            [cls]: { ...subInput, name: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSubjectManually(cls, configs, setConfigs);
                          }
                        }}
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-between gap-1 pt-3 sm:pt-0">
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
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
                        <span>Optional</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleAddSubjectManually(cls, configs, setConfigs)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs whitespace-nowrap"
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
      </div>
    );
  };

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-2xl">
                <Layers className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Academic Sessions</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Configure academic sessions, manually add classes, and assign separate subjects for each cohort
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/classes"
              className="btn btn-secondary flex items-center justify-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-sm px-4 py-2.5 rounded-xl"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Classes & Subjects Studio</span>
            </Link>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setCreateForm({
                    sessionName: "",
                    startDate: "",
                    endDate: "",
                    admissionOpen: true,
                    classConfigs: [],
                    securityCode: "",
                  });
                  setIsCreateModalOpen(true);
                }}
                className="btn btn-primary flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Create New Session
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 space-x-2">
          <button
            onClick={() => setViewTab("sessions")}
            className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              viewTab === "sessions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Academic Sessions ({sessions.length})</span>
          </button>

          <button
            onClick={() => setViewTab("classes-master")}
            className={`py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              viewTab === "classes-master"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Manual Class & Subject Manager (Active Session)</span>
          </button>
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
                onClick={() => fetchSessions()}
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
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: SESSIONS DIRECTORY */}
        {viewTab === "sessions" && (
          loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.map((session) => {
                const classConfigs = normalizeClassConfigs(session);
                const isExpanded = expandedSessionId === session._id;
                const activeClass =
                  activeClassTabMap[session._id] || (classConfigs[0]?.className ?? "10");
                const currentClassConfig =
                  classConfigs.find((c) => c.className === activeClass) || classConfigs[0];

                return (
                  <div
                    key={session._id}
                    className="card p-6 border border-slate-200 hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Header info */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-900">{session.sessionName}</h3>
                            {session.status === "active" && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                Current Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(session.startDate).toLocaleDateString()} —{" "}
                            {new Date(session.endDate).toLocaleDateString()}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full capitalize border ${
                            session.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : session.status === "archived"
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>

                      {/* Quick Metadata */}
                      <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-500">Admissions:</span>
                          <span
                            className={`font-bold ${
                              session.admissionOpen ? "text-emerald-700" : "text-slate-600"
                            }`}
                          >
                            {session.admissionOpen ? "Open" : "Closed"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-500">Classes:</span>
                          <span className="font-bold text-blue-700">
                            {classConfigs.map((c) => `Class ${c.className}`).join(", ")}
                          </span>
                        </div>
                      </div>

                      {/* Separate Class & Subject Explorer */}
                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            Distinct Class & Subject Offerings
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedSessionId(isExpanded ? null : session._id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                          >
                            <span>{isExpanded ? "Hide Details" : "View Curriculum"}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Class Tabs */}
                        <div className="flex flex-wrap gap-1.5">
                          {classConfigs.map((cc) => (
                            <button
                              key={cc.className}
                              type="button"
                              onClick={() => {
                                setActiveClassTabMap({
                                  ...activeClassTabMap,
                                  [session._id]: cc.className,
                                });
                                if (!isExpanded) setExpandedSessionId(session._id);
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                                activeClass === cc.className
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              Class {cc.className} ({cc.subjects.length} Subjects)
                            </button>
                          ))}
                        </div>

                        {/* Active Class Separate Subjects details */}
                        {currentClassConfig && (
                          <div className="pt-2 border-t border-slate-200/70 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium">
                                Sections:{" "}
                                <strong className="text-slate-800">
                                  {currentClassConfig.sections.join(", ")}
                                </strong>
                              </span>
                              <span className="text-slate-500 font-medium">
                                Capacity:{" "}
                                <strong className="text-slate-800">
                                  {currentClassConfig.capacity || 60} Seats
                                </strong>
                              </span>
                            </div>

                            {/* Subjects Chips for this class */}
                            <div>
                              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                                Class {currentClassConfig.className} Subjects:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {currentClassConfig.subjects.map((sub, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                  >
                                    <span className="font-mono text-[9px] font-bold text-blue-700">
                                      {sub.subjectCode}
                                    </span>
                                    <span>{sub.subjectName}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    {isSuperAdmin && (
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleEditClick(session)}
                          className="btn btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-bold text-slate-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Configure Classes & Subjects
                        </button>

                        <div className="flex items-center gap-2">
                          {session.status === "active" && (
                            <button
                              onClick={() => {
                                setActionSecurityCode("");
                                setError("");
                                setActionModal({ type: "close", session });
                              }}
                              className="py-1.5 px-3 text-xs font-bold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all flex items-center gap-1"
                              title="Close Admissions"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                              Close
                            </button>
                          )}

                          {session.status !== "archived" && (
                            <button
                              onClick={() => {
                                setActionSecurityCode("");
                                setError("");
                                setActionModal({ type: "archive", session });
                              }}
                              className="py-1.5 px-3 text-xs font-bold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1"
                              title="Archive Session"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAB 2: DEDICATED MANUAL CLASS & SUBJECT MANAGER */}
        {viewTab === "classes-master" && (
          <div className="space-y-6">
            <div className="card p-6 border border-slate-200 bg-white space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-blue-600" />
                    Manual Class & Subject Manager
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifying curriculum for active session:{" "}
                    <strong className="text-blue-700 font-bold">{activeSession?.sessionName || "None"}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="password"
                    placeholder="Admin Security Code"
                    value={masterSecurityCode}
                    onChange={(e) => setMasterSecurityCode(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl w-44 font-mono"
                  />

                  <button
                    onClick={handleSaveMasterConfigs}
                    disabled={submitting}
                    className="btn btn-primary py-2 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? "Saving..." : "Save to Active Session"}
                  </button>
                </div>
              </div>

              {/* Render the Manual Builder directly on page */}
              {renderManualBuilder(activeSessionConfigs, setActiveSessionConfigs)}
            </div>
          </div>
        )}

        {/* MODAL 1: Create Academic Session */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Create Academic Session</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Manually add classes, sections, and separate subjects for the new session
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
                {/* Session Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Session Name (e.g. 2026-2027) *
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.sessionName}
                      onChange={(e) => setCreateForm({ ...createForm, sessionName: e.target.value })}
                      className="input w-full font-bold"
                      placeholder="2026-2027"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={createForm.startDate}
                        onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={createForm.endDate}
                        onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      id="createAdmissionOpen"
                      checked={createForm.admissionOpen}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, admissionOpen: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="createAdmissionOpen" className="text-sm font-bold text-slate-700 cursor-pointer">
                      Open for Admissions (Overall School Window)
                    </label>
                  </div>
                </div>

                {/* Separate Class & Subject Configurator */}
                <div className="pt-2 border-t border-slate-200">
                  {renderManualBuilder(createForm.classConfigs, (newConfigs) =>
                    setCreateForm({ ...createForm, classConfigs: newConfigs })
                  )}
                </div>

                {/* Super Admin Security Code */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Super Admin Security Code *
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.securityCode}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, securityCode: e.target.value })
                    }
                    className="input w-full font-mono"
                    placeholder="Enter security code (e.g. admin123)"
                  />
                  <p className="text-xs text-slate-400 mt-1">Default security code is admin123</p>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting ? "Creating Session..." : "Create Academic Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Edit Academic Session */}
        {isEditModalOpen && editingSession && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Edit Academic Session</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Manually add or edit classes, sections, and subjects for {editingSession.sessionName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Session Name
                    </label>
                    <input
                      type="text"
                      value={editForm.sessionName}
                      onChange={(e) => setEditForm({ ...editForm, sessionName: e.target.value })}
                      className="input w-full font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <input
                      type="checkbox"
                      id="editAdmissionOpen"
                      checked={editForm.admissionOpen}
                      onChange={(e) => setEditForm({ ...editForm, admissionOpen: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="editAdmissionOpen" className="text-sm font-bold text-slate-700 cursor-pointer">
                      Open for Admissions (Overall School Window)
                    </label>
                  </div>
                </div>

                {/* Separate Class & Subject Configurator */}
                <div className="pt-2 border-t border-slate-200">
                  {renderManualBuilder(editForm.classConfigs, (newConfigs) =>
                    setEditForm({ ...editForm, classConfigs: newConfigs })
                  )}
                </div>

                {/* Super Admin Security Code */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Super Admin Security Code *
                  </label>
                  <input
                    type="password"
                    value={editForm.securityCode}
                    onChange={(e) => setEditForm({ ...editForm, securityCode: e.target.value })}
                    className="input w-full font-mono"
                    placeholder="Enter security code (e.g. admin123)"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">Default security code is admin123</p>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting ? "Saving Changes..." : "Save Session Setup"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Action Modal (Close / Archive) */}
        {actionModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-2xl ${
                    actionModal.type === "close"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 capitalize">
                    {actionModal.type} Academic Session
                  </h3>
                  <p className="text-xs text-slate-500">Super Admin authorization required</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to {actionModal.type} session{" "}
                <strong className="text-slate-900">{actionModal.session.sessionName}</strong>?
                {actionModal.type === "close"
                  ? " This will stop active admissions for this session."
                  : " This will mark the session as archived."}
              </p>

              <form onSubmit={handleActionConfirm} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Security Code *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter admin security code"
                    value={actionSecurityCode}
                    onChange={(e) => setActionSecurityCode(e.target.value)}
                    className="input w-full font-mono"
                  />
                  <p className="text-xs text-slate-400 mt-1">Default security code is admin123</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionModal(null);
                      setActionSecurityCode("");
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !actionSecurityCode}
                    className="btn btn-primary flex-1 capitalize bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting ? "Processing..." : `Confirm ${actionModal.type}`}
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
