"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, CheckCircle, XCircle, GraduationCap, User, Users, MapPin, FileText, Loader2, CreditCard } from "lucide-react";

type Application = {
  _id: string;
  applicationId: string;
  status: string;
  student: {
    name: string;
    gender: string;
    dob: string;
    bloodGroup: string;
    aadhaar: string;
    mobile: string;
  };
  parents: {
    fatherName: string;
    motherName: string;
    guardian: string;
    parentMobile: string;
  };
  address: {
    village: string;
    post: string;
    district: string;
    block: string;
    state: string;
    pincode: string;
  };
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
  };
  academic: {
    class: string;
    previousSchool: string;
    sessionName: string;
  };
  createdAt: string;
  rejectionReason?: string;
};

export default function Admissions() {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("submitted");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admissions?status=${filter}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setApplications(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchApplications();
  }, [token, filter]);

  const handleAction = async (id: string, action: "approve" | "reject", reason?: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admissions/${id}/${action}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: reason ? JSON.stringify({ reason }) : undefined,
        }
      );
      if (res.ok) {
        setApplications(applications.filter((a) => a._id !== id));
        if (selectedApp?._id === id) setSelectedApp(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "pending_verification":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Admissions</h1>
          <Link href="/admissions/apply" className="btn btn-primary">
            New Application
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {["submitted", "pending_verification", "approved", "rejected"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl capitalize font-semibold transition-all ${
                  filter === f
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            )
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="card p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">{app.student.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          app.status
                        )}`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <p><strong>ID:</strong> {app.applicationId}</p>
                      <p><strong>Class:</strong> {app.academic.class}</p>
                      <p><strong>Date:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {app.status === "submitted" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(app._id, "approve");
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const reason = prompt("Rejection reason:");
                            if (reason) handleAction(app._id, "reject", reason);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {applications.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p className="text-lg">No applications found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Application ID & Status */}
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500">Application ID</p>
                  <p className="text-lg font-bold text-gray-900">{selectedApp.applicationId}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                    selectedApp.status
                  )}`}
                >
                  {selectedApp.status.replace("_", " ")}
                </span>
              </div>

              {/* Academic Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-blue-800 font-bold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" /> Academic Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Session:</strong> {selectedApp.academic.sessionName}</p>
                  <p><strong>Class:</strong> {selectedApp.academic.class}</p>
                  <p className="md:col-span-2"><strong>Previous School:</strong> {selectedApp.academic.previousSchool || "-"}</p>
                </div>
              </div>

              {/* Student Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" /> Student Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Name:</strong> {selectedApp.student.name}</p>
                  <p><strong>Gender:</strong> {selectedApp.student.gender}</p>
                  <p><strong>Date of Birth:</strong> {selectedApp.student.dob}</p>
                  <p><strong>Blood Group:</strong> {selectedApp.student.bloodGroup || "-"}</p>
                  <p><strong>Aadhaar Number:</strong> {selectedApp.student.aadhaar || "-"}</p>
                  <p><strong>Mobile:</strong> {selectedApp.student.mobile}</p>
                </div>
              </div>

              {/* Parent Info */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-100">
                <h3 className="text-yellow-800 font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Parent Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Father's Name:</strong> {selectedApp.parents.fatherName}</p>
                  <p><strong>Mother's Name:</strong> {selectedApp.parents.motherName}</p>
                  <p><strong>Guardian:</strong> {selectedApp.parents.guardian || "-"}</p>
                  <p><strong>Parent's Mobile:</strong> {selectedApp.parents.parentMobile}</p>
                </div>
              </div>

              {/* Address Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <h3 className="text-purple-800 font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Address Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Village:</strong> {selectedApp.address.village}</p>
                  <p><strong>Post:</strong> {selectedApp.address.post}</p>
                  <p><strong>Block:</strong> {selectedApp.address.block}</p>
                  <p><strong>District:</strong> {selectedApp.address.district}</p>
                  <p><strong>State:</strong> {selectedApp.address.state}</p>
                  <p><strong>Pincode:</strong> {selectedApp.address.pincode}</p>
                </div>
              </div>

              {/* Bank Details if applicable */}
              {selectedApp.bankDetails && (selectedApp.bankDetails.accountHolderName || selectedApp.bankDetails.accountNumber || selectedApp.bankDetails.bankName) && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                  <h3 className="text-indigo-800 font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> Bank Account Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><strong>Account Holder:</strong> {selectedApp.bankDetails.accountHolderName || "-"}</p>
                      <p><strong>Account Number:</strong> {selectedApp.bankDetails.accountNumber || "-"}</p>
                      <p><strong>Bank Name:</strong> {selectedApp.bankDetails.bankName || "-"}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>IFSC Code:</strong> {selectedApp.bankDetails.ifscCode || "-"}</p>
                      <p><strong>Branch Name:</strong> {selectedApp.bankDetails.branchName || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Reason if applicable */}
              {selectedApp.rejectionReason && (
                <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                  <h3 className="text-red-800 font-bold mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-700">{selectedApp.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {selectedApp.status === "submitted" && (
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleAction(selectedApp._id, "approve")}
                    className="btn btn-success"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Rejection reason:");
                      if (reason) handleAction(selectedApp._id, "reject", reason);
                    }}
                    className="btn btn-danger"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
