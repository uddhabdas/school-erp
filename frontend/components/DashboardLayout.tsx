"use client";

import { ProtectedRoute } from "./ProtectedRoute";
import { Sidebar } from "./Sidebar";

export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 w-full md:ml-64 p-3.5 sm:p-5 md:p-8 min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </ProtectedRoute>
  );
};
