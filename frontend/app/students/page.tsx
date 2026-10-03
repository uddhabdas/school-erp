"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

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

export default function Students() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (filter) params.append("status", filter);
        
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/students?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setStudents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStudents();
  }, [token, search, filter]);

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

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Students</h1>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, admission no, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="active">Active</option>
            <option value="passed_out">Passed Out</option>
            <option value="inactive">Inactive</option>
            <option value="">All</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Admission No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mobile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr 
                      key={student._id} 
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleRowClick(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.admissionNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.personal.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Class {student.academic.class}
                        {student.academic.section && ` - ${student.academic.section}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.personal.mobile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            student.status
                          )}`}
                        >
                          {student.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No students found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {isModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-900">Student Details</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Info */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedStudent.personal.photo && (
                      <div className="md:col-span-2 flex justify-center">
                        <img 
                          src={selectedStudent.personal.photo} 
                          alt="Student" 
                          className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-md"
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-medium text-slate-900">{selectedStudent.personal.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Gender</p>
                      <p className="font-medium text-slate-900">{selectedStudent.personal.gender || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Date of Birth</p>
                      <p className="font-medium text-slate-900">
                        {selectedStudent.personal.dob ? new Date(selectedStudent.personal.dob).toLocaleDateString("en-IN") : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Blood Group</p>
                      <p className="font-medium text-slate-900">{selectedStudent.personal.bloodGroup || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Aadhaar Number</p>
                      <p className="font-medium text-slate-900">{selectedStudent.personal.aadhaar || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Mobile Number</p>
                      <p className="font-medium text-slate-900">{selectedStudent.personal.mobile}</p>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Academic Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Student ID</p>
                      <p className="font-medium text-slate-900">{selectedStudent.studentId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Admission No</p>
                      <p className="font-medium text-slate-900">{selectedStudent.admissionNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Session</p>
                      <p className="font-medium text-slate-900">{selectedStudent.academic.sessionName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Class & Section</p>
                      <p className="font-medium text-slate-900">
                        Class {selectedStudent.academic.class}
                        {selectedStudent.academic.section && ` - ${selectedStudent.academic.section}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Roll Number</p>
                      <p className="font-medium text-slate-900">{selectedStudent.academic.rollNo || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Admission Date</p>
                      <p className="font-medium text-slate-900">
                        {selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString("en-IN") : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Status</p>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(
                          selectedStudent.status
                        )}`}
                      >
                        {selectedStudent.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parents Info */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Parents/Guardian Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Father's Name</p>
                      <p className="font-medium text-slate-900">{selectedStudent.parents.fatherName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Mother's Name</p>
                      <p className="font-medium text-slate-900">{selectedStudent.parents.motherName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Guardian</p>
                      <p className="font-medium text-slate-900">{selectedStudent.parents.guardian || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Parent's Mobile</p>
                      <p className="font-medium text-slate-900">{selectedStudent.parents.parentMobile || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Address</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Village</p>
                      <p className="font-medium text-slate-900">{selectedStudent.address.village || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Post Office</p>
                      <p className="font-medium text-slate-900">{selectedStudent.address.post || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Block</p>
                      <p className="font-medium text-slate-900">{selectedStudent.address.block || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">District</p>
                      <p className="font-medium text-slate-900">{selectedStudent.address.district || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">State</p>
                      <p className="font-medium text-slate-900">{selectedStudent.address.state || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Pincode</p>
                      <p className="font-medium text-slate-900">{selectedStudent.address.pincode || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                {selectedStudent.bankDetails && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Bank Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Account Holder Name</p>
                        <p className="font-medium text-slate-900">{selectedStudent.bankDetails.accountHolderName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Account Number</p>
                        <p className="font-medium text-slate-900">{selectedStudent.bankDetails.accountNumber || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Bank Name</p>
                        <p className="font-medium text-slate-900">{selectedStudent.bankDetails.bankName || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Branch Name</p>
                        <p className="font-medium text-slate-900">{selectedStudent.bankDetails.branchName || "-"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-slate-600">IFSC Code</p>
                        <p className="font-medium text-slate-900">{selectedStudent.bankDetails.ifscCode || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
