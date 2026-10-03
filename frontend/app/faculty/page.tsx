"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { UserPlus, Trash2, Edit2, X, Search, Shield, CheckCircle2, AlertCircle } from "lucide-react";

type User = {
  _id: string;
  employeeId?: string;
  name: string;
  email?: string;
  role: "super_admin" | "admin" | "faculty";
  mobile: string;
  status: "active" | "inactive";
  designation?: string;
};

export default function Faculty() {
  const { user: currentUser, token } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [faculty, setFaculty] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "faculty",
    designation: "",
    password: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    mobile: "",
    role: "faculty",
    designation: "",
    status: "active",
  });

  const [securityCode, setSecurityCode] = useState("");
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
    if (token) fetchFaculty();
  }, [token]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
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
        password: "",
      });
      fetchFaculty();
    } catch (err: any) {
      setError(err.message || "Failed to create user account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      setSuccess("User updated successfully");
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchFaculty();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedUser._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ securityCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to deactivate user");
      }

      setSuccess("User deactivated successfully");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      setSecurityCode("");
      fetchFaculty();
    } catch (err: any) {
      setError(err.message || "Failed to deactivate user");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    const matchesSearch =
      search === "" ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase()) ||
      f.mobile?.includes(search) ||
      f.employeeId?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "" || f.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faculty & Staff Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage school teachers, administrators, and staff credentials
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setIsAddModalOpen(true);
              }}
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Add Staff / User
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

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-full md:w-56"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin (Principal)</option>
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        {/* Table */}
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
                      Employee ID
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Mobile & Email
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase">
                      Status
                    </th>
                    {isSuperAdmin && (
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFaculty.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                        {f.employeeId || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{f.name}</div>
                        {f.designation && (
                          <div className="text-xs text-slate-500">{f.designation}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                            f.role === "super_admin"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : f.role === "admin"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {f.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div>{f.mobile}</div>
                        {f.email && <div className="text-xs text-slate-400">{f.email}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-full ${
                            f.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(f);
                                setEditFormData({
                                  name: f.name || "",
                                  mobile: f.mobile || "",
                                  role: f.role || "faculty",
                                  designation: f.designation || "",
                                  status: f.status || "active",
                                });
                                setError("");
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {currentUser?._id !== f._id && (
                              <button
                                onClick={() => {
                                  setSelectedUser(f);
                                  setSecurityCode("");
                                  setError("");
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Deactivate User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredFaculty.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No staff members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Create Staff / User Account</h2>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
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

                <div className="grid grid-cols-2 gap-4">
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
                      placeholder="e.g. Mathematics Teacher"
                    />
                  </div>
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

                <div className="flex gap-3 pt-4 border-t border-slate-100">
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
                    {submitting ? "Creating Account..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-900">Edit Staff Member</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
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

                <div className="grid grid-cols-2 gap-4">
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

                <div className="flex gap-3 pt-4 border-t border-slate-100">
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

        {/* Deactivate User Modal */}
        {isDeleteModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Deactivate User Account</h3>
                  <p className="text-xs text-slate-500">Requires Super Admin security code</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to deactivate <strong className="text-slate-900">{selectedUser.name}</strong> ({selectedUser.email || selectedUser.mobile})? They will no longer be able to log in.
              </p>

              <form onSubmit={handleDeleteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Security Code *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter admin security code"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    className="input w-full"
                  />
                  <p className="text-xs text-slate-400 mt-1">Default security code is admin123</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setSelectedUser(null);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !securityCode}
                    className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    {submitting ? "Deactivating..." : "Confirm Deactivation"}
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
