"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  UserPlus,
  Trash2,
  Edit2,
  X,
  Search,
  Shield,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Power,
  PowerOff,
  Users,
  Check,
  CheckSquare,
  Square,
  Award,
  Sparkles,
  Info,
  Lock,
  Unlock,
  FileText,
  XCircle,
  Clock,
  Key,
  Edit3,
  Save,
  RotateCcw,
  Eye,
  Loader2
} from "lucide-react";

type User = {
  _id: string;
  employeeId?: string;
  name: string;
  email?: string;
  role: "super_admin" | "admin" | "faculty";
  mobile: string;
  status: "active" | "inactive";
  designation?: string;
  subject?: string;
  qualification?: string;
  assignedClasses?: string[];
  isClassTeacher?: boolean;
  classTeacherOf?: {
    class?: string;
    section?: string;
  };
};

const DEFAULT_CLASSES = ["8", "9", "10"];
const AVAILABLE_SECTIONS = ["A", "B", "C"];

const RBAC_ROLE_PROFILES = {
  super_admin: {
    title: "Super Admin",
    subtitle: "Principal / Root System Authority",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    desc: "Complete administrative control across all 11 modules and root security governance.",
    canDo: [
      "Academic Sessions creation, status activation, and class configurations",
      "Full Fee Management & custom fee structures setup",
      "Billing counter & payment collection with 1-page receipts",
      "Classes, Sections and Subjects master configurations",
      "Issue, customize and print Transfer Certificates (TC)",
      "Create Exams with manual full & pass marks per subject",
      "Class Routine & Timetable faculty allocation",
      "Staff management & active/inactive credentials control"
    ],
    restricted: []
  },
  admin: {
    title: "Operations Admin",
    subtitle: "Office Administration & Academic Operations",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "Operational authority over day-to-day student records, billing, certificates, exams and routine.",
    canDo: [
      "Student directory, admissions, and enrollment updates",
      "Billing Counter & fee collections with 1-page receipts",
      "Classes & Subjects manager curriculum updates",
      "Issue and print student Transfer Certificates (TC)",
      "Create examinations & configure subject-wise full/pass marks",
      "Class Routine & Timetable schedule management",
      "Faculty profiles & class teacher assignments"
    ],
    restricted: [
      "Root security code overrides & master session re-initialization"
    ]
  },
  faculty: {
    title: "Faculty Member",
    subtitle: "Academic Teaching Staff Portal",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Strictly scoped Academic Teaching Portal for personal class routine and allocated marks entry.",
    canDo: [
      "View Class Routine & Timetable with personal teaching hours & periods",
      "Enter Examination Marks strictly for subjects allocated in routine",
      "View student list of assigned classes for daily monitoring",
      "Manage class teacher duties for assigned class/section"
    ],
    restricted: [
      "Certificates (TC) — Restricted with 403 Forbidden & hidden from navigation",
      "Classes & Subjects Manager — Hidden from navigation & management blocked",
      "Fee Management & Billing Counter — Hidden from navigation",
      "Academic Sessions — Hidden from navigation"
    ]
  }
};

export type RbacAccessLevel = "full" | "read" | "restricted" | "blocked";

export type RbacPermission = {
  access: RbacAccessLevel;
  label: string;
};

export type RbacModuleItem = {
  _id?: string;
  moduleKey: string;
  moduleName: string;
  path: string;
  order?: number;
  superAdmin: RbacPermission;
  admin: RbacPermission;
  faculty: RbacPermission;
  updatedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  updatedAt?: string;
};

const DEFAULT_RBAC_ITEMS: RbacModuleItem[] = [
  {
    moduleKey: "certificates",
    moduleName: "Transfer Certificates (TC)",
    path: "/certificates",
    order: 1,
    superAdmin: { access: "full", label: "Full Control (Issue, Print & Revoke)" },
    admin: { access: "full", label: "Full Control (Issue & Print)" },
    faculty: { access: "blocked", label: "No Access (Blocked & Hidden)" }
  },
  {
    moduleKey: "classes",
    moduleName: "Classes & Subjects Manager",
    path: "/classes",
    order: 2,
    superAdmin: { access: "full", label: "Full Control (Add/Edit Classes & Subjects)" },
    admin: { access: "full", label: "Full Control (Manage Curriculum)" },
    faculty: { access: "blocked", label: "No Access (Blocked & Hidden)" }
  },
  {
    moduleKey: "sessions",
    moduleName: "Academic Sessions",
    path: "/sessions",
    order: 3,
    superAdmin: { access: "full", label: "Full Control (Create, Activate, Class Config)" },
    admin: { access: "read", label: "Read Only View" },
    faculty: { access: "blocked", label: "No Access (Blocked & Hidden)" }
  },
  {
    moduleKey: "fees",
    moduleName: "Fee Management & Structures",
    path: "/fees",
    order: 4,
    superAdmin: { access: "full", label: "Full Control (Fee Heads & Pricing)" },
    admin: { access: "full", label: "Full Control (Assign Fees & Structure)" },
    faculty: { access: "blocked", label: "No Access (Blocked & Hidden)" }
  },
  {
    moduleKey: "billing",
    moduleName: "Billing Counter & Payments",
    path: "/billing",
    order: 5,
    superAdmin: { access: "full", label: "Full Control (Collect, Receipts, Voids)" },
    admin: { access: "full", label: "Full Control (Collect & Print Receipts)" },
    faculty: { access: "blocked", label: "No Access (Blocked & Hidden)" }
  },
  {
    moduleKey: "exams",
    moduleName: "Examinations & Manual Marks Config",
    path: "/exams",
    order: 6,
    superAdmin: { access: "full", label: "Full Control (Create & Manual Marks/Pass Marks)" },
    admin: { access: "full", label: "Full Control (Create, Edit & Publish)" },
    faculty: { access: "restricted", label: "Allocated Subjects Marks Entry Only" }
  },
  {
    moduleKey: "timetable",
    moduleName: "Class Routine & Timetable",
    path: "/timetable",
    order: 7,
    superAdmin: { access: "full", label: "Full Control (Configure Routine & Faculty)" },
    admin: { access: "full", label: "Full Control (Manage Routine Slots)" },
    faculty: { access: "read", label: "Teaching Portal (View Routine & Teaching Timings)" }
  },
  {
    moduleKey: "students",
    moduleName: "Student Directory & Admissions",
    path: "/students",
    order: 8,
    superAdmin: { access: "full", label: "Full Control (All Records & Enrollment)" },
    admin: { access: "full", label: "Full Control (Admissions & Profile Updates)" },
    faculty: { access: "restricted", label: "Assigned Class Students Only" }
  },
  {
    moduleKey: "admissions",
    moduleName: "Online Admissions Applications",
    path: "/admissions",
    order: 9,
    superAdmin: { access: "full", label: "Full Control (Review, Approve & Enroll)" },
    admin: { access: "full", label: "Full Control (Review & Verify Documents)" },
    faculty: { access: "blocked", label: "No Access (Blocked & Hidden)" }
  },
  {
    moduleKey: "faculty",
    moduleName: "Faculty & Staff Directory (RBAC)",
    path: "/faculty",
    order: 10,
    superAdmin: { access: "full", label: "Full Control (Manage All Roles, Matrix & Status)" },
    admin: { access: "restricted", label: "Manage Faculty (Assignments & Info)" },
    faculty: { access: "restricted", label: "Personal Profile Only" }
  },
  {
    moduleKey: "audit_logs",
    moduleName: "Audit Logs & Governance",
    path: "/audit-logs",
    order: 11,
    superAdmin: { access: "full", label: "Full Control (View All Sensitive Activity Logs)" },
    admin: { access: "read", label: "Read Only View" },
    faculty: { access: "blocked", label: "No Access (Blocked & Hidden)" }
  }
];

