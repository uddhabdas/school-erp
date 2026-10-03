"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Edit2, X, Plus, Archive, PowerOff, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type Session = {
  _id: string;
  sessionName: string;
  startDate: string;
  endDate: string;
  admissionOpen: boolean;
  allowedClasses: string[];
  status: "active" | "inactive" | "archived";
};

export default function Sessions() {
  const { user, token } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: "close" | "archive";
    session: Session;
  } | null>(null);

  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [actionSecurityCode, setActionSecurityCode] = useState("");

  const [editForm, setEditForm] = useState({
    sessionName: "",
    startDate: "",
    endDate: "",
    admissionOpen: false,
    allowedClasses: [] as string[],
    securityCode: "",
  });

  const [createForm, setCreateForm] = useState({
    sessionName: "",
    startDate: "",
    endDate: "",
    admissionOpen: true,
    allowedClasses: ["8", "9"] as string[],
    securityCode: "",
  });

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch academic sessions");
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
      startDate: session.startDate.split("T")[0],
      endDate: session.endDate.split("T")[0],
      admissionOpen: session.admissionOpen,
      allowedClasses: session.allowedClasses || [],
      securityCode: "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${editingSession._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update session");

      setSessions(sessions.map((s) => (s._id === data._id ? data : s)));
      setSuccess("Session updated successfully!");
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
      const res = await fetch(`${API_BASE_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create session");

      setSessions([data, ...sessions]);
      setSuccess("Academic session created successfully!");
      setIsCreateModalOpen(false);
      setCreateForm({
        sessionName: "",
        startDate: "",
        endDate: "",
        admissionOpen: true,
        allowedClasses: ["8", "9"],
        securityCode: "",
      });
    } catch (err: any) {
      setError(err.message || "Error creating session");
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

  const handleClassToggle = (cls: string) => {
    setEditForm((prev) => ({
      ...prev,
      allowedClasses: prev.allowedClasses.includes(cls)
        ? prev.allowedClasses.filter((c) => c !== cls)
        : [...prev.allowedClasses, cls],
    }));
  };

  const handleCreateClassToggle = (cls: string) => {
    setCreateForm((prev) => ({
      ...prev,
      allowedClasses: prev.allowedClasses.includes(cls)
        ? prev.allowedClasses.filter((c) => c !== cls)
        : [...prev.allowedClasses, cls],
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Academic Sessions</h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure school academic years, admission windows, and class offerings
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setIsCreateModalOpen(true);
              }}
              className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Create New Session
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session._id}
                className="card p-6 border border-slate-100 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{session.sessionName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(session.startDate).toLocaleDateString()} —{" "}
                        {new Date(session.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${
                        session.status === "active"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : session.status === "archived"
                          ? "bg-slate-100 text-slate-700 border border-slate-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>

                  <div className="space-y-3 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Admissions:</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          session.admissionOpen
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {session.admissionOpen ? "Open" : "Closed"}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1">
                        Allowed Classes:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {session.allowedClasses?.map((cls) => (
                          <span
                            key={cls}
                            className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg"
                          >
                            Class {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleEditClick(session)}
                      className="btn btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-semibold text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    <div className="flex items-center gap-2">
                      {session.status === "active" && (
                        <button
                          onClick={() => {
                            setActionSecurityCode("");
                            setError("");
                            setActionModal({ type: "close", session });
                          }}
                          className="py-1.5 px-3 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all flex items-center gap-1"
                          title="Close Session (Disable admissions)"
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
                          className="py-1.5 px-3 text-xs font-semibold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1"
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
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && editingSession && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-900">Edit Academic Session</h2>
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
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={editForm.sessionName}
                    onChange={(e) => setEditForm({ ...editForm, sessionName: e.target.value })}
                    className="input w-full"
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
                  <label htmlFor="editAdmissionOpen" className="text-sm font-semibold text-slate-700">
                    Open for Admissions
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Allowed Classes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["8", "9", "10"].map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleClassToggle(cls)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          editForm.allowedClasses.includes(cls)
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Class {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Super Admin Security Code *
                  </label>
                  <input
                    type="password"
                    value={editForm.securityCode}
                    onChange={(e) => setEditForm({ ...editForm, securityCode: e.target.value })}
                    className="input w-full"
                    placeholder="Enter security code (e.g. admin123)"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">Default security code is admin123</p>
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

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-900">Create Academic Session</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Session Name (e.g. 2026-2027) *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.sessionName}
                    onChange={(e) => setCreateForm({ ...createForm, sessionName: e.target.value })}
                    className="input w-full"
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
                  <label htmlFor="createAdmissionOpen" className="text-sm font-semibold text-slate-700">
                    Open for Admissions
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Allowed Classes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["8", "9", "10"].map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleCreateClassToggle(cls)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          createForm.allowedClasses.includes(cls)
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Class {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Super Admin Security Code *
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.securityCode}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, securityCode: e.target.value })
                    }
                    className="input w-full"
                    placeholder="Enter security code (e.g. admin123)"
                  />
                  <p className="text-xs text-slate-400 mt-1">Default security code is admin123</p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
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
                    {submitting ? "Creating..." : "Create Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Action Modal (Close / Archive) */}
        {actionModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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
                    className="input w-full"
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
  );
}
