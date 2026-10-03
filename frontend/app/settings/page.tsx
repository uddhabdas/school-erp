"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Settings, Shield, Building2, MapPin, KeyRound, CheckCircle2, AlertCircle, Save } from "lucide-react";

type SchoolSettings = {
  schoolName: string;
  address: string;
};

export default function SettingsPage() {
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingSecurityCode, setChangingSecurityCode] = useState(false);

  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");

  const [currentCode, setCurrentCode] = useState("");
  const [newSecurityCode, setNewSecurityCode] = useState("");
  const [confirmNewCode, setConfirmNewCode] = useState("");

  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [securityError, setSecurityError] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/settings`);
      const data = await res.json();
      if (data) {
        setSchoolName(data.schoolName || "");
        setAddress(data.address || "");
      }
    } catch (err: any) {
      console.error(err);
      setSettingsError("Failed to load school settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError("");
    setSettingsSuccess("");
    setSavingSettings(true);

    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schoolName, address }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update settings");

      setSettingsSuccess("School information updated successfully!");
    } catch (err: any) {
      setSettingsError(err.message || "Failed to update school settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangeSecurityCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError("");
    setSecuritySuccess("");

    if (newSecurityCode !== confirmNewCode) {
      setSecurityError("New security code and confirmation code do not match");
      return;
    }

    if (newSecurityCode.length < 4) {
      setSecurityError("Security code should be at least 4 characters");
      return;
    }

    setChangingSecurityCode(true);

    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentCode,
          securityCode: newSecurityCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update security code");

      setSecuritySuccess("Super Admin security code updated successfully!");
      setCurrentCode("");
      setNewSecurityCode("");
      setConfirmNewCode("");
    } catch (err: any) {
      setSecurityError(err.message || "Failed to update security code");
    } finally {
      setChangingSecurityCode(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="card p-12 text-center max-w-lg mx-auto mt-12">
          <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-600 text-sm">
            Only the Super Admin (Principal) has access to modify global school settings and security credentials.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">School & Security Settings</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure school profile, institutional information, and master security codes
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* General Settings Card */}
            <div className="card p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Institution Profile</h2>
                  <p className="text-xs text-slate-500">School name and official communication address</p>
                </div>
              </div>

              {settingsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}
              {settingsSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    School Name
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="input w-full font-bold"
                    placeholder="Dulichand Sonadevi High School"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    School Address / Location
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input w-full"
                    placeholder="Ranamunduli, Basta, Balasore"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6"
                  >
                    <Save className="w-4 h-4" />
                    {savingSettings ? "Saving Profile..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Code Card */}
            <div className="card p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Master Security Code</h2>
                  <p className="text-xs text-slate-500">
                    Required for creating/closing academic sessions and deleting critical records
                  </p>
                </div>
              </div>

              {securityError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{securityError}</span>
                </div>
              )}
              {securitySuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{securitySuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangeSecurityCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Current Security Code *
                  </label>
                  <input
                    type="password"
                    required
                    value={currentCode}
                    onChange={(e) => setCurrentCode(e.target.value)}
                    className="input w-full"
                    placeholder="Enter current security code (default: admin123)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      New Security Code *
                    </label>
                    <input
                      type="password"
                      required
                      value={newSecurityCode}
                      onChange={(e) => setNewSecurityCode(e.target.value)}
                      className="input w-full"
                      placeholder="Enter new security code"
                      minLength={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Confirm New Security Code *
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmNewCode}
                      onChange={(e) => setConfirmNewCode(e.target.value)}
                      className="input w-full"
                      placeholder="Repeat new security code"
                      minLength={4}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingSecurityCode || !currentCode || !newSecurityCode}
                    className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-6"
                  >
                    <KeyRound className="w-4 h-4" />
                    {changingSecurityCode ? "Updating Code..." : "Update Security Code"}
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
