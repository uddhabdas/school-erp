"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from "@/lib/api";

export interface StudentChild {
  _id: string;
  studentId: string;
  admissionNo: string;
  status: string;
  personal: {
    name: string;
    gender: string;
    dob: string;
    bloodGroup?: string;
    aadhaar?: string;
    mobile?: string;
    photo?: string;
  };
  academic: {
    sessionId: string;
    sessionName: string;
    class: string;
    rollNo: number;
  };
  parents?: {
    fatherName?: string;
    motherName?: string;
    guardian?: string;
    parentMobile?: string;
  };
  address?: {
    village?: string;
    post?: string;
    block?: string;
    district?: string;
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
  documents?: {
    photo?: string;
    aadhaar?: string;
    birthCertificate?: string;
    transferCertificate?: string;
  };
}

export interface ParentProfile {
  mobile: string;
  fatherName: string;
  motherName: string;
  children: StudentChild[];
}

interface ParentAuthContextType {
  parent: ParentProfile | null;
  childrenList: StudentChild[];
  selectedChild: StudentChild | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  selectChild: (childId: string) => void;
  loading: boolean;
}

const ParentAuthContext = createContext<ParentAuthContextType | null>(null);

export function ParentAuthProvider({ children }: { children: ReactNode }) {
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [childrenList, setChildrenList] = useState<StudentChild[]>([]);
  const [selectedChild, setSelectedChild] = useState<StudentChild | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initParentAuth = async () => {
      const storedToken = localStorage.getItem("parentToken");
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await fetch(`${API_BASE_URL}/parent-auth/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (res.ok) {
            const data: ParentProfile = await res.json();
            setParent(data);
            setChildrenList(data.children || []);
            if (data.children && data.children.length > 0) {
              setSelectedChild(data.children[0]);
            }
          } else if (res.status === 401) {
            localStorage.removeItem("parentToken");
            setToken(null);
            setParent(null);
          }
        } catch (err) {
          console.error("Parent auth initialization error:", err);
        }
      }
      setLoading(false);
    };

    initParentAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/parent-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
    } catch (e: any) {
      throw new Error(`Unable to connect to backend service at ${API_BASE_URL}`);
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response format from server");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Invalid parent credentials");
    }

    localStorage.setItem("parentToken", data.token);
    setToken(data.token);
    setParent(data.parent);
    setChildrenList(data.parent.children || []);
    if (data.parent.children && data.parent.children.length > 0) {
      setSelectedChild(data.parent.children[0]);
    }
  };

  const logout = () => {
    localStorage.removeItem("parentToken");
    setToken(null);
    setParent(null);
    setChildrenList([]);
    setSelectedChild(null);
  };

  const selectChild = (childId: string) => {
    const found = childrenList.find((c) => c._id === childId || c.studentId === childId);
    if (found) {
      setSelectedChild(found);
    }
  };

  return (
    <ParentAuthContext.Provider
      value={{
        parent,
        childrenList,
        selectedChild,
        token,
        login,
        logout,
        selectChild,
        loading,
      }}
    >
      {children}
    </ParentAuthContext.Provider>
  );
}

export const useParentAuth = () => {
  const context = useContext(ParentAuthContext);
  if (!context) {
    throw new Error("useParentAuth must be used within a ParentAuthProvider");
  }
  return context;
};
