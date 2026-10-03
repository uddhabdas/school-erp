"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admissions", label: "Admissions", icon: UserPlus },
    { href: "/students", label: "Students", icon: Users },
    { href: "/faculty", label: "Faculty", icon: Users },
    { href: "/sessions", label: "Sessions", icon: Calendar },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <img src="/5tlogo.png" alt="5T Logo" className="h-14 w-14 rounded-2xl object-cover border-3 border-white shadow-lg" />
          <div>
            <h1 className="text-xl font-bold">Dulichand Sonadevi</h1>
            <p className="text-sm text-slate-300">
              High School
            </p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-lg ${
                  pathname === item.href
                    ? "bg-emerald-600 shadow-md"
                    : "hover:bg-slate-700/70"
                }`}
              >
                <Icon className="w-6 h-6" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="mb-4">
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-slate-300 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-red-600/30 transition-all text-lg"
          >
            <LogOut className="w-6 h-6" />
            Logout
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
