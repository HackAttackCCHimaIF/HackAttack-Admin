"use client";

import React, { useEffect, useState } from "react";
import { Users, FileClock, ShieldCheck, XCircle } from "lucide-react";
import { TeamStats } from "@/lib/types/team";
import { toast } from "sonner";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCard = ({ title, value, icon, loading = false }: StatCardProps) => {
  return (
    <div className="relative rounded-bl-4xl rounded-tr-4xl p-[2px] bg-gradient-to-r min-h-[160px] from-[#0F75BD] to-[#64BB48]">
      <div className="bg-[#575757] rounded-bl-4xl rounded-tr-4xl p-5 flex items-center justify-between h-full text-white">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xl font-bold">
            {loading ? (
              <div className="w-8 h-6 bg-gray-600 animate-pulse rounded"></div>
            ) : (
              value
            )}
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0F75BD] to-[#64BB48] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = ({ children }: { children: React.ReactNode }) => {
  const [stats, setStats] = useState<TeamStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/team/stats");
        const data = await response.json();
        if (data.success && data.data) {
          setStats(data.data);
        } else {
          toast.error(data.error || "Failed to load team statistics");
        }
      } catch (error) {
        console.error("Error loading stats:", error);
        toast.error("Failed to load team statistics");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="w-full h-full p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tim"
          value={stats.total}
          icon={<Users className="text-white w-6 h-6" />}
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<FileClock className="text-white w-6 h-6" />}
          loading={loading}
        />
        <StatCard
          title="Accepted"
          value={stats.accepted}
          icon={<ShieldCheck className="text-white w-6 h-6" />}
          loading={loading}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={<XCircle className="text-white w-6 h-6" />}
          loading={loading}
        />
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
};

export default AdminDashboard;
