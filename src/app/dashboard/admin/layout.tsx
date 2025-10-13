"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../_components/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";

const DashboardAdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { loading, signOut, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex relative bg-black">
      <div className="relative z-10 flex w-full h-full">
        {/* Sidebar */}
        <div className="w-0 md:w-68">
          <AdminSidebar isLoggedIn={isAuthenticated} onSignOut={signOut} />
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 h-full pt-16 md:pt-0 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdminLayout;
