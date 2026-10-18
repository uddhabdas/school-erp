"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import {
  Clock,
  Calendar,
  Edit,
  Save,
  Printer,
  X,
  Loader2,
  CheckCircle2,
  BookOpen,
  User,
  Users,
  RefreshCw,
  Building,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Award,
  MapPin,
  School,
  Bell,
  Sun,
  Layers,
  ArrowRight
} from "lucide-react";

interface Period {
  periodNo: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
}

interface DaySchedule {
  day: string;
  periods: Period[];
}

interface TimetableData {
  academicSession: string;
  class: string;
  section: string;
  classTeacher: string;
  roomNo: string;
  weeklySchedule: DaySchedule[];
  isDefault?: boolean;
}

interface FacultySchedulePeriod {
  periodNo: number;
  startTime: string;
  endTime: string;
  timing: string;
  subject: string;
  class: string;
  section: string;
  roomNo: string;
  isClassTeacher?: boolean;
}

interface FacultyDaySchedule {
  day: string;
  periods: FacultySchedulePeriod[];
}

interface FacultyScheduleData {
  faculty: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    designation: string;
    subject?: string;
    assignedSubjects?: string[];
    isClassTeacher?: boolean;
    classTeacherOf?: { class: string; section: string };
  };
  academicSession: string;
  allocatedClasses: string[];
  allocatedSubjects: { class: string; subjectName: string; subjectCode: string; sections: string[] }[];
  weeklySchedule: FacultyDaySchedule[];
  todaySchedule: {
    day: string;
    isSchoolDay: boolean;
    periodsCount: number;
    periods: FacultySchedulePeriod[];
  };
  totalWeeklyPeriods: number;
}

const SUBJECT_COLOR_MAP: Record<string, string> = {
  "First Language (Odia)": "bg-purple-100 text-purple-900 border-purple-200",
  "Second Language (English)": "bg-blue-100 text-blue-900 border-blue-200",
  "Mathematics": "bg-indigo-100 text-indigo-900 border-indigo-200",
  "General Science": "bg-emerald-100 text-emerald-900 border-emerald-200",
  "Social Science": "bg-amber-100 text-amber-900 border-amber-200",
  "Third Language (Hindi / Sanskrit)": "bg-teal-100 text-teal-900 border-teal-200",
  "Physical Education / ICT Lab": "bg-rose-100 text-rose-900 border-rose-200",
  "ICT & Computer Lab": "bg-cyan-100 text-cyan-900 border-cyan-200",
  "Physical Education": "bg-rose-100 text-rose-900 border-rose-200"
};

const COMMON_SUBJECTS = [
  "First Language (Odia)",
  "Second Language (English)",
  "Mathematics",
  "General Science",
  "Social Science",
  "Third Language (Hindi / Sanskrit)",
  "Physical Education / ICT Lab",
  "Library / Reading Period",
  "Moral Science & Life Skills"
];

