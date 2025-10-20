"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AdminActionHistory } from "@/lib/interface/history";
import { formatDistanceToNow } from "date-fns";

interface StatusWithHistoryProps {
  status: string;
  entityId: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function StatusWithHistory({
  status,
  entityId,
  variant = "default",
}: StatusWithHistoryProps) {
  const [history, setHistory] = useState<AdminActionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fetchHistory = async () => {
    if (history.length > 0) return; // Already fetched

    setIsLoading(true);
    try {
      const response = await fetch(`/api/history/${entityId}`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    fetchHistory();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "valid":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
      case "invalid":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Badge
        variant={variant}
        className={`cursor-pointer ${getStatusColor(status)}`}
      >
        {status}
      </Badge>

      {isHovered && (
        <div className="absolute z-50 w-80 p-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="text-sm font-medium text-gray-900 mb-2">
            Status History
          </div>

          {isLoading ? (
            <div className="text-sm text-gray-500">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-gray-500">No history available</div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="text-xs border-b border-gray-100 pb-2 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-700">
                        {item.adminEmail}
                      </span>
                      <span className="text-gray-500 ml-1">
                        changed from{" "}
                        <span className="font-medium">{item.oldStatus}</span> to{" "}
                        <span className="font-medium">{item.newStatus}</span>
                        <br />
                        <span className="font-medium">{item.createdAt}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
