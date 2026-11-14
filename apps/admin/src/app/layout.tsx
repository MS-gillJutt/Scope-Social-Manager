import type { Metadata } from "next";
import "./globals.css";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

export const metadata: Metadata = {
  title: "Scope Social Manager Super Admin | Platform Control Center",
  description: "Internal operations, tenancy management, queue health, and revenue analytics for Scope Social Manager SaaS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen antialiased flex font-sans">
        {/* Fixed Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col pl-64 min-w-0">
          <AdminHeader />
          <main className="flex-1 pt-16 p-8 min-w-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