export default function TimetablePage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedSession, setSelectedSession] = useState("2026-2027");
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [sessionClassConfigs, setSessionClassConfigs] = useState<any[]>([]);

  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Edit Buffer
  const [editSchedule, setEditSchedule] = useState<DaySchedule[]>([]);
  const [editClassTeacher, setEditClassTeacher] = useState("");
  const [editRoomNo, setEditRoomNo] = useState("");
  const [facultyList, setFacultyList] = useState<any[]>([]);

  // Subject-to-Faculty Allocation Buffer & State
  const [allocations, setAllocations] = useState<Record<string, { teacherName: string; teacherId: string }>>({});
  const [allocating, setAllocating] = useState(false);
  const [isAllocationsOpen, setIsAllocationsOpen] = useState(true);

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Faculty Personal Teaching Schedule & Timings State
  const isFaculty = user?.role === "faculty";
  const [activeTab, setActiveTab] = useState<"my_schedule" | "class_routine">(
    user?.role === "faculty" ? "my_schedule" : "class_routine"
  );
  const [mySchedule, setMySchedule] = useState<FacultyScheduleData | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [isPrintMyScheduleOpen, setIsPrintMyScheduleOpen] = useState(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("All");

  const fetchMySchedule = async () => {
    try {
      setLoadingSchedule(true);
      const res = await fetch(`${API_BASE_URL}/timetable/my-schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMySchedule(data);
      }
    } catch (err) {
      console.error("Failed to load personal teaching schedule:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMySchedule();
    }
  }, [token]);

  useEffect(() => {
    if (user?.role === "faculty") {
      setActiveTab("my_schedule");
    }
  }, [user?.role]);

  // Fetch available sessions and curriculum
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSessionsList(data);
          const active = data.find((s: any) => s.status === "active") || data[0];
          setSelectedSession(active.sessionName);
          if (active.classConfigs && active.classConfigs.length > 0) {
            setSessionClassConfigs(active.classConfigs);
            setSelectedClass(active.classConfigs[0].className);
            setSelectedSection(active.classConfigs[0].sections?.[0] || "A");
          }
        }
      })
      .catch((err) => console.error("Failed to load sessions in timetable:", err));
  }, [token]);

  // Update class configs when selectedSession changes
  useEffect(() => {
    if (sessionsList.length === 0) return;
    const current = sessionsList.find((s) => s.sessionName === selectedSession);
    if (current && Array.isArray(current.classConfigs) && current.classConfigs.length > 0) {
      setSessionClassConfigs(current.classConfigs);
      if (!current.classConfigs.some((c: any) => c.className === selectedClass)) {
        setSelectedClass(current.classConfigs[0].className);
        setSelectedSection(current.classConfigs[0].sections?.[0] || "A");
      }
    }
  }, [selectedSession, sessionsList]);

  const currentClassObj = sessionClassConfigs.find((c) => c.className === selectedClass);
  const availableClasses: string[] = sessionClassConfigs.length > 0
    ? sessionClassConfigs.map((c: any) => c.className)
    : ["8", "9", "10"];
  const availableSections: string[] = currentClassObj?.sections?.length > 0
    ? currentClassObj.sections
    : ["A", "B"];

  const classSpecificSubjects: string[] = currentClassObj?.subjects?.length > 0
    ? currentClassObj.subjects.map((s: any) => s.subjectName)
    : COMMON_SUBJECTS;

  const selectableSubjects: string[] = Array.from(
    new Set([
      ...classSpecificSubjects,
      "Library / Reading Period",
      "Moral Science & Life Skills",
      "Physical Education / ICT Lab"
    ])
  );

  const fetchFacultyList = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/timetable/faculty-options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.faculty)) {
        setFacultyList(data.faculty);
      }
    } catch (err) {
      console.error("Failed to load faculty options:", err);
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/timetable?session=${selectedSession}&class=${selectedClass}&section=${selectedSection}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.success && data.timetable) {
        setTimetable(data.timetable);
        setEditSchedule(data.timetable.weeklySchedule || []);
        setEditClassTeacher(data.timetable.classTeacher || `Class ${selectedClass} Teacher`);
        setEditRoomNo(data.timetable.roomNo || `Room ${selectedClass}01`);
      }
    } catch (err) {
      console.error("Failed to load timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTimetable();
      fetchFacultyList();
    }
  }, [token, selectedClass, selectedSection, selectedSession]);

  // Synchronize subject allocations buffer whenever currentClassObj or selectedClass changes
  useEffect(() => {
    if (currentClassObj?.subjects && currentClassObj.subjects.length > 0) {
      const initial: Record<string, { teacherName: string; teacherId: string }> = {};
      currentClassObj.subjects.forEach((s: any) => {
        initial[s.subjectName] = {
          teacherName: s.assignedTeacher || "",
          teacherId: s.assignedTeacherId || "",
        };
      });
      setAllocations(initial);
    } else {
      const initial: Record<string, { teacherName: string; teacherId: string }> = {};
      COMMON_SUBJECTS.forEach((sub) => {
        initial[sub] = { teacherName: "", teacherId: "" };
      });
      setAllocations(initial);
    }
  }, [currentClassObj, selectedClass]);

  const handlePeriodChange = (dayIdx: number, periodIdx: number, field: "subject" | "teacherName", val: string) => {
    setEditSchedule((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[dayIdx].periods[periodIdx][field] = val;
      if (field === "subject" && val) {
        const allocatedTeacher =
          allocations[val]?.teacherName ||
          currentClassObj?.subjects?.find((s: any) => s.subjectName === val)?.assignedTeacher;
        if (allocatedTeacher) {
          copy[dayIdx].periods[periodIdx].teacherName = allocatedTeacher;
        }
      }
      return copy;
    });
  };

  const handleSaveAllocations = async () => {
    try {
      setAllocating(true);
      const payloadAllocations = Object.entries(allocations).map(([subjectName, data]) => ({
        subjectName,
        teacherName: data.teacherName,
        teacherId: data.teacherId
      }));

      const res = await fetch(`${API_BASE_URL}/timetable/allocate-subject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          session: selectedSession,
          class: selectedClass,
          allocations: payloadAllocations
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveMsg(`Subject faculty allocated for Class ${selectedClass} and synchronized with routine!`);
        setTimeout(() => setSaveMsg(""), 5000);

        // Update local sessionClassConfigs so subjects reflect assignedTeacher
        setSessionClassConfigs((prev) =>
          prev.map((c) => {
            if (c.className !== selectedClass) return c;
            const updatedSubs = (c.subjects || []).map((s: any) => {
              const matched = allocations[s.subjectName];
              if (matched) {
                return {
                  ...s,
                  assignedTeacher: matched.teacherName,
                  assignedTeacherId: matched.teacherId
                };
              }
              return s;
            });
            return { ...c, subjects: updatedSubs };
          })
        );

        // Update active editSchedule periods
        setEditSchedule((prev) =>
          prev.map((day) => ({
            ...day,
            periods: day.periods.map((p) => {
              const matched = allocations[p.subject];
              if (matched && matched.teacherName) {
                return { ...p, teacherName: matched.teacherName };
              }
              return p;
            })
          }))
        );

        // Refresh timetable
        fetchTimetable();
      } else {
        alert(data.message || "Failed to save subject allocations");
      }
    } catch (err) {
      console.error(err);
      alert("Server error allocating subjects to faculty");
    } finally {
      setAllocating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/timetable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          academicSession: selectedSession,
          class: selectedClass,
          section: selectedSection,
          classTeacher: editClassTeacher,
          roomNo: editRoomNo,
          weeklySchedule: editSchedule
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg("Weekly routine successfully updated!");
        setTimeout(() => setSaveMsg(""), 4000);
        setIsEditing(false);
        fetchTimetable();
      } else {
        alert(data.message || "Failed to save timetable");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setSaving(false);
    }
  };

  const subjectItems = currentClassObj?.subjects && currentClassObj.subjects.length > 0
    ? currentClassObj.subjects
    : COMMON_SUBJECTS.map((s) => ({ subjectName: s, subjectCode: s.slice(0, 3).toUpperCase(), isOptional: false }));

  const allocatedCount = subjectItems.filter((sub: any) => {
    const name = sub.subjectName || sub;
    return Boolean(allocations[name]?.teacherName);
  }).length;

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "faculty"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-5 sm:p-7 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                    Academic Master Schedule
                  </span>
                  <span className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-white/10 text-slate-200">
                    7 Periods Daily
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Class Routine & Timetable</h1>
                <p className="text-slate-300 mt-1 text-xs sm:text-sm max-w-xl">
                  Subject period allocations, faculty assignments, and printable weekly class schedules for high school cohorts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {activeTab === "my_schedule" ? (
                  <button
                    onClick={() => setIsPrintMyScheduleOpen(true)}
                    className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print My Schedule (A4)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Class Routine (A4)</span>
                  </button>
                )}

                {isAdmin && activeTab === "class_routine" && (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleSave();
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs shadow-lg transition"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEditing ? (
                      <Save className="w-4 h-4" />
                    ) : (
                      <Edit className="w-4 h-4" />
                    )}
                    {isEditing ? "Save Routine" : "Edit Routine"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MAIN VIEW TABS: MY TEACHING SCHEDULE vs CLASS-WISE ROUTINE */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("my_schedule")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === "my_schedule"
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">My Teaching Schedule & Timings</span>
                <span className="sm:hidden">My Schedule</span>
                {mySchedule && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === "my_schedule"
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 text-indigo-700"
                  }`}>
                    {mySchedule.totalWeeklyPeriods}P
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("class_routine")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === "class_routine"
                    ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md shadow-slate-300"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">Class-wise Master Routine</span>
                <span className="sm:hidden">Class Routine</span>
              </button>
            </div>

            {mySchedule && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{mySchedule.faculty.name} ({mySchedule.faculty.designation || mySchedule.faculty.subject || "Faculty"})</span>
              </div>
            )}
          </div>

          {/* VIEW 1: MY TEACHING SCHEDULE & TIMINGS */}
          {activeTab === "my_schedule" && (
            <div className="space-y-6">
              {/* Faculty Identity & Quick Metrics Bar */}
              <div className="card p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-indigo-800/50 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-400 to-cyan-400 p-0.5 shadow-lg shrink-0">
                      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white font-black text-xl">
                        {mySchedule?.faculty.name?.charAt(0) || user?.name?.charAt(0) || "F"}
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                          {mySchedule?.faculty.name || user?.name}
                        </h2>
                        {mySchedule?.faculty.isClassTeacher && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Class Teacher ({mySchedule.faculty.classTeacherOf?.class}-{mySchedule.faculty.classTeacherOf?.section})
                          </span>
                        )}
                      </div>
                      <p className="text-indigo-200 text-xs sm:text-sm font-medium mt-0.5">
                        {mySchedule?.faculty.designation || "Dedicated Faculty"} • Primary Subject:{" "}
                        <strong className="text-white">{mySchedule?.faculty.subject || "All Assigned"}</strong>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[11px] font-semibold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-lg">
                          Cohorts: Class {mySchedule?.allocatedClasses?.join(", Class ") || "8, 9, 10"}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-lg">
                          Daily School Hours: 10:00 AM - 03:40 PM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action & Stats Cards */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center min-w-[110px]">
                      <span className="text-[10px] uppercase font-bold text-indigo-200 block tracking-wider">Today</span>
                      <span className="text-2xl font-black text-amber-300">
                        {mySchedule?.todaySchedule.periodsCount || 0}
                      </span>
                      <span className="text-[10px] text-slate-300 block font-medium">Periods Today</span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 text-center min-w-[110px]">
                      <span className="text-[10px] uppercase font-bold text-indigo-200 block tracking-wider">Weekly Load</span>
                      <span className="text-2xl font-black text-white">
                        {mySchedule?.totalWeeklyPeriods || 0}
                      </span>
                      <span className="text-[10px] text-slate-300 block font-medium">Total Periods</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPrintMyScheduleOpen(true)}
                      className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print My Schedule (A4)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TODAY'S CLASSES & PERIOD TIMINGS */}
              <div className="card p-5 border border-slate-200 bg-white rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Today's Classes & Timings ({mySchedule?.todaySchedule.day || "Today"})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Your real-time period timeline and allocated classroom schedule for today
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {mySchedule?.todaySchedule.periodsCount || 0} Classes Scheduled
                    </span>
                  </div>
                </div>

                {(!mySchedule?.todaySchedule.periods || mySchedule.todaySchedule.periods.length === 0) ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No Teaching Classes Scheduled for Today ({mySchedule?.todaySchedule.day})</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      You do not have any allocated periods scheduled for {mySchedule?.todaySchedule.day}. Please review your weekly routine below for upcoming classes.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {mySchedule.todaySchedule.periods.map((p, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          SUBJECT_COLOR_MAP[p.subject] || "bg-indigo-50/40 text-slate-900 border-indigo-200"
                        } shadow-xs hover:shadow-md hover:-translate-y-0.5`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white shadow-2xs">
                            Period {p.periodNo}
                          </span>
                          <span className="text-[11px] font-black tracking-tight px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/80 shadow-2xs">
                            {p.timing}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-black leading-snug line-clamp-1" title={p.subject}>
                            {p.subject}
                          </h4>
                          <div className="flex items-center justify-between text-xs font-bold opacity-90 pt-1">
                            <span>Class {p.class}-{p.section}</span>
                            <span className="font-semibold text-[11px]">{p.roomNo}</span>
                          </div>
                        </div>

                        {p.isClassTeacher && (
                          <div className="mt-2.5 pt-2 border-t border-slate-900/10 flex items-center gap-1 text-[10px] font-black text-amber-800">
                            <Award className="w-3 h-3 text-amber-600" />
                            <span>Your Class Teacher Cohort</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* COMPLETE WEEKLY TEACHING SCHEDULE (DAY-BY-DAY) */}
              <div className="card p-5 border border-slate-200 bg-white rounded-3xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Complete Weekly Teaching Schedule & Timings</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Day-wise breakdown of all subjects and periods allocated to you across Class 8, 9, and 10
                    </p>
                  </div>

                  {/* Day Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    {["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName) => (
                      <button
                        key={dayName}
                        type="button"
                        onClick={() => setSelectedDayFilter(dayName)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          selectedDayFilter === dayName
                            ? "bg-white text-indigo-700 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {dayName === "All" ? "All Days" : dayName.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingSchedule ? (
                  <div className="py-16 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(mySchedule?.weeklySchedule || [])
                      .filter((d) => selectedDayFilter === "All" || d.day === selectedDayFilter)
                      .map((dayItem) => {
                        const isToday = dayItem.day.toLowerCase() === mySchedule?.todaySchedule.day.toLowerCase();
                        return (
                          <div
                            key={dayItem.day}
                            className={`rounded-2xl border transition-all ${
                              isToday
                                ? "border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-500/20"
                                : "border-slate-200 bg-slate-50/30"
                            } p-4`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">
                                  {dayItem.day}
                                </span>
                                {isToday && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white">
                                    Today
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-slate-500">
                                {dayItem.periods.length} {dayItem.periods.length === 1 ? "Period" : "Periods"}
                              </span>
                            </div>

                            {dayItem.periods.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2">No periods scheduled on {dayItem.day}</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {dayItem.periods.map((p, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className={`p-3.5 rounded-xl border bg-white ${
                                      SUBJECT_COLOR_MAP[p.subject] || "border-slate-200"
                                    } shadow-2xs hover:shadow-xs transition`}
                                  >
                                    <div className="flex items-center justify-between text-[10px] font-black mb-1.5">
                                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white">
                                        Period {p.periodNo}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-white/90 border border-slate-200 font-bold text-slate-700">
                                        {p.timing}
                                      </span>
                                    </div>

                                    <h5 className="text-xs font-black leading-snug line-clamp-1" title={p.subject}>
                                      {p.subject}
                                    </h5>

                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mt-2 pt-1 border-t border-slate-100">
                                      <span>Class {p.class}-{p.section}</span>
                                      <span className="font-semibold text-slate-500">{p.roomNo}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: CLASS-WISE MASTER ROUTINE */}
          {activeTab === "class_routine" && (
            <div className="space-y-6">
              {/* Filter Bar & Class Information */}
              <div className="card p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Class Roster:</span>
              </div>

              <select
                value={selectedClass}
                onChange={(e) => {
                  const newClass = e.target.value;
                  setSelectedClass(newClass);
                  const cfg = sessionClassConfigs.find((c) => c.className === newClass);
                  if (cfg && cfg.sections?.length > 0) {
                    setSelectedSection(cfg.sections[0]);
                  }
                }}
                className="text-sm font-bold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="text-sm font-bold rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              >
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
              {isEditing ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Class Teacher:</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={facultyList.some((f) => f.name === editClassTeacher) ? editClassTeacher : "custom"}
                        onChange={(e) => {
                          if (e.target.value !== "custom") {
                            setEditClassTeacher(e.target.value);
                          }
                        }}
                        className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium max-w-[200px]"
                      >
                        <option value="">-- Allocate from Faculty --</option>
                        {facultyList.map((f) => (
                          <option key={f._id} value={f.name}>
                            {f.name} {f.subject ? `(${f.subject})` : ""}
                          </option>
                        ))}
                        <option value="custom">-- Custom Name --</option>
                      </select>
                      {(!facultyList.some((f) => f.name === editClassTeacher) || editClassTeacher === "") && (
                        <input
                          type="text"
                          placeholder="Teacher name"
                          value={editClassTeacher}
                          onChange={(e) => setEditClassTeacher(e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-xs w-32"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Room No:</span>
                    <input
                      type="text"
                      value={editRoomNo}
                      onChange={(e) => setEditRoomNo(e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-xs w-24"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-lg">
                    Class Teacher: <strong>{timetable?.classTeacher}</strong>
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg">
                    Classroom: <strong>{timetable?.roomNo}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SUBJECT-TO-FACULTY ALLOCATION MATRIX PANEL */}
          <div className="card border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/15 to-blue-50/20 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Subject-to-Faculty Allocation
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                      Class {selectedClass}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Allocate teachers for each subject in this class. Assignments automatically sync to routine periods and faculty timetables.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border shadow-2xs ${
                  allocatedCount === subjectItems.length
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-slate-600 border-slate-200"
                }`}>
                  <strong>{allocatedCount}</strong> of <strong>{subjectItems.length}</strong> Subjects Allocated
                </span>

                <button
                  type="button"
                  onClick={() => setIsAllocationsOpen(!isAllocationsOpen)}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition shadow-2xs"
                  title={isAllocationsOpen ? "Minimize panel" : "Expand panel"}
                >
                  {isAllocationsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleSaveAllocations}
                    disabled={allocating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-xs shadow-md shadow-indigo-200 transition disabled:opacity-50"
                  >
                    {allocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{allocating ? "Syncing..." : "Save & Sync to Routine"}</span>
                  </button>
                )}
              </div>
            </div>

            {isAllocationsOpen && (
              <div className="pt-2 border-t border-indigo-100/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {subjectItems.map((sub: any, idx: number) => {
                    const subName = sub.subjectName || sub;
                    const subCode = sub.subjectCode || subName.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
                    const alloc = allocations[subName] || { teacherName: "", teacherId: "" };
                    const isAssigned = Boolean(alloc.teacherName);

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isAssigned
                            ? "bg-white border-emerald-300 shadow-2xs ring-1 ring-emerald-500/10"
                            : "bg-white/80 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md shrink-0">
                              {subCode}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate" title={subName}>
                              {subName}
                            </span>
                          </div>
                          {sub.isOptional ? (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                              Elective
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              Core
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            <span>Assigned Faculty:</span>
                            {isAssigned && (
                              <span className="text-emerald-700 font-bold lowercase flex items-center gap-0.5">
                                <Check className="w-3 h-3 text-emerald-600" /> allocated
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <select
                              value={
                                facultyList.some((f) => f.name === alloc.teacherName)
                                  ? alloc.teacherName
                                  : alloc.teacherName
                                  ? "custom"
                                  : ""
                              }
                              disabled={!isAdmin}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "custom") {
                                  // Keep current custom or empty
                                  setAllocations((prev) => ({
                                    ...prev,
                                    [subName]: {
                                      teacherName: prev[subName]?.teacherName || "",
                                      teacherId: ""
                                    }
                                  }));
                                } else {
                                  const matched = facultyList.find((f) => f.name === val);
                                  setAllocations((prev) => ({
                                    ...prev,
                                    [subName]: {
                                      teacherName: val,
                                      teacherId: matched?._id || ""
                                    }
                                  }));
                                }
                              }}
                              className={`w-full text-xs font-bold rounded-xl border px-2.5 py-1.5 bg-white transition cursor-pointer truncate ${
                                isAssigned
                                  ? "border-emerald-300 text-emerald-800 bg-emerald-50/50"
                                  : "border-slate-200 text-slate-500 hover:border-slate-300"
                              }`}
                            >
                              <option value="">-- No Faculty Assigned --</option>
                              {facultyList.map((f: any) => (
                                <option key={f._id} value={f.name}>
                                  {f.name} {f.subject ? `(${f.subject})` : ""}
                                </option>
                              ))}
                              <option value="custom">-- Custom Name... --</option>
                            </select>

                            {/* Custom name input if not matching faculty list and not empty, or if custom was selected */}
                            {(!facultyList.some((f) => f.name === alloc.teacherName) && alloc.teacherName !== undefined) && (
                              <input
                                type="text"
                                placeholder="Enter faculty name"
                                value={alloc.teacherName}
                                disabled={!isAdmin}
                                onChange={(e) => {
                                  const textVal = e.target.value;
                                  setAllocations((prev) => ({
                                    ...prev,
                                    [subName]: {
                                      teacherName: textVal,
                                      teacherId: ""
                                    }
                                  }));
                                }}
                                className="w-full text-xs px-2.5 py-1 rounded-xl border border-slate-200 bg-white font-medium"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {saveMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {saveMsg}
            </div>
          )}

          {/* Weekly Timetable Table */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="card overflow-hidden border border-slate-200 shadow-sm">
              <div className="md:hidden flex items-center justify-between text-[11px] text-slate-500 font-semibold px-3 py-1.5 bg-slate-100 border-b border-slate-200">
                <span>Swipe left / right to view all periods</span>
                <span>➔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[840px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-center">
                      <th className="py-3 px-3 text-left w-28 border-r border-slate-800">Day</th>
                      <th className="py-2.5 px-2 border-r border-slate-800">
                        <div>Period 1</div>
                        <span className="text-[10px] text-slate-400 font-normal">10:00 - 10:45</span>
                      </th>
                      <th className="py-2.5 px-2 border-r border-slate-800">
                        <div>Period 2</div>
                        <span className="text-[10px] text-slate-400 font-normal">10:45 - 11:30</span>
                      </th>
                      <th className="py-2.5 px-2 border-r border-slate-800">
                        <div>Period 3</div>
                        <span className="text-[10px] text-slate-400 font-normal">11:30 - 12:15</span>
                      </th>
                      <th className="py-2.5 px-2 border-r border-slate-800">
                        <div>Period 4</div>
                        <span className="text-[10px] text-slate-400 font-normal">12:15 - 01:00</span>
                      </th>
                      <th className="py-2.5 px-1 bg-amber-500/20 text-amber-300 w-16 border-r border-slate-800 text-[10px] uppercase font-bold">
                        Lunch Break
                      </th>
                      <th className="py-2.5 px-2 border-r border-slate-800">
                        <div>Period 5</div>
                        <span className="text-[10px] text-slate-400 font-normal">01:40 - 02:20</span>
                      </th>
                      <th className="py-2.5 px-2 border-r border-slate-800">
                        <div>Period 6</div>
                        <span className="text-[10px] text-slate-400 font-normal">02:20 - 03:00</span>
                      </th>
                      <th className="py-2.5 px-2">
                        <div>Period 7</div>
                        <span className="text-[10px] text-slate-400 font-normal">03:00 - 03:40</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(isEditing ? editSchedule : timetable?.weeklySchedule || []).map((daySched, dIdx) => (
                      <tr key={daySched.day} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-3 font-black text-slate-900 bg-slate-50/80 border-r border-slate-200">
                          {daySched.day}
                        </td>

                        {/* Periods 1 to 4 */}
                        {daySched.periods.slice(0, 4).map((p, pIdx) => (
                          <td key={pIdx} className="py-2 px-2 border-r border-slate-200">
                            {isEditing ? (
                              <div className="space-y-1">
                                <select
                                  value={p.subject}
                                  onChange={(e) => handlePeriodChange(dIdx, pIdx, "subject", e.target.value)}
                                  className="w-full text-[11px] font-bold p-1 rounded border border-slate-200 bg-white"
                                >
                                  {selectableSubjects.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                  ))}
                                </select>
                                <select
                                  value={facultyList.some((f) => f.name === p.teacherName) ? p.teacherName : p.teacherName ? "custom" : ""}
                                  onChange={(e) => {
                                    if (e.target.value !== "custom") {
                                      handlePeriodChange(dIdx, pIdx, "teacherName", e.target.value);
                                    }
                                  }}
                                  className="w-full text-[10px] p-1 rounded border border-slate-200 bg-white text-slate-700 font-medium"
                                >
                                  <option value="">-- Faculty --</option>
                                  {facultyList.map((f) => (
                                    <option key={f._id} value={f.name}>
                                      {f.name}
                                    </option>
                                  ))}
                                  <option value="custom">-- Custom Name... --</option>
                                </select>
                                {(!facultyList.some((f) => f.name === p.teacherName) || p.teacherName === "") && (
                                  <input
                                    type="text"
                                    placeholder="Faculty name"
                                    value={p.teacherName}
                                    onChange={(e) => handlePeriodChange(dIdx, pIdx, "teacherName", e.target.value)}
                                    className="w-full text-[10px] p-1 rounded border border-slate-200"
                                  />
                                )}
                              </div>
                            ) : (
                              (() => {
                                const isMyPeriod = Boolean(
                                  user &&
                                  p.teacherName &&
                                  (p.teacherName.toLowerCase() === user.name?.toLowerCase() ||
                                    user.name?.toLowerCase().includes(p.teacherName.toLowerCase()) ||
                                    p.teacherName.toLowerCase().includes(user.name?.toLowerCase()))
                                );
                                return (
                                  <div
                                    className={`p-2 rounded-xl border text-center transition ${
                                      isMyPeriod
                                        ? "ring-2 ring-indigo-500 bg-indigo-50/95 border-indigo-300 shadow-sm"
                                        : SUBJECT_COLOR_MAP[p.subject] || "bg-slate-100 text-slate-900 border-slate-200"
                                    }`}
                                  >
                                    {isMyPeriod && (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white mb-0.5 shadow-2xs">
                                        ⭐ Your Class
                                      </span>
                                    )}
                                    <strong className="block text-[11px] font-bold leading-snug">{p.subject}</strong>
                                    <span className="text-[10px] text-slate-600 font-semibold block mt-0.5 truncate" title={p.teacherName}>
                                      {p.teacherName}
                                    </span>
                                    <span className="text-[9px] font-extrabold text-slate-500 block">
                                      {p.startTime} - {p.endTime}
                                    </span>
                                  </div>
                                );
                              })()
                            )}
                          </td>
                        ))}

                        {/* Lunch Break Column */}
                        <td className="py-2 px-1 text-center bg-slate-50/80 border-r border-slate-200 text-[10px] font-bold text-slate-400 rotate-0">
                          Recess
                        </td>

                        {/* Periods 5 to 7 */}
                        {daySched.periods.slice(4, 7).map((p, pIdx) => (
                          <td key={pIdx + 4} className="py-2 px-2 border-r border-slate-200">
                            {isEditing ? (
                              <div className="space-y-1">
                                <select
                                  value={p.subject}
                                  onChange={(e) => handlePeriodChange(dIdx, pIdx + 4, "subject", e.target.value)}
                                  className="w-full text-[11px] font-bold p-1 rounded border border-slate-200 bg-white"
                                >
                                  {selectableSubjects.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                  ))}
                                </select>
                                <select
                                  value={facultyList.some((f) => f.name === p.teacherName) ? p.teacherName : p.teacherName ? "custom" : ""}
                                  onChange={(e) => {
                                    if (e.target.value !== "custom") {
                                      handlePeriodChange(dIdx, pIdx + 4, "teacherName", e.target.value);
                                    }
                                  }}
                                  className="w-full text-[10px] p-1 rounded border border-slate-200 bg-white text-slate-700 font-medium"
                                >
                                  <option value="">-- Faculty --</option>
                                  {facultyList.map((f) => (
                                    <option key={f._id} value={f.name}>
                                      {f.name}
                                    </option>
                                  ))}
                                  <option value="custom">-- Custom Name... --</option>
                                </select>
                                {(!facultyList.some((f) => f.name === p.teacherName) || p.teacherName === "") && (
                                  <input
                                    type="text"
                                    placeholder="Faculty name"
                                    value={p.teacherName}
                                    onChange={(e) => handlePeriodChange(dIdx, pIdx + 4, "teacherName", e.target.value)}
                                    className="w-full text-[10px] p-1 rounded border border-slate-200"
                                  />
                                )}
                              </div>
                            ) : (
                              (() => {
                                const isMyPeriod = Boolean(
                                  user &&
                                  p.teacherName &&
                                  (p.teacherName.toLowerCase() === user.name?.toLowerCase() ||
                                    user.name?.toLowerCase().includes(p.teacherName.toLowerCase()) ||
                                    p.teacherName.toLowerCase().includes(user.name?.toLowerCase()))
                                );
                                return (
                                  <div
                                    className={`p-2 rounded-xl border text-center transition ${
                                      isMyPeriod
                                        ? "ring-2 ring-indigo-500 bg-indigo-50/95 border-indigo-300 shadow-sm"
                                        : SUBJECT_COLOR_MAP[p.subject] || "bg-slate-100 text-slate-900 border-slate-200"
                                    }`}
                                  >
                                    {isMyPeriod && (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white mb-0.5 shadow-2xs">
                                        ⭐ Your Class
                                      </span>
                                    )}
                                    <strong className="block text-[11px] font-bold leading-snug">{p.subject}</strong>
                                    <span className="text-[10px] text-slate-600 font-semibold block mt-0.5 truncate" title={p.teacherName}>
                                      {p.teacherName}
                                    </span>
                                    <span className="text-[9px] font-extrabold text-slate-500 block">
                                      {p.startTime} - {p.endTime}
                                    </span>
                                  </div>
                                );
                              })()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

          {/* OFFICIAL PRINTABLE ROUTINE MODAL */}
          {isPrintModalOpen && timetable && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:m-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">
                      Official Weekly Class Routine - Class {timetable.class}-{timetable.section}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition"
                    >
                      <Printer className="w-4 h-4" />
                      Print Routine (A4)
                    </button>
                    <button
                      onClick={() => setIsPrintModalOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div id="printable-routine" className="p-4 sm:p-8 bg-white border-2 sm:border-4 border-slate-900 rounded-xl sm:rounded-2xl print:border-2 print:border-slate-900 print:p-3 print:rounded-lg text-slate-900 font-sans text-xs overflow-x-auto">
                  <div className="min-w-[620px]">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 print:pb-1.5">
                    <img
                      src="/5tlogo.png"
                      alt="Emblem"
                      className="h-16 w-16 print:h-12 print:w-12 object-contain rounded-xl border border-slate-300"
                    />
                    <div className="text-center flex-1 px-4">
                      <span className="text-[10px] print:text-[9px] font-bold uppercase tracking-widest text-blue-900 block">
                        GOVERNMENT OF ODISHA • SCHOOL & MASS EDUCATION DEPARTMENT
                      </span>
                      <h1 className="text-xl md:text-2xl print:text-lg font-black tracking-tight text-slate-950 uppercase mt-0.5">
                        Dulichand Sonadevi High School
                      </h1>
                      <p className="text-xs print:text-[10px] text-slate-700 font-medium">
                        Ranamunduli, Basta, Balasore, Odisha - 756029
                      </p>
                      <p className="text-[10px] print:text-[9px] font-bold text-emerald-800">
                        5T Transformation Initiative • Official School Routine
                      </p>
                    </div>
                    <div className="w-16 print:w-12" />
                  </div>

                  {/* Routine Title & Metadata */}
                  <div className="text-center my-3 print:my-1.5">
                    <span className="inline-block px-6 py-1 print:px-4 print:py-0.5 rounded-full bg-slate-900 text-white font-black text-xs print:text-[11px] uppercase tracking-wider">
                      CLASS TIMETABLE & WEEKLY ACADEMIC SCHEDULE
                    </span>
                    <div className="flex justify-between items-center text-xs print:text-[10px] font-bold text-slate-800 mt-1.5 px-2">
                      <span>Standard: <strong>Class {timetable.class} (Section {timetable.section})</strong></span>
                      <span>Classroom: <strong>{timetable.roomNo}</strong></span>
                      <span>Class Teacher: <strong>{timetable.classTeacher}</strong></span>
                    </div>
                  </div>

                  {/* Schedule Table */}
                  <div className="border border-slate-900 rounded-xl overflow-hidden mb-4 print:mb-2">
                    <table className="w-full text-left border-collapse text-[11px] print:text-[10px] min-w-[620px]">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold uppercase text-center border-b border-slate-900">
                          <th className="py-2 px-2 print:py-1 print:px-1 text-left w-24 border-r border-slate-700">Day</th>
                          <th className="py-2 px-1 print:py-1 border-r border-slate-700">P1 (10:00-10:45)</th>
                          <th className="py-2 px-1 print:py-1 border-r border-slate-700">P2 (10:45-11:30)</th>
                          <th className="py-2 px-1 print:py-1 border-r border-slate-700">P3 (11:30-12:15)</th>
                          <th className="py-2 px-1 print:py-1 border-r border-slate-700">P4 (12:15-01:00)</th>
                          <th className="py-2 px-1 print:py-1 bg-slate-800 text-amber-300 w-12 border-r border-slate-700 text-[10px] print:text-[9px]">Recess</th>
                          <th className="py-2 px-1 print:py-1 border-r border-slate-700">P5 (01:40-02:20)</th>
                          <th className="py-2 px-1 print:py-1 border-r border-slate-700">P6 (02:20-03:00)</th>
                          <th className="py-2 px-1 print:py-1">P7 (03:00-03:40)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 bg-white">
                        {timetable.weeklySchedule.map((d) => (
                          <tr key={d.day}>
                            <td className="py-2.5 px-2 print:py-1 print:px-1.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-300">
                              {d.day}
                            </td>
                            {d.periods.slice(0, 4).map((p, i) => (
                              <td key={i} className="py-2 px-1.5 print:py-1 print:px-1 text-center border-r border-slate-300">
                                <strong className="block text-[10px] print:text-[9.5px] font-bold text-slate-900">{p.subject}</strong>
                                <span className="text-[9px] print:text-[8px] text-slate-500 block">{p.teacherName}</span>
                              </td>
                            ))}
                            <td className="py-2 px-1 print:py-1 text-center bg-slate-100 text-[9px] print:text-[8px] font-bold text-slate-400 border-r border-slate-300">
                              Break
                            </td>
                            {d.periods.slice(4, 7).map((p, i) => (
                              <td key={i + 4} className="py-2 px-1.5 print:py-1 print:px-1 text-center border-r border-slate-300">
                                <strong className="block text-[10px] print:text-[9.5px] font-bold text-slate-900">{p.subject}</strong>
                                <span className="text-[9px] print:text-[8px] text-slate-500 block">{p.teacherName}</span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 print:gap-4 pt-6 print:pt-3 border-t border-slate-400 text-center font-bold text-xs print:text-[10px]">
                    <div>
                      <div className="h-7 print:h-5 border-b border-dashed border-slate-400 w-1/2 mx-auto" />
                      <span className="mt-1.5 block">Class Teacher Signature</span>
                    </div>

                    <div>
                      <div className="h-7 print:h-5 border-b border-dashed border-slate-400 w-1/2 mx-auto" />
                      <span className="mt-1.5 block">Headmaster / Principal (Seal)</span>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FACULTY PERSONAL SCHEDULE PRINT MODAL (A4) */}
          {isPrintMyScheduleOpen && mySchedule && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl sm:rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:m-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3 print:hidden">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-sm">
                      Personal Faculty Teaching Routine - {mySchedule.faculty.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition"
                    >
                      <Printer className="w-4 h-4" />
                      Print Schedule (A4)
                    </button>
                    <button
                      onClick={() => setIsPrintMyScheduleOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div id="printable-faculty-routine" className="p-4 sm:p-8 bg-white border-2 sm:border-4 border-slate-900 rounded-xl sm:rounded-2xl print:border-2 print:border-slate-900 print:p-3 print:rounded-lg text-slate-900 font-sans text-xs overflow-x-auto">
                  <div className="min-w-[620px]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 print:pb-1.5">
                      <img
                        src="/5tlogo.png"
                        alt="Emblem"
                        className="h-16 w-16 print:h-12 print:w-12 object-contain rounded-xl border border-slate-300"
                      />
                      <div className="text-center flex-1 px-4">
                        <span className="text-[10px] print:text-[9px] font-bold uppercase tracking-widest text-blue-900 block">
                          GOVERNMENT OF ODISHA • SCHOOL & MASS EDUCATION DEPARTMENT
                        </span>
                        <h1 className="text-xl md:text-2xl print:text-lg font-black tracking-tight text-slate-950 uppercase mt-0.5">
                          Dulichand Sonadevi High School
                        </h1>
                        <p className="text-xs print:text-[10px] text-slate-700 font-medium">
                          Ranamunduli, Basta, Balasore, Odisha - 756029
                        </p>
                        <p className="text-[10px] print:text-[9px] font-bold text-emerald-800">
                          5T Transformation Initiative • Faculty Academic Routine
                        </p>
                      </div>
                      <div className="w-16 print:w-12" />
                    </div>

                    {/* Routine Title & Metadata */}
                    <div className="text-center my-3 print:my-1.5">
                      <span className="inline-block px-6 py-1 print:px-4 print:py-0.5 rounded-full bg-slate-900 text-white font-black text-xs print:text-[11px] uppercase tracking-wider">
                        FACULTY WEEKLY TEACHING SCHEDULE & PERIOD TIMINGS
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs print:text-[10px] font-bold text-slate-800 mt-2 print:mt-1 p-2.5 print:p-1.5 bg-slate-50 border border-slate-300 rounded-xl text-left">
                        <div>Faculty Name: <strong className="text-slate-950 block text-xs print:text-[11px]">{mySchedule.faculty.name}</strong></div>
                        <div>Designation: <strong className="text-slate-950 block">{mySchedule.faculty.designation || "Faculty"}</strong></div>
                        <div>Primary Subject: <strong className="text-slate-950 block">{mySchedule.faculty.subject || "All Assigned"}</strong></div>
                        <div>Weekly Load: <strong className="text-slate-950 block">{mySchedule.totalWeeklyPeriods} Periods / Week</strong></div>
                      </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="border border-slate-900 rounded-xl overflow-hidden mb-4 print:mb-2">
                      <table className="w-full text-left border-collapse text-[11px] print:text-[10px] min-w-[620px]">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold uppercase text-center border-b border-slate-900">
                            <th className="py-2 px-3 print:py-1 print:px-2 text-left w-28 border-r border-slate-700">Day</th>
                            <th className="py-2 px-3 print:py-1 print:px-2 text-left border-r border-slate-700">Allocated Teaching Periods & Timing</th>
                            <th className="py-2 px-3 print:py-1 print:px-2 text-center w-28">Total Classes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 bg-white">
                          {mySchedule.weeklySchedule.map((d) => (
                            <tr key={d.day}>
                              <td className="py-2.5 px-3 print:py-1 print:px-2 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 align-top">
                                {d.day}
                              </td>
                              <td className="py-2 px-3 print:py-1 print:px-2 border-r border-slate-300">
                                {d.periods.length === 0 ? (
                                  <span className="text-slate-400 italic text-[10px]">No classes scheduled</span>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 print:gap-1">
                                    {d.periods.map((p, pIdx) => (
                                      <div key={pIdx} className="p-1.5 print:p-1 rounded-lg border border-slate-200 bg-slate-50/50">
                                        <div className="flex items-center justify-between font-bold text-[10px] print:text-[9px]">
                                          <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded">P{p.periodNo}</span>
                                          <span className="text-slate-700 font-mono font-bold">{p.timing}</span>
                                        </div>
                                        <div className="font-extrabold text-slate-900 mt-0.5">{p.subject}</div>
                                        <div className="text-[10px] print:text-[8.5px] text-slate-600 flex justify-between font-semibold mt-0.5">
                                          <span>Class {p.class}-{p.section}</span>
                                          <span>{p.roomNo}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 print:py-1 print:px-2 text-center font-black text-slate-900 align-top">
                                {d.periods.length}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 print:gap-4 pt-6 print:pt-3 border-t border-slate-400 text-center font-bold text-xs print:text-[10px]">
                      <div>
                        <div className="h-7 print:h-5 border-b border-dashed border-slate-400 w-1/2 mx-auto" />
                        <span className="mt-1.5 block">Faculty Signature</span>
                      </div>

                      <div>
                        <div className="h-7 print:h-5 border-b border-dashed border-slate-400 w-1/2 mx-auto" />
                        <span className="mt-1.5 block">Headmaster / Principal (Seal)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
