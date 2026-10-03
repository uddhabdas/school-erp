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
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
};
