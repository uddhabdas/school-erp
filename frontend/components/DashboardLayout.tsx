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
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row print:min-h-0 print:bg-white print:block">
        <Sidebar />
        <main className="flex-1 w-full md:ml-64 p-3.5 sm:p-5 md:p-8 min-w-0 overflow-x-hidden print:ml-0 print:p-0 print:m-0 print:w-full print:overflow-visible">{children}</main>
      </div>
    </ProtectedRoute>
  );
};
