import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { StudentAuthProvider } from "@/context/StudentAuthContext";
import { ParentAuthProvider } from "@/context/ParentAuthContext";

export const metadata: Metadata = {
  title: "School ERP - Dulichand Sonadevi High School",
  description: "School Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StudentAuthProvider>
            <ParentAuthProvider>{children}</ParentAuthProvider>
          </StudentAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
