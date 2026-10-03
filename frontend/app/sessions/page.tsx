"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Edit2, X } from "lucide-react";

type Session = {
  _id: string;
  sessionName: string;
  startDate: string;
  endDate: string;
  admissionOpen: boolean;
  allowedClasses: string[];
  status: string;
};

export default function Sessions() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
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
    admissionOpen: false,
    allowedClasses: [] as string[],
    securityCode: "",
  });

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/sessions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setSessions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchSessions();
  }, [token]);

  const handleEditClick = (session: Session) => {
    setEditingSession(session);
    setEditForm({
      sessionName: session.sessionName,
      startDate: new Date(session.startDate).toISOString().split("T")[0],
      endDate: new Date(session.endDate).toISOString().split("T")[0],
      admissionOpen: session.admissionOpen,
      allowedClasses: session.allowedClasses,
      securityCode: "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/${editingSession._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (res.ok) {
        const updated = await res.json();
        setSessions(sessions.map((s) => s._id === updated._id ? updated : s));
        setIsEditModalOpen(false);
        setEditingSession(null);
      }
    } catch (error) {
      console.error(error);
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(createForm),
        }
      );

      if (res.ok) {
        const newSession = await res.json();
        setSessions([newSession, ...sessions]);
        setIsCreateModalOpen(false);
        setCreateForm({
          sessionName: "",
          startDate: "",
          endDate: "",
          admissionOpen: false,
          allowedClasses: [],
          securityCode: "",
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Academic Sessions
          </h1>
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Session
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {sessions.map((session) => (
              <div key={session._id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.sessionName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(session.startDate).toLocaleDateString()} -{" "}
                      {new Date(session.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        session.status === "active"
                          ? "bg-green-100 text-green-800"
                          : session.status === "archived"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {session.status}
                    </span>
                    <button
                      onClick={() => handleEditClick(session)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {session.admissionOpen && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Admission Open
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-1">Allowed Classes:</p>
                  <div className="flex flex-wrap gap-2">
                    {session.allowedClasses.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded"
                      >
                        Class {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Edit Session</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={editForm.sessionName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, sessionName: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startDate: e.target.value })
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, endDate: e.target.value })
                      }
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="admissionOpen"
                    checked={editForm.admissionOpen}
                    onChange={(e) =>
                      setEditForm({ ...editForm, admissionOpen: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="admissionOpen"
                    className="text-sm font-medium text-slate-700"
                  >
                    Admission Open
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Allowed Classes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["8", "9", "10"].map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleClassToggle(cls)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          editForm.allowedClasses.includes(cls)
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Class {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Security Code
                  </label>
                  <input
                    type="password"
                    value={editForm.securityCode}
                    onChange={(e) =>
                      setEditForm({ ...editForm, securityCode: e.target.value })
                    }
                    className="input"
                    placeholder="Enter security code"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Create New Session</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={createForm.sessionName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, sessionName: e.target.value })
                    }
                    className="input"
                    placeholder="e.g. 2026-2027"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={createForm.startDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, startDate: e.target.value })
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={createForm.endDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, endDate: e.target.value })
                      }
                      className="input"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="createAdmissionOpen"
                    checked={createForm.admissionOpen}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, admissionOpen: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="createAdmissionOpen"
                    className="text-sm font-medium text-slate-700"
                  >
                    Admission Open
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Allowed Classes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["8", "9", "10"].map((cls) => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleCreateClassToggle(cls)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          createForm.allowedClasses.includes(cls)
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        Class {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Security Code
                  </label>
                  <input
                    type="password"
                    value={createForm.securityCode}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, securityCode: e.target.value })
                    }
                    className="input"
                    placeholder="Enter security code"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Create Session
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
