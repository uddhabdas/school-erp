"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from "@/lib/api";

interface Student {
  _id: string;
  studentId: string;
  admissionNo: string;
  name: string;
  personal: any;
  academic: any;
  parents?: any;
  address?: any;
  documents?: any;
  bankDetails?: any;
}

interface StudentAuthContextType {
  student: Student | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const StudentAuthContext = createContext<StudentAuthContextType | null>(null);

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    if (token) {
      const fetchStudent = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/student-auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
            setStudent(data);
        }
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
    };
    fetchStudent();
  } else {
    setLoading(false);
  }
  }, []);

  const login = async (identifier: string, password: string) => {
    return fetch(`${API_BASE_URL}/student-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    }).then(async res => {
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Unable to reach backend service");
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credentials");
      return data;
    }).then(data => {
      localStorage.setItem("studentToken", data.token);
      setStudent(data.student);
    });
  }

  const logout = () => {
    localStorage.removeItem("studentToken");
    setStudent(null);
  };

  return (
    <StudentAuthContext.Provider value={{ student, login, logout, loading }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export const useStudentAuth = () => {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error("useStudentAuth must be used within a StudentAuthProvider");
  }
  return context;
};
