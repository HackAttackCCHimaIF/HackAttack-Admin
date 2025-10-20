"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Circle, Clock, User } from "lucide-react";
import { AdminActionHistory } from "@/lib/interface/history";

interface HoverableStatusProps {
  status: string;
  entityId: string;
  entityType: "workshop" | "team" | "member" | "submission";
}

const getStatusBadge = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("waiting")
  ) {
    return (
      <Badge className="bg-orange-50 rounded-full text-orange-400 font-semibold py-2">
        <Circle className="!w-3 !h-3 fill-current text-orange-400 mr-1" />
        Pending
      </Badge>
    );
  }

  if (
    normalizedStatus.includes("approved") ||
    normalizedStatus.includes("accepted") ||
    normalizedStatus.includes("valid")
  ) {
    return (
      <Badge className="bg-green-500 rounded-full text-lime-200 font-semibold py-2">
        <Circle className="!w-3 !h-3 fill-current text-lime-200 mr-1" />
        Approved
      </Badge>
    );
  }

  if (
    normalizedStatus.includes("rejected") ||
    normalizedStatus.includes("invalid")
  ) {
    return (
      <Badge className="bg-red-600 rounded-full text-red-200 font-semibold py-2">
        <Circle className="!w-3 !h-3 fill-current text-red-200 mr-1" />
        Rejected
      </Badge>
    );
  }

  // Default case
  return (
    <Badge className="bg-gray-500 rounded-full text-gray-200 font-semibold py-2">
      <Circle className="!w-3 !h-3 fill-current text-gray-200 mr-1" />
      {status}
    </Badge>
  );
};

export function HoverableStatus({ status, entityId }: HoverableStatusProps) {
  const [history, setHistory] = useState<AdminActionHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/history/${entityId}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer" onMouseEnter={fetchHistory}>
          {getStatusBadge(status)}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-black/90 border-white/20 text-white">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Status History</h4>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="text-xs border-l-2 border-white/20 pl-3 py-1"
                >
                  <div className="flex items-center gap-2 text-white/80">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{entry.adminEmail}</span>
                  </div>
                  <div className="text-white/60">
                    {entry.oldStatus} → {entry.newStatus}
                  </div>
                  <div className="text-white/40">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400">No history available</div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
