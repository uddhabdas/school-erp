"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  User,
  Users,
  MapPin,
  FileText,
  CreditCard,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Check
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type Session = {
  _id: string;
  sessionName: string;
  allowedClasses: string[];
  admissionOpen: boolean;
};

// Comprehensive list of school classes
const STANDARD_CLASSES = [
  "Nursery",
  "LKG",
  "UKG",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12"
];

// List of districts in Odisha
const ODISHA_DISTRICTS = [
  "BALASORE",
  "BHADRAK",
  "KENDUJHAR",
  "MAYURBHANJ",
  "ANGUL",
  "DEOGARH",
  "DHENKANAL",
  "CUTTACK",
  "JAGATSINGHPUR",
  "JAJAPUR",
  "KENDRAPARA",
  "NAYAGARH",
  "PURI",
  "KHORDHA",
  "GANJAM",
  "GAJAPATI",
  "KANDHAMAL",
  "BOUDH",
  "SONEPUR",
  "BALANGIR",
  "NUAPADA",
  "BARAGARH",
  "JHARSUGUDA",
  "SAMBALPUR",
  "MALKANGIRI",
  "KORAPUT",
  "NABARANGPUR",
  "RAYAGADA",
  "KALAHANDI",
  "Other"
];

// List of blocks in Balasore
const BALASORE_BLOCKS = [
  "BASTA",
  "BALASORE SADAR",
  "BHANJANAGAR",
  "KHANTA",
  "SORO",
  "SIMULIA",
  "KUPARI",
  "OUPADA",
  "JALESWAR",
  "NHABANGA",
  "REMOUNA",
  "Other"
];

// Offline fallback dictionary for common local Odisha pincodes
const LOCAL_PINCODES: Record<string, { state: string; district: string; block: string; post: string }> = {
  "756029": { state: "ODISHA", district: "BALASORE", block: "BASTA", post: "BASTA" },
  "756001": { state: "ODISHA", district: "BALASORE", block: "BALASORE SADAR", post: "BALASORE" },
  "756002": { state: "ODISHA", district: "BALASORE", block: "BALASORE SADAR", post: "BALASORE COLLEGE" },
  "756003": { state: "ODISHA", district: "BALASORE", block: "REMOUNA", post: "REMOUNA" },
  "756030": { state: "ODISHA", district: "BALASORE", block: "BASTA", post: "AMARDA" },
  "756032": { state: "ODISHA", district: "BALASORE", block: "JALESWAR", post: "JALESWAR" },
  "756040": { state: "ODISHA", district: "BALASORE", block: "BHANJANAGAR", post: "CHANDIPUR" },
  "756055": { state: "ODISHA", district: "BALASORE", block: "SORO", post: "SORO" },
  "756056": { state: "ODISHA", district: "BALASORE", block: "SIMULIA", post: "SIMULIA" },
  "756100": { state: "ODISHA", district: "BHADRAK", block: "BHADRAK", post: "BHADRAK" },
  "751001": { state: "ODISHA", district: "KHORDHA", block: "BHUBANESWAR", post: "BHUBANESWAR GPO" }
};

