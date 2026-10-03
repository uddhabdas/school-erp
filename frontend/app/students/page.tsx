"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { X, UserCheck, Trash2, ArrowUpRight, CheckCircle2, AlertCircle, Search, Edit2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type Student = {
  _id: string;
  studentId: string;
  admissionNo: string;
  personal: {
    name: string;
    mobile: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    aadhaar?: string;
    photo?: string;
  };
  academic: {
    class: string;
    section?: string;
    rollNo?: number;
    sessionName?: string;
  };
  parents: {
    fatherName?: string;
    motherName?: string;
    guardian?: string;
    parentMobile?: string;
  };
  address: {
    village?: string;
    post?: string;
    district?: string;
    block?: string;
    state?: string;
    pincode?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };
  status: string;
  admissionDate?: string;
};

type Session = {
  _id: string;
  sessionName: string;
  status: string;
};

export default function Students() {
  const { user, token } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isAdminOrSuperAdmin = user?.role === "admin" || isSuperAdmin;

  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [classFilter, setClassFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Promote modal state
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteSourceClass, setPromoteSourceClass] = useState("8");
  const [promoteTargetClass, setPromoteTargetClass] = useState("9");
  const [promoteTargetSession, setPromoteTargetSession] = useState("");
  const [promoteStatus, setPromoteStatus] = useState("active");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit student modal state
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState({
    name: "",
    mobile: "",
    gender: "male",
    dob: "",
    bloodGroup: "",
    aadhaar: "",
    class: "8",
    section: "",
    rollNo: 1,
    status: "active",
    fatherName: "",
    motherName: "",
    guardian: "",
    parentMobile: "",
    village: "",
    post: "",
    block: "",
    district: "",
    state: "Odisha",
    pincode: "",
  });

  const handleOpenEditStudent = (student: Student) => {
    setEditStudentForm({
      name: student.personal?.name || "",
      mobile: student.personal?.mobile || "",
      gender: student.personal?.gender || "male",
      dob: student.personal?.dob ? student.personal.dob.split("T")[0] : "",
      bloodGroup: student.personal?.bloodGroup || "",
      aadhaar: student.personal?.aadhaar || "",
      class: student.academic?.class || "8",
      section: student.academic?.section || "",
      rollNo: student.academic?.rollNo || 1,
      status: student.status || "active",
      fatherName: student.parents?.fatherName || "",
      motherName: student.parents?.motherName || "",
      guardian: student.parents?.guardian || "",
      parentMobile: student.parents?.parentMobile || "",
      village: student.address?.village || "",
      post: student.address?.post || "",
      block: student.address?.block || "",
      district: student.address?.district || "",
      state: student.address?.state || "Odisha",
      pincode: student.address?.pincode || "",
    });
    setIsEditStudentModalOpen(true);
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/students/${selectedStudent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          personal: {
            ...selectedStudent.personal,
            name: editStudentForm.name,
            mobile: editStudentForm.mobile,
            gender: editStudentForm.gender,
            dob: editStudentForm.dob ? new Date(editStudentForm.dob) : undefined,
            bloodGroup: editStudentForm.bloodGroup,
            aadhaar: editStudentForm.aadhaar,
          },
          academic: {
            ...selectedStudent.academic,
            class: editStudentForm.class,
            section: editStudentForm.section,
            rollNo: Number(editStudentForm.rollNo) || undefined,
          },
          parents: {
            ...selectedStudent.parents,
            fatherName: editStudentForm.fatherName,
            motherName: editStudentForm.motherName,
            guardian: editStudentForm.guardian,
            parentMobile: editStudentForm.parentMobile,
          },
          address: {
            ...selectedStudent.address,
            village: editStudentForm.village,
            post: editStudentForm.post,
            block: editStudentForm.block,
            district: editStudentForm.district,
            state: editStudentForm.state,
            pincode: editStudentForm.pincode,
          },
          status: editStudentForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update student");

      setSuccess("Student record updated successfully!");
      setIsEditStudentModalOpen(false);
      setSelectedStudent(data);
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Failed to update student");
    } finally {
      setSubmitting(false);
    }
  };

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filter) params.append("status", filter);
      if (classFilter) params.append("class", classFilter);

      const res = await fetch(`${API_BASE_URL}/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
        if (data.length > 0) {
          setPromoteTargetSession(data[0].sessionName);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStudents();
      fetchSessions();
    }
  }, [token, search, filter, classFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "passed_out":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  // Open Promote modal
  const handleOpenPromote = () => {
    setError("");
    setSuccess("");
    // Find students matching default source class
    const eligible = students.filter(
      (s) => s.academic?.class === promoteSourceClass && s.status === "active"
    );
    setSelectedStudentIds(eligible.map((s) => s._id));
    setIsPromoteModalOpen(true);
  };

  // Change promote source class
  const handleSourceClassChange = (newSource: string) => {
    setPromoteSourceClass(newSource);
    if (newSource === "8") {
      setPromoteTargetClass("9");
      setPromoteStatus("active");
    } else if (newSource === "9") {
      setPromoteTargetClass("10");
      setPromoteStatus("active");
    } else if (newSource === "10") {
      setPromoteTargetClass("10");
      setPromoteStatus("passed_out");
    }
    const eligible = students.filter(
      (s) => s.academic?.class === newSource && s.status === "active"
    );
    setSelectedStudentIds(eligible.map((s) => s._id));
  };

  const handleToggleStudentSelection = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPromote = () => {
    const eligible = students.filter(
      (s) => s.academic?.class === promoteSourceClass && s.status === "active"
    );
    if (selectedStudentIds.length === eligible.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligible.map((s) => s._id));
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      setError("Please select at least one student to promote.");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/students/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          newSession: promoteTargetSession,
          newClass: promoteTargetClass,
          status: promoteStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to promote students");

      setSuccess(data.message || `Successfully promoted ${selectedStudentIds.length} students!`);
      setIsPromoteModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Promotion failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/students/${selectedStudent._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete student");

      setSuccess("Student record deleted successfully.");
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err: any) {
      setError(err.message || "Deletion failed");
    } finally {
      setSubmitting(false);
    }
  };

  const eligibleStudentsForPromote = students.filter(
    (s) => s.academic?.class === promoteSourceClass && s.status === "active"
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
            <p className="text-sm text-slate-500 mt-1">
              View student records, manage class progression, and academic history
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={handleOpenPromote}
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <ArrowUpRight className="w-5 h-5" />
              Promote Students
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, admission no, mobile, or student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="input w-full md:w-44"
          >
            <option value="">All Classes</option>
            <option value="8">Class 8</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-full md:w-44"
          >
            <option value="active">Active</option>
            <option value="passed_out">Passed Out</option>
            <option value="inactive">Inactive</option>
            <option value="">All Statuses</option>
          </select>
        </div>

        {/* Students Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="card overflow-hidden shadow-sm border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Student ID
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Admission No
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Class & Session
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Mobile
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr
                      key={student._id}
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => handleRowClick(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {student.admissionNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{student.personal?.name}</div>
                        {student.personal?.gender && (
                          <div className="text-xs text-slate-400 capitalize">{student.personal.gender}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        <span className="font-semibold">Class {student.academic?.class}</span>
                        {student.academic?.section && ` (${student.academic.section})`}
                        {student.academic?.sessionName && (
                          <div className="text-xs text-slate-400">{student.academic.sessionName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {student.personal?.mobile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-full capitalize ${getStatusColor(
                            student.status
                          )}`}
                        >
                          {student.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No students found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {isModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Student Profile</h2>
                  <p className="text-xs text-slate-500">
                    ID: {selectedStudent.studentId} | Admission: {selectedStudent.admissionNo}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Info */}
                <div className="card p-6 border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedStudent.personal?.photo && (
                      <div className="md:col-span-2 flex justify-center">
                        <img
                          src={selectedStudent.personal.photo}
                          alt="Student"
                          className="w-28 h-28 rounded-full object-cover border-4 border-slate-100 shadow-md"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-500">Full Name</p>
                      <p className="font-bold text-slate-900">{selectedStudent.personal?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Mobile</p>
                      <p className="font-medium text-slate-900">{selectedStudent.personal?.mobile}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Gender</p>
                      <p className="font-medium text-slate-900 capitalize">
                        {selectedStudent.personal?.gender || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Date of Birth</p>
                      <p className="font-medium text-slate-900">
                        {selectedStudent.personal?.dob
                          ? new Date(selectedStudent.personal.dob).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Aadhaar Number</p>
                      <p className="font-medium text-slate-900">
                        {selectedStudent.personal?.aadhaar || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Blood Group</p>
                      <p className="font-medium text-slate-900">
                        {selectedStudent.personal?.bloodGroup || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="card p-6 border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Academic Information</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Current Class</p>
                      <p className="font-bold text-slate-900">Class {selectedStudent.academic?.class}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Section / Roll</p>
                      <p className="font-medium text-slate-900">
                        {selectedStudent.academic?.section || "-"} / {selectedStudent.academic?.rollNo || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Session</p>
                      <p className="font-medium text-slate-900">
                        {selectedStudent.academic?.sessionName || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Parents Info */}
                {selectedStudent.parents && (
                  <div className="card p-6 border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Parents & Guardian</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Father's Name</p>
                        <p className="font-medium text-slate-900">
                          {selectedStudent.parents.fatherName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Mother's Name</p>
                        <p className="font-medium text-slate-900">
                          {selectedStudent.parents.motherName || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Guardian Name</p>
                        <p className="font-medium text-slate-900">
                          {selectedStudent.parents.guardian || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Parent Mobile</p>
                        <p className="font-medium text-slate-900">
                          {selectedStudent.parents.parentMobile || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Administrative Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isAdminOrSuperAdmin && (
                      <button
                        onClick={() => handleOpenEditStudent(selectedStudent)}
                        className="btn py-2 px-4 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold flex items-center gap-2 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Student Record
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="btn py-2 px-4 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold flex items-center gap-2 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedStudent(null);
                    }}
                    className="btn btn-secondary py-2 px-5 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promote Students Modal */}
        {isPromoteModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Promote Students</h2>
                </div>
                <button
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePromoteSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Current Class
                    </label>
                    <select
                      value={promoteSourceClass}
                      onChange={(e) => handleSourceClassChange(e.target.value)}
                      className="input w-full font-bold"
                    >
                      <option value="8">Class 8</option>
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Target Class / Status
                    </label>
                    {promoteSourceClass === "10" ? (
                      <div className="p-2.5 bg-blue-100 text-blue-900 font-bold rounded-xl text-sm border border-blue-200">
                        Graduate (Passed Out)
                      </div>
                    ) : (
                      <select
                        value={promoteTargetClass}
                        onChange={(e) => setPromoteTargetClass(e.target.value)}
                        className="input w-full font-bold"
                      >
                        {promoteSourceClass === "8" && <option value="9">Class 9</option>}
                        {promoteSourceClass === "9" && <option value="10">Class 10</option>}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      New Session
                    </label>
                    <input
                      type="text"
                      required
                      value={promoteTargetSession}
                      onChange={(e) => setPromoteTargetSession(e.target.value)}
                      placeholder="e.g. 2026-2027"
                      className="input w-full font-bold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-800">
                      Eligible Students in Class {promoteSourceClass} ({eligibleStudentsForPromote.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllPromote}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {selectedStudentIds.length === eligibleStudentsForPromote.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
                    {eligibleStudentsForPromote.map((student) => {
                      const isSelected = selectedStudentIds.includes(student._id);
                      return (
                        <div
                          key={student._id}
                          onClick={() => handleToggleStudentSelection(student._id)}
                          className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <div className="flex-1">
                            <span className="font-bold text-sm text-slate-900">
                              {student.personal?.name}
                            </span>
                            <span className="text-xs text-slate-500 ml-2">
                              ({student.admissionNo})
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
                            {student.studentId}
                          </span>
                        </div>
                      );
                    })}
                    {eligibleStudentsForPromote.length === 0 && (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        No active students found currently enrolled in Class {promoteSourceClass}.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPromoteModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || selectedStudentIds.length === 0}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting
                      ? "Promoting..."
                      : `Promote (${selectedStudentIds.length}) Students`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Student Record</h3>
                  <p className="text-xs text-slate-500">Super Admin action</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                Are you sure you want to permanently delete student{" "}
                <strong className="text-slate-900">{selectedStudent.personal?.name}</strong> (
                {selectedStudent.studentId})? This will also remove academic history records.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStudent}
                  disabled={submitting}
                  className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {submitting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Student Modal */}
        {isEditStudentModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Edit Student Record</h2>
                </div>
                <button
                  onClick={() => setIsEditStudentModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditStudentSubmit} className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editStudentForm.name}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={editStudentForm.mobile}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, mobile: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={editStudentForm.gender}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value })}
                        className="input w-full capitalize"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={editStudentForm.dob}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, dob: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Blood Group
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. O+, A+, B+"
                        value={editStudentForm.bloodGroup}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, bloodGroup: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Aadhaar Number
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.aadhaar}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, aadhaar: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Academic Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Class
                      </label>
                      <select
                        value={editStudentForm.class}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, class: e.target.value })}
                        className="input w-full font-bold"
                      >
                        <option value="8">Class 8</option>
                        <option value="9">Class 9</option>
                        <option value="10">Class 10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Section
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. A"
                        value={editStudentForm.section}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, section: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Roll Number
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editStudentForm.rollNo}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, rollNo: Number(e.target.value) })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Enrollment Status
                      </label>
                      <select
                        value={editStudentForm.status}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, status: e.target.value })}
                        className="input w-full font-semibold capitalize"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="transferred">Transferred</option>
                        <option value="passed_out">Passed Out</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Parents Details */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Parents & Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Father's Name
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.fatherName}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, fatherName: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mother's Name
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.motherName}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, motherName: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.guardian}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, guardian: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Parent Mobile
                      </label>
                      <input
                        type="tel"
                        value={editStudentForm.parentMobile}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, parentMobile: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Details */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Address
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Village / Street
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.village}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, village: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.district}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, district: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        value={editStudentForm.pincode}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, pincode: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditStudentModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
                  >
                    {submitting ? "Saving..." : "Save Student Changes"}
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
