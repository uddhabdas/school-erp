"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE_URL } from "@/lib/api";

type User = {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: "super_admin" | "admin" | "faculty";
  employeeId?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (res.status === 401) {
            // Stale or invalid token
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
          } else if (res.ok) {
            const freshUser = await res.json();
            setUser(freshUser);
            localStorage.setItem("user", JSON.stringify(freshUser));
          }
        } catch (e) {
          // If network error, preserve cached state
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch (err: any) {
      throw new Error(`Unable to connect to backend server at ${API_BASE_URL}. Ensure backend is running.`);
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Server returned unexpected response (${res.status}). Please check backend service.`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    setToken(data.token);
    setUser(data);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