export default function Faculty() {
  const { user: currentUser, token } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdmin = currentUser?.role === "admin" || isSuperAdmin;

  const [availableClasses, setAvailableClasses] = useState<string[]>(DEFAULT_CLASSES);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  // Dynamic RBAC Matrix State
  const [isRbacModalOpen, setIsRbacModalOpen] = useState(false);
  const [rbacModules, setRbacModules] = useState<RbacModuleItem[]>(DEFAULT_RBAC_ITEMS);
  const [rbacLoading, setRbacLoading] = useState(false);
  const [isEditingRbac, setIsEditingRbac] = useState(false);
  const [editedRbacModules, setEditedRbacModules] = useState<RbacModuleItem[]>(DEFAULT_RBAC_ITEMS);
  const [rbacSaving, setRbacSaving] = useState(false);
  const [rbacSuccessMsg, setRbacSuccessMsg] = useState("");
  const [rbacErrorMsg, setRbacErrorMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Super Admin Reset Password modal state
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [targetUserForPwd, setTargetUserForPwd] = useState<User | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetPwdError, setResetPwdError] = useState("");
  const [resetPwdSuccess, setResetPwdSuccess] = useState("");

  // Status toggle state
  const [statusAction, setStatusAction] = useState<"active" | "inactive">("active");
  const [securityCode, setSecurityCode] = useState("");

  // Add User Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "faculty" as "super_admin" | "admin" | "faculty",
    designation: "",
    subject: "",
    password: "",
    assignedClasses: [] as string[],
    isClassTeacher: false,
    classTeacherClass: "10",
    classTeacherSection: "A",
  });

  // Edit User Form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    mobile: "",
    role: "faculty" as "super_admin" | "admin" | "faculty",
    designation: "",
    subject: "",
    status: "active" as "active" | "inactive",
    assignedClasses: [] as string[],
    isClassTeacher: false,
    classTeacherClass: "10",
    classTeacherSection: "A",
  });

  // Quick Assign Class & Class Teacher Form state
  const [assignFormData, setAssignFormData] = useState({
    assignedClasses: [] as string[],
    subject: "",
    isClassTeacher: false,
    classTeacherClass: "10",
    classTeacherSection: "A",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setFaculty(data);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch staff members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFaculty();
      fetch(`${API_BASE_URL}/sessions/active`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.allowedClasses && data.allowedClasses.length > 0) {
            setAvailableClasses(data.allowedClasses);
          } else if (data?.classConfigs && data.classConfigs.length > 0) {
            setAvailableClasses(data.classConfigs.map((c: any) => c.className));
          }
        })
        .catch(() => {});
      fetchRbacMatrix();
    }
  }, [token]);

  // RBAC Matrix Functions
  const fetchRbacMatrix = async () => {
    if (!token) return;
    try {
      setRbacLoading(true);
      const res = await fetch(`${API_BASE_URL}/rbac`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setRbacModules(data.data);
        setEditedRbacModules(JSON.parse(JSON.stringify(data.data)));
      }
    } catch (err: any) {
      console.error("Failed to load RBAC matrix:", err);
    } finally {
      setRbacLoading(false);
    }
  };

  const handleOpenRbacModal = () => {
    setIsRbacModalOpen(true);
    setIsEditingRbac(false);
    setRbacSuccessMsg("");
    setRbacErrorMsg("");
    fetchRbacMatrix();
  };

  const handleStartEditRbac = () => {
    setEditedRbacModules(JSON.parse(JSON.stringify(rbacModules)));
    setIsEditingRbac(true);
    setRbacSuccessMsg("");
    setRbacErrorMsg("");
  };

  const handleCancelEditRbac = () => {
    setEditedRbacModules(JSON.parse(JSON.stringify(rbacModules)));
    setIsEditingRbac(false);
    setRbacErrorMsg("");
  };

  const handleUpdateModuleField = (
    moduleKey: string,
    role: "superAdmin" | "admin" | "faculty",
    field: "access" | "label",
    value: string
  ) => {
    setEditedRbacModules((prev) =>
      prev.map((mod) => {
        if (mod.moduleKey !== moduleKey) return mod;
        return {
          ...mod,
          [role]: {
            ...mod[role],
            [field]: value,
          },
        };
      })
    );
  };

  const handleSaveRbacMatrix = async () => {
    if (!token) return;
    try {
      setRbacSaving(true);
      setRbacErrorMsg("");
      setRbacSuccessMsg("");
      const res = await fetch(`${API_BASE_URL}/rbac`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ modules: editedRbacModules }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update RBAC matrix");
      }
      if (data.data && Array.isArray(data.data)) {
        setRbacModules(data.data);
        setEditedRbacModules(JSON.parse(JSON.stringify(data.data)));
      } else {
        setRbacModules(editedRbacModules);
      }
      setRbacSuccessMsg("RBAC Access Matrix successfully updated and saved by Super Admin!");
      setIsEditingRbac(false);
    } catch (err: any) {
      setRbacErrorMsg(err.message || "Failed to save RBAC matrix");
    } finally {
      setRbacSaving(false);
    }
  };

  const handleResetRbacMatrix = async () => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to reset all RBAC permissions back to system defaults?")) {
      return;
    }
    try {
      setRbacSaving(true);
      setRbacErrorMsg("");
      setRbacSuccessMsg("");
      const res = await fetch(`${API_BASE_URL}/rbac/reset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset RBAC matrix");
      }
      if (data.data && Array.isArray(data.data)) {
        setRbacModules(data.data);
        setEditedRbacModules(JSON.parse(JSON.stringify(data.data)));
      }
      setRbacSuccessMsg("RBAC Access Matrix has been reset to defaults!");
      setIsEditingRbac(false);
    } catch (err: any) {
      setRbacErrorMsg(err.message || "Failed to reset RBAC matrix");
    } finally {
      setRbacSaving(false);
    }
  };

  // Open Assign Classes Modal
  const openAssignModal = (user: User) => {
    setSelectedUser(user);
    setAssignFormData({
      assignedClasses: user.assignedClasses ? [...user.assignedClasses] : [],
      subject: user.subject || "",
      isClassTeacher: Boolean(user.isClassTeacher),
      classTeacherClass: user.classTeacherOf?.class || "10",
      classTeacherSection: user.classTeacherOf?.section || "A",
    });
    setError("");
    setSuccess("");
    setIsAssignModalOpen(true);
  };

  // Open Status Toggle Modal (Activate or Deactivate)
  const openStatusModal = (user: User, action: "active" | "inactive") => {
    setSelectedUser(user);
    setStatusAction(action);
    setSecurityCode("");
    setError("");
    setSuccess("");
    setIsStatusModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      mobile: user.mobile || "",
      role: user.role || "faculty",
      designation: user.designation || "",
      subject: user.subject || "",
      status: user.status || "active",
      assignedClasses: user.assignedClasses ? [...user.assignedClasses] : [],
      isClassTeacher: Boolean(user.isClassTeacher),
      classTeacherClass: user.classTeacherOf?.class || "10",
      classTeacherSection: user.classTeacherOf?.section || "A",
    });
    setError("");
    setSuccess("");
    setIsEditModalOpen(true);
  };

  // Open Reset Password Modal (Super Admin)
  const openResetPwdModal = (user: User) => {
    setTargetUserForPwd(user);
    setAdminNewPassword("");
    setResetPwdError("");
    setResetPwdSuccess("");
    setIsResetPwdModalOpen(true);
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPwd) return;
    setResetPwdError("");
    setResetPwdSuccess("");

    if (!adminNewPassword || adminNewPassword.length < 6) {
      setResetPwdError("New password must be at least 6 characters long");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setResetPwdError("Session expired. Please log in again.");
      return;
    }

    try {
      setResetPwdLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/superadmin-reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: "staff",
          targetId: targetUserForPwd._id,
          newPassword: adminNewPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResetPwdSuccess(data.message || `Password reset successfully for ${targetUserForPwd.name}!`);
        setAdminNewPassword("");
        setTimeout(() => {
          setIsResetPwdModalOpen(false);
          setResetPwdSuccess("");
        }, 1800);
      } else {
        setResetPwdError(data.message || "Failed to reset password");
      }
    } catch (err: any) {
      setResetPwdError(err.message || "Network error resetting password");
    } finally {
      setResetPwdLoading(false);
    }
  };

  // Submit Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role,
        designation: formData.designation,
        subject: formData.subject,
        password: formData.password,
        assignedClasses: formData.assignedClasses,
        isClassTeacher: formData.isClassTeacher,
        classTeacherOf: formData.isClassTeacher
          ? {
              class: formData.classTeacherClass,
              section: formData.classTeacherSection || "A",
            }
          : { class: "", section: "A" },
      };

      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create user account");
      }

      setSuccess(`User account created successfully! Employee ID: ${data.employeeId || "Generated"}`);
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        email: "",
        mobile: "",
        role: "faculty",
        designation: "",
        subject: "",
        password: "",
        assignedClasses: [],
        isClassTeacher: false,
        classTeacherClass: "10",
        classTeacherSection: "A",
      });
      fetchFaculty();
    } catch (err: any) {
      setError(err.message || "Failed to create user account");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        name: editFormData.name,
        mobile: editFormData.mobile,
        role: editFormData.role,
        designation: editFormData.designation,
        subject: editFormData.subject,
        status: editFormData.status,
        assignedClasses: editFormData.assignedClasses,
        isClassTeacher: editFormData.isClassTeacher,
        classTeacherOf: editFormData.isClassTeacher
          ? {
              class: editFormData.classTeacherClass,
              section: editFormData.classTeacherSection || "A",
            }
          : { class: "", section: "A" },
      };

      const res = await fetch(`${API_BASE_URL}/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      setSuccess(`Staff profile for ${data.name} updated successfully!`);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchFaculty();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Dedicated Assign Classes & Class Teacher
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        assignedClasses: assignFormData.assignedClasses,
        subject: assignFormData.subject,
        isClassTeacher: assignFormData.isClassTeacher,
        classTeacherOf: assignFormData.isClassTeacher
          ? {
              class: assignFormData.classTeacherClass,
              section: assignFormData.classTeacherSection || "A",
            }
          : { class: "", section: "A" },
      };

      const res = await fetch(`${API_BASE_URL}/users/${selectedUser._id}/assign-class`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to assign classes to faculty");
      }

      setSuccess(data.message || `Classes & Class Teacher assigned to ${selectedUser.name}!`);
      setIsAssignModalOpen(false);
      setSelectedUser(null);
      fetchFaculty();
    } catch (err: any) {
      setError(err.message || "Failed to assign classes to faculty");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Status Toggle (Activate or Deactivate)
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedUser._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusAction,
          securityCode: securityCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to ${statusAction} faculty member`);
      }

      setSuccess(
        data.message ||
          `Faculty ${selectedUser.name} has been ${statusAction === "active" ? "activated" : "deactivated"} successfully!`
      );
      setIsStatusModalOpen(false);
      setSelectedUser(null);
      setSecurityCode("");
      fetchFaculty();
    } catch (err: any) {
      setError(err.message || `Failed to ${statusAction} faculty member`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to toggle class in array
  const handleToggleClass = (cls: string, currentList: string[], onUpdate: (newList: string[]) => void) => {
    if (currentList.includes(cls)) {
      onUpdate(currentList.filter((c) => c !== cls));
    } else {
      onUpdate([...currentList, cls].sort());
    }
  };

  // Summary statistics
  const totalStaff = faculty.length;
  const activeStaff = faculty.filter((f) => f.status === "active").length;
  const inactiveStaff = faculty.filter((f) => f.status === "inactive").length;
  const classTeachersCount = faculty.filter((f) => f.isClassTeacher && f.classTeacherOf?.class).length;

  const filteredFaculty = faculty.filter((f) => {
    const matchesSearch =
      search === "" ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase()) ||
      f.mobile?.includes(search) ||
      f.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      f.subject?.toLowerCase().includes(search.toLowerCase()) ||
      f.designation?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "" || f.role === roleFilter;
    const matchesStatus = statusFilter === "" || f.status === statusFilter;

    let matchesClass = true;
    if (classFilter === "class_teacher_only") {
      matchesClass = Boolean(f.isClassTeacher && f.classTeacherOf?.class);
    } else if (classFilter !== "") {
      matchesClass =
        Boolean(f.assignedClasses?.includes(classFilter)) ||
        (Boolean(f.isClassTeacher) && f.classTeacherOf?.class === classFilter);
    }

    return matchesSearch && matchesRole && matchesStatus && matchesClass;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Faculty & Staff Management</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Allocate class teachers, assign classes to faculty, and activate or deactivate staff credentials
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                onClick={handleOpenRbacModal}
                className="btn btn-secondary flex items-center justify-center gap-1.5 sm:gap-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold shadow-sm transition-all text-xs sm:text-sm py-2 px-3 sm:px-3.5 rounded-xl flex-1 sm:flex-initial"
                title="View & Configure Role-Based Access Control matrix for all staff"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="hidden xs:inline">RBAC Matrix</span>
                <span className="xs:hidden">RBAC</span>
              </button>
              <button
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setIsAddModalOpen(true);
                }}
                className="btn btn-primary flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all text-xs sm:text-sm py-2 px-3.5 sm:px-4 rounded-xl flex-1 sm:flex-initial"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Staff</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 border border-slate-200/80 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalStaff}</p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card p-4 border border-emerald-200/80 bg-emerald-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Active Staff</p>
                <p className="text-2xl font-black text-emerald-800 mt-1">{activeStaff}</p>
              </div>
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card p-4 border border-rose-200/80 bg-rose-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Inactive Staff</p>
                <p className="text-2xl font-black text-rose-800 mt-1">{inactiveStaff}</p>
              </div>
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <PowerOff className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="card p-4 border border-purple-200/80 bg-purple-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Class Teachers</p>
                <p className="text-2xl font-black text-purple-800 mt-1">{classTeachersCount}</p>
              </div>
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty, ID, subject, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-full text-sm py-2"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input w-full text-sm py-2 font-medium"
            >
              <option value="">All Roles</option>
              <option value="faculty">Faculty (Teacher)</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin (Principal)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full text-sm py-2 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="input w-full text-sm py-2 font-medium"
            >
              <option value="">All Class Assignments</option>
              <option value="8">Class 8 Faculty</option>
              <option value="9">Class 9 Faculty</option>
              <option value="10">Class 10 Faculty</option>
              <option value="class_teacher_only">Class Teachers Only ⭐</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div>
            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {filteredFaculty.map((f) => (
                <div
                  key={f._id}
                  className={`p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3 ${
                    f.status === "inactive" ? "opacity-75 bg-slate-50/60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm shrink-0 ${
                          f.status === "inactive"
                            ? "bg-slate-400"
                            : f.role === "super_admin"
                            ? "bg-purple-600"
                            : f.role === "admin"
                            ? "bg-blue-600"
                            : "bg-teal-600"
                        }`}
                      >
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{f.name}</div>
                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
                          {f.employeeId && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-600">
                              {f.employeeId}
                            </span>
                          )}
                          {f.designation && <span>{f.designation}</span>}
                          {f.subject && <span className="font-medium text-blue-600">• {f.subject}</span>}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                        f.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${f.status === "active" ? "bg-emerald-600" : "bg-rose-600"}`} />
                      <span className="capitalize">{f.status}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md capitalize border flex items-center gap-1 ${
                        f.role === "super_admin"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : f.role === "admin"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {f.role === "super_admin" ? "Super Admin" : f.role === "admin" ? "Admin" : "Faculty"}
                    </span>

                    {f.isClassTeacher && f.classTeacherOf?.class && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        <GraduationCap className="w-3 h-3 text-amber-600" />
                        Class {f.classTeacherOf.class}-{f.classTeacherOf.section || "A"}
                      </span>
                    )}

                    {f.assignedClasses && f.assignedClasses.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-medium">Classes:</span>
                        {f.assignedClasses.map((cls) => (
                          <span
                            key={cls}
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      {f.mobile && (
                        <a
                          href={`tel:${f.mobile}`}
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          📞 {f.mobile}
                        </a>
                      )}
                      {f.email && <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{f.email}</div>}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openAssignModal(f)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition"
                          title="Assign Class"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => openEditModal(f)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => openResetPwdModal(f)}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {currentUser?._id !== f._id && (
                          f.status === "active" ? (
                            <button
                              onClick={() => openStatusModal(f, "inactive")}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Deactivate"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => openStatusModal(f, "active")}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Activate"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredFaculty.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No faculty or staff members found.
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden shadow-sm border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Staff Info
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Role & RBAC Access
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Assigned Classes
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Class Teacher
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      {isAdmin && (
                        <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFaculty.map((f) => (
                      <tr
                        key={f._id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          f.status === "inactive" ? "bg-slate-50/40 text-slate-500" : ""
                        }`}
                      >
                        {/* Staff Info */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm shrink-0 ${
                                f.status === "inactive"
                                  ? "bg-slate-400"
                                  : f.role === "super_admin"
                                  ? "bg-purple-600"
                                  : f.role === "admin"
                                  ? "bg-blue-600"
                                  : "bg-teal-600"
                              }`}
                            >
                              {f.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>{f.name}</span>
                                {f.employeeId && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    {f.employeeId}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                {f.designation && <span>{f.designation}</span>}
                                {f.designation && f.subject && <span>•</span>}
                                {f.subject && <span className="font-medium text-blue-600">{f.subject}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role & RBAC Access */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span
                              className={`px-2.5 py-0.5 text-xs font-bold rounded-lg capitalize border flex items-center gap-1.5 shadow-xs ${
                                f.role === "super_admin"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : f.role === "admin"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              <Shield className="w-3.5 h-3.5" />
                              {f.role === "super_admin" ? "Super Admin" : f.role === "admin" ? "Admin" : "Faculty"}
                            </span>

                            {/* Explicit RBAC permission scope */}
                            {f.role === "super_admin" && (
                              <div className="text-[11px] font-semibold text-purple-700 bg-purple-50/70 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-purple-600" />
                                Full Root Access (All Modules)
                              </div>
                            )}
                            {f.role === "admin" && (
                              <div className="text-[11px] font-semibold text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                <Shield className="w-3 h-3 text-blue-600" />
                                Operations (Students, Fees, TC, Exams)
                              </div>
                            )}
                            {f.role === "faculty" && (
                              <div className="flex flex-col gap-0.5">
                                <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  Routine & Allocated Marks Entry
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium pl-0.5">
                                  Restricted: TC, Classes, Fees, Billing
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Assigned Classes */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {f.assignedClasses && f.assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[170px]">
                              {f.assignedClasses.map((cls) => (
                                <span
                                  key={cls}
                                  className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md"
                                >
                                  Class {cls}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">None assigned</span>
                          )}
                        </td>

                        {/* Class Teacher Allocation */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {f.isClassTeacher && f.classTeacherOf?.class ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-sm">
                              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                              Class {f.classTeacherOf.class} - {f.classTeacherOf.section || "A"}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600">
                          <div className="font-medium text-slate-800">{f.mobile}</div>
                          {f.email && <div className="text-slate-400 truncate max-w-[150px]">{f.email}</div>}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                              f.status === "active"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                f.status === "active" ? "bg-emerald-600" : "bg-rose-600"
                              }`}
                            ></span>
                            <span className="capitalize">{f.status}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        {isAdmin && (
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Assign Class & Class Teacher Button */}
                              <button
                                onClick={() => openAssignModal(f)}
                                className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                title="Assign Classes & Class Teacher"
                              >
                                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                                <span className="hidden sm:inline">Assign Class</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => openEditModal(f)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Super Admin Reset Password Button */}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => openResetPwdModal(f)}
                                  className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                                  title="Reset Password (Super Admin Override)"
                                >
                                  <Key className="w-4 h-4" />
                                </button>
                              )}

                              {/* Activate / Deactivate Toggle Button */}
                              {currentUser?._id !== f._id && (
                                f.status === "active" ? (
                                  <button
                                    onClick={() => openStatusModal(f, "inactive")}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Deactivate Faculty"
                                  >
                                    <PowerOff className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openStatusModal(f, "active")}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                    title="Activate Faculty"
                                  >
                                    <Power className="w-4 h-4" />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}

                    {filteredFaculty.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          No faculty or staff members found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: Quick Assign Classes & Class Teacher */}
        {isAssignModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Assign Classes & Class Teacher</h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Staff: <span className="font-bold text-slate-800">{selectedUser.name}</span>
                      {selectedUser.employeeId && ` (${selectedUser.employeeId})`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-6 space-y-6">
                {/* 1. Teaching Classes */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">
                    1. Assigned Teaching Classes
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Select all classes taught by this faculty member:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
                    {availableClasses.map((cls) => {
                      const isSelected = assignFormData.assignedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() =>
                            handleToggleClass(cls, assignFormData.assignedClasses, (newList) =>
                              setAssignFormData({ ...assignFormData, assignedClasses: newList })
                            )
                          }
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-sm"
                              : "bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="text-sm font-bold">Class {cls}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Primary Teaching Subject */}
                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <label className="text-sm font-bold text-blue-950">
                      2. Primary Teaching Subject
                    </label>
                  </div>
                  <p className="text-xs text-blue-800/80">
                    Assign which curriculum subject this teacher primarily teaches:
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, General Science, English, Odia"
                    value={assignFormData.subject}
                    onChange={(e) =>
                      setAssignFormData({ ...assignFormData, subject: e.target.value })
                    }
                    className="input w-full bg-white font-bold text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Mathematics",
                      "General Science",
                      "English",
                      "First Language (Odia)",
                      "Social Science",
                      "Hindi / Sanskrit",
                      "ICT & Computer Lab",
                      "Physical Education"
                    ].map((sName) => (
                      <button
                        key={sName}
                        type="button"
                        onClick={() => setAssignFormData({ ...assignFormData, subject: sName })}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition shadow-2xs ${
                          assignFormData.subject === sName
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-blue-700 border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        {sName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Class Teacher Allocation */}
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-600" />
                        3. Class Teacher Allocation
                      </h4>
                      <p className="text-xs text-amber-800/80 mt-0.5">
                        Designate this faculty member as the primary Class Teacher
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignFormData.isClassTeacher}
                        onChange={(e) =>
                          setAssignFormData({
                            ...assignFormData,
                            isClassTeacher: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {assignFormData.isClassTeacher && (
                    <div className="pt-3 border-t border-amber-200/70 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Select Class *
                        </label>
                        <select
                          value={assignFormData.classTeacherClass}
                          onChange={(e) =>
                            setAssignFormData({
                              ...assignFormData,
                              classTeacherClass: e.target.value,
                            })
                          }
                          className="input w-full bg-white font-bold text-sm"
                        >
                          {availableClasses.map((cls) => (
                            <option key={cls} value={cls}>
                              Class {cls}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Select Section *
                        </label>
                        <select
                          value={assignFormData.classTeacherSection}
                          onChange={(e) =>
                            setAssignFormData({
                              ...assignFormData,
                              classTeacherSection: e.target.value,
                            })
                          }
                          className="input w-full bg-white font-bold text-sm"
                        >
                          {AVAILABLE_SECTIONS.map((sec) => (
                            <option key={sec} value={sec}>
                              Section {sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {assignFormData.isClassTeacher && (
                    <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-100/60 p-2.5 rounded-xl">
                      <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <span>
                        Assigning will automatically designate this teacher in the official timetable and classroom records for{" "}
                        <strong>Class {assignFormData.classTeacherClass}-{assignFormData.classTeacherSection}</strong>.
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting ? "Saving..." : "Save Allocations"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Activate / Deactivate Faculty */}
        {isStatusModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-2xl ${
                    statusAction === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {statusAction === "active" ? (
                    <Power className="w-6 h-6" />
                  ) : (
                    <PowerOff className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 capitalize">
                    {statusAction === "active" ? "Activate Faculty Account" : "Deactivate Faculty Account"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedUser.name} • {selectedUser.employeeId || selectedUser.mobile}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-sm text-slate-600">
                  {statusAction === "active" ? (
                    <>
                      Are you sure you want to <strong>activate</strong> this faculty account? They will be granted full access to log in to the ERP, manage their assigned classes, and input student grades.
                    </>
                  ) : (
                    <>
                      Are you sure you want to <strong>deactivate</strong> this faculty account? They will no longer be able to log in or modify student records until reactivated.
                    </>
                  )}
                </p>

                {isSuperAdmin && statusAction === "inactive" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Security Code (Optional for Admin)
                    </label>
                    <input
                      type="password"
                      placeholder="Optional security code"
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      className="input w-full text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusSubmit}
                  disabled={submitting}
                  className={`btn flex-1 text-white font-bold ${
                    statusAction === "active"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-md"
                      : "bg-rose-600 hover:bg-rose-700 shadow-md"
                  }`}
                >
                  {submitting
                    ? "Updating..."
                    : statusAction === "active"
                    ? "Confirm Activation"
                    : "Confirm Deactivation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Add Staff / User */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Create Staff / User Account</h2>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="e.g. Ramesh Kumar Sahoo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input w-full"
                      placeholder="teacher@school.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="input w-full"
                      placeholder="10-digit mobile"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      System Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="input w-full font-medium"
                    >
                      <option value="faculty">Faculty (Teacher)</option>
                      <option value="admin">Admin (Data Entry)</option>
                      <option value="super_admin">Super Admin (Principal)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="input w-full"
                      placeholder="e.g. Senior Teacher"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="input w-full"
                      placeholder="e.g. Mathematics"
                    />
                  </div>
                </div>

                {/* Dynamic RBAC Permission Preview for Selected Role */}
                <div className="p-3 rounded-xl border bg-slate-50/80 border-slate-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-800">
                      RBAC Access Profile: {RBAC_ROLE_PROFILES[formData.role]?.title}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      ({RBAC_ROLE_PROFILES[formData.role]?.subtitle})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    {RBAC_ROLE_PROFILES[formData.role]?.desc}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-xs">
                      <span className="font-bold text-emerald-700 block mb-1">✓ Granted Permissions:</span>
                      <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                        {RBAC_ROLE_PROFILES[formData.role]?.canDo.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="truncate">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-rose-100 shadow-xs">
                      <span className="font-bold text-rose-700 block mb-1">
                        {RBAC_ROLE_PROFILES[formData.role]?.restricted.length > 0 ? "✕ Role Restrictions:" : "✓ Full System Authority:"}
                      </span>
                      {RBAC_ROLE_PROFILES[formData.role]?.restricted.length > 0 ? (
                        <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                          {RBAC_ROLE_PROFILES[formData.role]?.restricted.map((item, idx) => (
                            <li key={idx} className="truncate">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">No restrictions applied. Unrestricted root admin access.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Classes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Assigned Teaching Classes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableClasses.map((cls) => {
                      const isSelected = formData.assignedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() =>
                            handleToggleClass(cls, formData.assignedClasses, (newList) =>
                              setFormData({ ...formData, assignedClasses: newList })
                            )
                          }
                          className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">Class {cls}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Class Teacher Allocation */}
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-950">Appoint as Class Teacher</p>
                      <p className="text-xs text-amber-800/80">Assign class teacher responsibilities</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isClassTeacher}
                        onChange={(e) =>
                          setFormData({ ...formData, isClassTeacher: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {formData.isClassTeacher && (
                    <div className="pt-2 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Class
                        </label>
                        <select
                          value={formData.classTeacherClass}
                          onChange={(e) =>
                            setFormData({ ...formData, classTeacherClass: e.target.value })
                          }
                          className="input w-full bg-white text-sm"
                        >
                          {availableClasses.map((cls) => (
                            <option key={cls} value={cls}>
                              Class {cls}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Section
                        </label>
                        <select
                          value={formData.classTeacherSection}
                          onChange={(e) =>
                            setFormData({ ...formData, classTeacherSection: e.target.value })
                          }
                          className="input w-full bg-white text-sm"
                        >
                          {AVAILABLE_SECTIONS.map((sec) => (
                            <option key={sec} value={sec}>
                              Section {sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input w-full"
                    placeholder="Enter login password"
                    minLength={6}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Password must be at least 6 characters long.
                  </p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Edit Staff Member */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-900">Edit Staff Member</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={editFormData.mobile}
                      onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Role
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                      className="input w-full font-medium"
                    >
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={editFormData.designation}
                      onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editFormData.subject}
                      onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                      className="input w-full font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic RBAC Permission Preview for Selected Role */}
                <div className="p-3 rounded-xl border bg-slate-50/80 border-slate-200">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-800">
                      RBAC Access Profile: {RBAC_ROLE_PROFILES[editFormData.role]?.title}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      ({RBAC_ROLE_PROFILES[editFormData.role]?.subtitle})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    {RBAC_ROLE_PROFILES[editFormData.role]?.desc}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-xs">
                      <span className="font-bold text-emerald-700 block mb-1">✓ Granted Permissions:</span>
                      <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                        {RBAC_ROLE_PROFILES[editFormData.role]?.canDo.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="truncate">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-rose-100 shadow-xs">
                      <span className="font-bold text-rose-700 block mb-1">
                        {RBAC_ROLE_PROFILES[editFormData.role]?.restricted.length > 0 ? "✕ Role Restrictions:" : "✓ Full System Authority:"}
                      </span>
                      {RBAC_ROLE_PROFILES[editFormData.role]?.restricted.length > 0 ? (
                        <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                          {RBAC_ROLE_PROFILES[editFormData.role]?.restricted.map((item, idx) => (
                            <li key={idx} className="truncate">{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">No restrictions applied. Unrestricted root admin access.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Classes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Assigned Teaching Classes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableClasses.map((cls) => {
                      const isSelected = editFormData.assignedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() =>
                            handleToggleClass(cls, editFormData.assignedClasses, (newList) =>
                              setEditFormData({ ...editFormData, assignedClasses: newList })
                            )
                          }
                          className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">Class {cls}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Class Teacher Allocation */}
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-950">Appoint as Class Teacher</p>
                      <p className="text-xs text-amber-800/80">Class teacher role</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.isClassTeacher}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, isClassTeacher: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {editFormData.isClassTeacher && (
                    <div className="pt-2 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Class
                        </label>
                        <select
                          value={editFormData.classTeacherClass}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, classTeacherClass: e.target.value })
                          }
                          className="input w-full bg-white text-sm"
                        >
                          {availableClasses.map((cls) => (
                            <option key={cls} value={cls}>
                              Class {cls}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Section
                        </label>
                        <select
                          value={editFormData.classTeacherSection}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, classTeacherSection: e.target.value })
                          }
                          className="input w-full bg-white text-sm"
                        >
                          {AVAILABLE_SECTIONS.map((sec) => (
                            <option key={sec} value={sec}>
                              Section {sec}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
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
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* RBAC Access Matrix Modal */}
        {isRbacModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 bg-white/95 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shadow-sm shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">
                        Role-Based Access Control (RBAC) Matrix
                      </h2>
                      {isSuperAdmin && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                          Super Admin Managed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Segregation of Duties & Access Governance for all school staff
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {isSuperAdmin && !isEditingRbac && (
                    <button
                      type="button"
                      onClick={handleStartEditRbac}
                      className="btn btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow"
                      title="Manually configure role access permissions"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Customize Matrix</span>
                    </button>
                  )}
                  {isSuperAdmin && isEditingRbac && (
                    <>
                      <button
                        type="button"
                        onClick={handleResetRbacMatrix}
                        disabled={rbacSaving}
                        className="btn btn-secondary text-xs px-3 py-2 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                        title="Reset permissions to system defaults"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Reset Defaults</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditRbac}
                        disabled={rbacSaving}
                        className="btn btn-secondary text-xs px-3 py-2 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveRbacMatrix}
                        disabled={rbacSaving}
                        className="btn btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md hover:shadow-lg"
                      >
                        {rbacSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>{rbacSaving ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setIsRbacModalOpen(false);
                      setIsEditingRbac(false);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0 ml-1"
                    title="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 space-y-6 flex-1">
                {/* Feedback Banners */}
                {rbacSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{rbacSuccessMsg}</span>
                  </div>
                )}
                {rbacErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800 font-semibold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{rbacErrorMsg}</span>
                  </div>
                )}

                {/* Super Admin Status Banner */}
                {isSuperAdmin && !isEditingRbac && (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 text-xs text-purple-900">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        <strong className="font-bold">Super Admin Authority:</strong> You can manually reconfigure permissions across all 11 ERP modules at any time.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartEditRbac}
                      className="text-xs font-bold text-purple-700 bg-white hover:bg-purple-100 border border-purple-300 px-3 py-1.5 rounded-lg transition-all shadow-xs"
                    >
                      Edit RBAC Matrix
                    </button>
                  </div>
                )}

                {isSuperAdmin && isEditingRbac && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong className="font-bold">Matrix Editing Mode Active:</strong> Choose the desired access level (Full, Read, Restricted, Blocked) and customize permission notes below. Click <strong>Save Changes</strong> above or below to persist to database.
                    </span>
                  </div>
                )}

                {/* Role Profile Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Super Admin Card */}
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
                        Super Admin
                      </span>
                      <Lock className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Principal / Root System Authority</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Unrestricted root authority. Full access across all 11 modules, session activation, fee configuration, credentials control, and RBAC matrix governance.
                    </p>
                  </div>

                  {/* Admin Card */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                        Admin
                      </span>
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Operations Administration</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Operational authority over student records, fee collections, billing counter, examinations, TC certificates, and timetable routine.
                    </p>
                  </div>

                  {/* Faculty Card */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Faculty
                      </span>
                      <Clock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">Academic Teaching Staff</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Scoped academic portal. Access strictly restricted to personal teaching routine timetable and entering exam marks for allocated subjects only.
                    </p>
                  </div>
                </div>

                {/* Modules RBAC Matrix Table */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Module Permissions Breakdown ({isEditingRbac ? editedRbacModules.length : rbacModules.length} Modules)
                    </h3>
                    {rbacLoading && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                        Syncing matrix...
                      </span>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[760px]">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3.5 w-1/4">ERP Module</th>
                            <th className="px-3 py-3.5 w-1/4">Super Admin</th>
                            <th className="px-3 py-3.5 w-1/4">Admin</th>
                            <th className="px-3 py-3.5 w-1/4">Faculty Staff</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium bg-white">
                          {(isEditingRbac ? editedRbacModules : rbacModules).map((item, idx) => {
                            if (isEditingRbac) {
                              // EDIT MODE ROW
                              return (
                                <tr key={item.moduleKey || idx} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="px-4 py-3.5 align-top">
                                    <div className="font-bold text-slate-900 text-xs">{item.moduleName}</div>
                                    <div className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 mt-1">
                                      {item.path}
                                    </div>
                                  </td>

                                  {/* Super Admin Control */}
                                  <td className="px-3 py-3 align-top">
                                    <div className="space-y-1.5">
                                      <select
                                        value={item.superAdmin?.access || "full"}
                                        onChange={(e) =>
                                          handleUpdateModuleField(item.moduleKey, "superAdmin", "access", e.target.value)
                                        }
                                        className={`w-full text-xs font-bold py-1.5 px-2 rounded-lg border focus:ring-1 focus:ring-purple-400 ${
                                          item.superAdmin?.access === "full"
                                            ? "bg-purple-50 text-purple-800 border-purple-200"
                                            : item.superAdmin?.access === "read"
                                            ? "bg-blue-50 text-blue-800 border-blue-200"
                                            : item.superAdmin?.access === "restricted"
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : "bg-rose-50 text-rose-800 border-rose-200"
                                        }`}
                                      >
                                        <option value="full">Full Control</option>
                                        <option value="read">Read Only</option>
                                        <option value="restricted">Restricted</option>
                                        <option value="blocked">No Access (Blocked)</option>
                                      </select>
                                      <input
                                        type="text"
                                        value={item.superAdmin?.label || ""}
                                        onChange={(e) =>
                                          handleUpdateModuleField(item.moduleKey, "superAdmin", "label", e.target.value)
                                        }
                                        placeholder="Note for Super Admin..."
                                        className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-purple-400 focus:outline-none"
                                      />
                                    </div>
                                  </td>

                                  {/* Admin Control */}
                                  <td className="px-3 py-3 align-top">
                                    <div className="space-y-1.5">
                                      <select
                                        value={item.admin?.access || "full"}
                                        onChange={(e) =>
                                          handleUpdateModuleField(item.moduleKey, "admin", "access", e.target.value)
                                        }
                                        className={`w-full text-xs font-bold py-1.5 px-2 rounded-lg border focus:ring-1 focus:ring-blue-400 ${
                                          item.admin?.access === "full"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            : item.admin?.access === "read"
                                            ? "bg-blue-50 text-blue-800 border-blue-200"
                                            : item.admin?.access === "restricted"
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : "bg-rose-50 text-rose-800 border-rose-200"
                                        }`}
                                      >
                                        <option value="full">Full Control</option>
                                        <option value="read">Read Only</option>
                                        <option value="restricted">Restricted</option>
                                        <option value="blocked">No Access (Blocked)</option>
                                      </select>
                                      <input
                                        type="text"
                                        value={item.admin?.label || ""}
                                        onChange={(e) =>
                                          handleUpdateModuleField(item.moduleKey, "admin", "label", e.target.value)
                                        }
                                        placeholder="Note for Admin..."
                                        className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-blue-400 focus:outline-none"
                                      />
                                    </div>
                                  </td>

                                  {/* Faculty Control */}
                                  <td className="px-3 py-3 align-top">
                                    <div className="space-y-1.5">
                                      <select
                                        value={item.faculty?.access || "blocked"}
                                        onChange={(e) =>
                                          handleUpdateModuleField(item.moduleKey, "faculty", "access", e.target.value)
                                        }
                                        className={`w-full text-xs font-bold py-1.5 px-2 rounded-lg border focus:ring-1 focus:ring-emerald-400 ${
                                          item.faculty?.access === "full"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            : item.faculty?.access === "read"
                                            ? "bg-blue-50 text-blue-800 border-blue-200"
                                            : item.faculty?.access === "restricted"
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : "bg-rose-50 text-rose-800 border-rose-200"
                                        }`}
                                      >
                                        <option value="blocked">No Access (Blocked)</option>
                                        <option value="restricted">Restricted</option>
                                        <option value="read">Read Only</option>
                                        <option value="full">Full Control</option>
                                      </select>
                                      <input
                                        type="text"
                                        value={item.faculty?.label || ""}
                                        onChange={(e) =>
                                          handleUpdateModuleField(item.moduleKey, "faculty", "label", e.target.value)
                                        }
                                        placeholder="Note for Faculty..."
                                        className="w-full text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-emerald-400 focus:outline-none"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            // VIEW MODE ROW
                            return (
                              <tr key={item.moduleKey || idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-3.5 align-top">
                                  <div className="font-bold text-slate-900 text-xs">{item.moduleName}</div>
                                  <div className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 mt-1">
                                    {item.path}
                                  </div>
                                </td>

                                {/* Super Admin Badge */}
                                <td className="px-3 py-3 align-top">
                                  <div className="space-y-1">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                        item.superAdmin?.access === "full"
                                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                                          : item.superAdmin?.access === "read"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : item.superAdmin?.access === "restricted"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-rose-50 text-rose-700 border border-rose-200"
                                      }`}
                                    >
                                      {item.superAdmin?.access === "full" ? (
                                        <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                      ) : item.superAdmin?.access === "read" ? (
                                        <Eye className="w-3 h-3 text-blue-600" />
                                      ) : item.superAdmin?.access === "restricted" ? (
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                      ) : (
                                        <XCircle className="w-3 h-3 text-rose-600" />
                                      )}
                                      <span className="capitalize">{item.superAdmin?.access || "Full"} Access</span>
                                    </span>
                                    <p className="text-[11px] text-slate-600 leading-tight">
                                      {item.superAdmin?.label || "Full Control"}
                                    </p>
                                  </div>
                                </td>

                                {/* Admin Badge */}
                                <td className="px-3 py-3 align-top">
                                  <div className="space-y-1">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                        item.admin?.access === "full"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : item.admin?.access === "read"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : item.admin?.access === "restricted"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-rose-50 text-rose-700 border border-rose-200"
                                      }`}
                                    >
                                      {item.admin?.access === "full" ? (
                                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                      ) : item.admin?.access === "read" ? (
                                        <Eye className="w-3 h-3 text-blue-600" />
                                      ) : item.admin?.access === "restricted" ? (
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                      ) : (
                                        <XCircle className="w-3 h-3 text-rose-600" />
                                      )}
                                      <span className="capitalize">{item.admin?.access || "Full"} Access</span>
                                    </span>
                                    <p className="text-[11px] text-slate-600 leading-tight">
                                      {item.admin?.label || "Full Control"}
                                    </p>
                                  </div>
                                </td>

                                {/* Faculty Badge */}
                                <td className="px-3 py-3 align-top">
                                  <div className="space-y-1">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                        item.faculty?.access === "blocked"
                                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                                          : item.faculty?.access === "restricted"
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : item.faculty?.access === "read"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      }`}
                                    >
                                      {item.faculty?.access === "blocked" ? (
                                        <XCircle className="w-3 h-3 text-rose-600" />
                                      ) : item.faculty?.access === "restricted" ? (
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                      ) : item.faculty?.access === "read" ? (
                                        <Eye className="w-3 h-3 text-blue-600" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      )}
                                      <span className="capitalize">
                                        {item.faculty?.access === "blocked" ? "No Access" : item.faculty?.access}
                                      </span>
                                    </span>
                                    <p className="text-[11px] text-slate-600 leading-tight">
                                      {item.faculty?.label || "No Access"}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Security Governance Notice */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800">
                      Security & Compliance Architecture
                    </p>
                    <p>
                      Super Admin has exclusive authority to modify this matrix. Restrictions are enforced end-to-end via frontend conditional route guards and backend Express API middleware returning <code className="px-1 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[10px]">403 Forbidden</code> for unauthorized role calls.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-b-2xl">
                <div className="text-[11px] text-slate-500">
                  {isSuperAdmin ? (
                    <span>Authorized as <strong>Super Admin</strong> (Principal)</span>
                  ) : (
                    <span>Role-based matrix view for <strong>Operations Admin</strong></span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isSuperAdmin && isEditingRbac ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEditRbac}
                        disabled={rbacSaving}
                        className="btn btn-secondary text-xs px-4 py-2 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveRbacMatrix}
                        disabled={rbacSaving}
                        className="btn btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs px-5 py-2 font-bold flex items-center gap-1.5 shadow"
                      >
                        {rbacSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>{rbacSaving ? "Saving..." : "Save RBAC Matrix"}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={handleStartEditRbac}
                          className="btn btn-secondary border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs px-4 py-2 font-bold flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Edit Matrix</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRbacModalOpen(false);
                          setIsEditingRbac(false);
                        }}
                        className="btn btn-secondary text-xs px-5 py-2 font-bold"
                      >
                        Close Matrix
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* MODAL 5: Super Admin Reset Password */}
        {isResetPwdModalOpen && targetUserForPwd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Key className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Super Admin Password Reset</h3>
                    <p className="text-xs text-amber-100">Override password for staff member</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResetPwdModalOpen(false)}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminResetPassword} className="p-6 space-y-4">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80">
                  <div className="text-xs font-bold text-amber-900 mb-0.5">
                    Target Staff Member
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    {targetUserForPwd.name}
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">
                    Mobile: {targetUserForPwd.mobile} • Role: {targetUserForPwd.role}
                  </div>
                </div>

                {resetPwdError && (
                  <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
                    {resetPwdError}
                  </div>
                )}
                {resetPwdSuccess && (
                  <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                    {resetPwdSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Password for Staff Member *
                  </label>
                  <input
                    type="text"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new secure password (min 6 chars)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    As Super Admin, you can set any temporary or permanent password without knowing their current password.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResetPwdModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPwdLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{resetPwdLoading ? "Resetting..." : "Set Password"}</span>
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
