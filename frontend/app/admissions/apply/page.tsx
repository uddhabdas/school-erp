"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, User, Users, MapPin, FileText, CreditCard } from "lucide-react";

type Session = {
  _id: string;
  sessionName: string;
  allowedClasses: string[];
  admissionOpen: boolean;
};

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
  "KENDRApara",
  "NAYAGARH",
  "PURI",
  "KHAORDHA",
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
  "DEOGARH",
  "BAUDH",
  "MALKANGIRI",
  "KORAPUT",
  "NABARANGPUR",
  "RAYAGADA",
  "KALAHANDI",
  "NUAPADA",
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

export default function ApplyAdmission() {
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDistrictOther, setShowDistrictOther] = useState(false);
  const [showBlockOther, setShowBlockOther] = useState(false);
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
          `${process.env.NEXT_PUBLIC_API_URL}/sessions/active`
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
        `${process.env.NEXT_PUBLIC_API_URL}/admissions`,
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <div className="mb-8">
            <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Admission Application
            </h1>
            <p className="text-gray-600">Session: {session.sessionName}</p>
          </div>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
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
                    className="input"
                    required
                  >
                    <option value="">Select Class</option>
                    {session.allowedClasses.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      name="aadhaar"
                      value={formData.aadhaar}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="input"
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent's Mobile *
                    </label>
                    <input
                      type="tel"
                      name="parentMobile"
                      value={formData.parentMobile}
                      onChange={handleInputChange}
                      className="input"
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
                <h2 className="text-lg font-semibold text-gray-900">
                  Address Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Village *
                    </label>
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Post *
                    </label>
                    <input
                      type="text"
                      name="post"
                      value={formData.post}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <select
                      name="district"
                      value={showDistrictOther ? "Other" : formData.district}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      {ODISHA_DISTRICTS.map((district) => (
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
                        className="input mt-2"
                        required
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block *
                    </label>
                    <select
                      name="block"
                      value={showBlockOther ? "Other" : formData.block}
                      onChange={handleInputChange}
                      className="input"
                      required
                    >
                      {BALASORE_BLOCKS.map((block) => (
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
                        className="input mt-2"
                        required
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="input"
                      required
                    />
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
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
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      className="input"
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