export default function ApplyAdmission() {
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDistrictOther, setShowDistrictOther] = useState(false);
  const [showBlockOther, setShowBlockOther] = useState(false);

  // Pincode auto-fill states
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeAutoFilled, setPincodeAutoFilled] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [postOfficesList, setPostOfficesList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    class: "",
    previousSchool: "",
    name: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    aadhaar: "",
    mobile: "",
    fatherName: "",
    motherName: "",
    guardian: "",
    parentMobile: "",
    village: "",
    post: "",
    district: "BALASORE",
    block: "BASTA",
    state: "ODISHA",
    pincode: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
  });
  const [files, setFiles] = useState({
    photo: null as File | null,
    aadhaar: null as File | null,
    birthCertificate: null as File | null,
    transferCertificate: null as File | null,
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/sessions/active`
        );
        const data = await res.json();
        setSession(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  // Numeric-only handler for Aadhaar (12 digits)
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 12);
    setFormData(prev => ({ ...prev, aadhaar: numeric }));
  };

  // Numeric-only handler for Student Phone Number (10 digits)
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData(prev => ({ ...prev, mobile: numeric }));
  };

  // Numeric-only handler for Parent's Mobile (10 digits)
  const handleParentMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData(prev => ({ ...prev, parentMobile: numeric }));
  };

  // Pincode lookup & auto-fill
  const lookupPincode = async (pin: string) => {
    if (pin.length !== 6) return;
    setPincodeLoading(true);
    setPincodeError("");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0]?.Status === "Success" &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const offices = data[0].PostOffice;
        setPostOfficesList(offices);
        const first = offices[0];

        const stateName = (first.State || "ODISHA").toUpperCase();
        let districtName = (first.District || "BALASORE").toUpperCase();
        if (districtName === "BALESWAR") districtName = "BALASORE";
        const blockName = (first.Block && first.Block !== "NA" ? first.Block : "BASTA").toUpperCase();
        const primaryPost = (first.Name || "").toUpperCase();

        setFormData(prev => ({
          ...prev,
          state: stateName,
          district: districtName,
          block: blockName,
          post: prev.post ? prev.post : primaryPost,
          village: prev.village ? prev.village : primaryPost,
        }));
        setPincodeAutoFilled(true);
      } else {
        const match = LOCAL_PINCODES[pin];
        if (match) {
          setFormData(prev => ({
            ...prev,
            state: match.state,
            district: match.district,
            block: match.block,
            post: prev.post ? prev.post : match.post,
            village: prev.village ? prev.village : match.post,
          }));
          setPincodeAutoFilled(true);
        } else {
          setPincodeError("Location details not found online. Please fill Post, Block, and District.");
        }
      }
    } catch (err) {
      console.warn("Pincode API lookup error, using local fallback:", err);
      const match = LOCAL_PINCODES[pin];
      if (match) {
        setFormData(prev => ({
          ...prev,
          state: match.state,
          district: match.district,
          block: match.block,
          post: prev.post ? prev.post : match.post,
          village: prev.village ? prev.village : match.post,
        }));
        setPincodeAutoFilled(true);
      }
    } finally {
      setPincodeLoading(false);
    }
  };

  // Numeric-only handler for Pincode (6 digits) with auto-trigger
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData(prev => ({ ...prev, pincode: numeric }));
    if (numeric.length === 6) {
      lookupPincode(numeric);
    } else {
      setPincodeAutoFilled(false);
      setPostOfficesList([]);
      setPincodeError("");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle "Other" selections
    if (name === "district") {
      if (value === "Other") {
        setShowDistrictOther(true);
        setFormData({ ...formData, [name]: "" });
      } else {
        setShowDistrictOther(false);
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === "block") {
      if (value === "Other") {
        setShowBlockOther(true);
        setFormData({ ...formData, [name]: "" });
      } else {
        setShowBlockOther(false);
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value);
      });
      Object.entries(files).forEach(([key, file]) => {
        if (file) formDataToSend.append(key, file);
      });

      const res = await fetch(
        `${API_BASE_URL}/admissions`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (!res.ok) throw new Error("Failed to submit application");
      setSuccess(true);
    } catch (error) {
      alert("Error submitting application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !session.admissionOpen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Admission Closed
          </h2>
          <p className="text-gray-600 mb-6">
            Admissions are currently closed. Please check back later.
          </p>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your admission application has been submitted successfully. Please
            wait for verification.
          </p>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card p-4 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <Link href="/" className="text-blue-600 hover:underline mb-2 sm:mb-4 inline-block text-xs sm:text-sm font-semibold">
              ← Back to Home
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Admission Application
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">Session: {session.sessionName}</p>
          </div>

          <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 sm:h-2 rounded-full ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Academic Details
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Applying For *
                  </label>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    className="input font-semibold text-slate-800"
                    required
                  >
                    <option value="">-- Select Class Applying For --</option>
                    {Array.from(
                      new Set([
                        ...(session.allowedClasses && session.allowedClasses.length > 0 ? session.allowedClasses : []),
                        ...STANDARD_CLASSES,
                      ])
                    ).map((c) => (
                      <option key={c} value={c}>
                        {["Nursery", "LKG", "UKG"].includes(c) || c.toLowerCase().startsWith("class") ? c : `Class ${c}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous School
                  </label>
                  <input
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Previous school name (if applicable)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn btn-primary"
                  disabled={!formData.class}
                >
                  Next
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Student Details
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Group
                    </label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Aadhaar Number
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formData.aadhaar.length}/12 numeric
                      </span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={12}
                      name="aadhaar"
                      placeholder="12-digit numeric Aadhaar"
                      value={formData.aadhaar}
                      onChange={handleAadhaarChange}
                      className="input font-mono tracking-wider"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Mobile Number *
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formData.mobile.length}/10 numeric
                    </span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    name="mobile"
                    placeholder="10-digit phone number"
                    value={formData.mobile}
                    onChange={handleMobileChange}
                    className="input font-mono tracking-wider"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn btn-primary"
                    disabled={!formData.name || !formData.gender || !formData.dob || !formData.mobile}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Parent Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Father's Name *
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mother's Name *
                    </label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guardian (if any)
                    </label>
                    <input
                      type="text"
                      name="guardian"
                      value={formData.guardian}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Parent's Mobile *
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formData.parentMobile.length}/10 numeric
                      </span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      name="parentMobile"
                      placeholder="10-digit mobile number"
                      value={formData.parentMobile}
                      onChange={handleParentMobileChange}
                      className="input font-mono tracking-wider"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="btn btn-primary"
                    disabled={!formData.fatherName || !formData.motherName || !formData.parentMobile}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Address Details
                  </h2>
                  <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Enter 6-digit Pincode to auto-fill address
                  </span>
                </div>

                {/* 1. PINCODE (UPSIDE / FIRST) */}
                <div className="p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-sm font-bold text-slate-900">
                      Pincode * <span className="text-xs font-normal text-slate-500">(Numeric 6 digits)</span>
                    </label>
                    {pincodeLoading && (
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Fetching location details...
                      </span>
                    )}
                    {pincodeAutoFilled && !pincodeLoading && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Location Auto-Filled
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      name="pincode"
                      value={formData.pincode}
                      onChange={handlePincodeChange}
                      placeholder="e.g. 756029"
                      className="input text-base font-mono font-bold tracking-widest text-slate-900 border-blue-300 focus:border-blue-500 bg-white"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                      {formData.pincode.length}/6 digits
                    </span>
                  </div>

                  {pincodeError && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{pincodeError}</span>
                    </div>
                  )}

                  {/* Postal Offices Quick Selection */}
                  {postOfficesList.length > 0 && (
                    <div className="pt-2 border-t border-blue-200/60">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">
                        Post Offices in Pincode {formData.pincode} (click to set Post / Village):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {postOfficesList.map((po, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                post: po.Name.toUpperCase(),
                                village: prev.village || po.Name.toUpperCase()
                              }));
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                              formData.post === po.Name.toUpperCase()
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-white"
                            }`}
                          >
                            {po.Name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. STATE & DISTRICT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="input uppercase font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <select
                      name="district"
                      value={showDistrictOther ? "Other" : formData.district}
                      onChange={handleInputChange}
                      className="input font-semibold"
                      required
                    >
                      {Array.from(
                        new Set([...ODISHA_DISTRICTS, formData.district].filter(Boolean))
                      ).map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    {showDistrictOther && (
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        placeholder="Enter district name"
                        className="input mt-2 uppercase font-semibold"
                        required
                      />
                    )}
                  </div>
                </div>

                {/* 3. BLOCK & POST */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block *
                    </label>
                    <select
                      name="block"
                      value={showBlockOther ? "Other" : formData.block}
                      onChange={handleInputChange}
                      className="input font-semibold"
                      required
                    >
                      {Array.from(
                        new Set([...BALASORE_BLOCKS, formData.block].filter(Boolean))
                      ).map((block) => (
                        <option key={block} value={block}>
                          {block}
                        </option>
                      ))}
                    </select>
                    {showBlockOther && (
                      <input
                        type="text"
                        name="block"
                        value={formData.block}
                        onChange={handleInputChange}
                        placeholder="Enter block name"
                        className="input mt-2 uppercase font-semibold"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Post *
                    </label>
                    <input
                      type="text"
                      name="post"
                      placeholder="e.g. BASTA"
                      value={formData.post}
                      onChange={handleInputChange}
                      className="input uppercase font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* 4. VILLAGE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Village / Locality / Street Address *
                  </label>
                  <input
                    type="text"
                    name="village"
                    placeholder="Enter village or residential address"
                    value={formData.village}
                    onChange={handleInputChange}
                    className="input uppercase font-semibold"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="btn btn-primary"
                    disabled={!formData.village || !formData.post || !formData.district || !formData.block || !formData.state || !formData.pincode}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upload Documents
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passport Size Photo
                  </label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhaar Card
                  </label>
                  <input
                    type="file"
                    name="aadhaar"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Certificate
                  </label>
                  <input
                    type="file"
                    name="birthCertificate"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer Certificate
                  </label>
                  <input
                    type="file"
                    name="transferCertificate"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="input"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="btn btn-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Bank Account Details (Optional)
                </h2>
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  For receiving government benefits, scholarship money, bicycle scheme, etc.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="accountNumber"
                      placeholder="Account number (numeric only)"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          accountNumber: e.target.value.replace(/\D/g, "")
                        }))
                      }
                      className="input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      placeholder="e.g. SBIN0001234"
                      value={formData.ifscCode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ifscCode: e.target.value.toUpperCase()
                        }))
                      }
                      className="input uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(7)}
                    className="btn btn-primary"
                  >
                    Preview
                  </button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Preview & Submit
                </h2>
                
                {/* Academic Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-blue-800 font-bold mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" /> Academic Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><strong>Session:</strong> {session.sessionName}</p>
                      <p><strong>Class:</strong> {formData.class}</p>
                      <p><strong>Previous School:</strong> {formData.previousSchool || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Student Info */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" /> Student Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {formData.name}</p>
                      <p><strong>Gender:</strong> {formData.gender}</p>
                      <p><strong>Date of Birth:</strong> {formData.dob}</p>
                      <p><strong>Blood Group:</strong> {formData.bloodGroup || "-"}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Aadhaar Number:</strong> {formData.aadhaar || "-"}</p>
                      <p><strong>Mobile:</strong> {formData.mobile}</p>
                    </div>
                  </div>
                </div>

                {/* Parent Info */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-100">
                  <h3 className="text-yellow-800 font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" /> Parent Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><strong>Father's Name:</strong> {formData.fatherName}</p>
                      <p><strong>Mother's Name:</strong> {formData.motherName}</p>
                      <p><strong>Guardian:</strong> {formData.guardian || "-"}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>Parent's Mobile:</strong> {formData.parentMobile}</p>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <h3 className="text-purple-800 font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Address Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><strong>Village:</strong> {formData.village}</p>
                      <p><strong>Post:</strong> {formData.post}</p>
                      <p><strong>Block:</strong> {formData.block}</p>
                    </div>
                    <div className="space-y-2">
                      <p><strong>District:</strong> {formData.district}</p>
                      <p><strong>State:</strong> {formData.state}</p>
                      <p><strong>Pincode:</strong> {formData.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Documents Info */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Documents Uploaded
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><strong>Photo:</strong> {files.photo ? "Uploaded" : "Not Uploaded"}</p>
                      <p><strong>Aadhaar Card:</strong> {files.aadhaar ? "Uploaded" : "Not Uploaded"}</p>
                      <p><strong>Birth Certificate:</strong> {files.birthCertificate ? "Uploaded" : "Not Uploaded"}</p>
                      <p><strong>Transfer Certificate:</strong> {files.transferCertificate ? "Uploaded" : "Not Uploaded"}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                {(formData.accountHolderName || formData.accountNumber || formData.bankName) && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                    <h3 className="text-indigo-800 font-bold mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5" /> Bank Account Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p><strong>Account Holder:</strong> {formData.accountHolderName || "-"}</p>
                        <p><strong>Account Number:</strong> {formData.accountNumber || "-"}</p>
                        <p><strong>Bank Name:</strong> {formData.bankName || "-"}</p>
                      </div>
                      <div className="space-y-2">
                        <p><strong>IFSC Code:</strong> {formData.ifscCode || "-"}</p>
                        <p><strong>Branch Name:</strong> {formData.branchName || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(6)}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
