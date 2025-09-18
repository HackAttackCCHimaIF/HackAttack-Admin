"use client";

import React, { useState, useEffect } from "react";
import {
  SubmissionWithTeam,
  SubmissionStatus,
} from "@/lib/interface/submission";

const AdminSubmissionTable: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubmissionWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("/api/team/submission");
        if (!response.ok) {
          throw new Error("Failed to fetch submissions");
        }
        const result = await response.json();
        setSubmissions(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const getStatusBadge = (status: SubmissionStatus) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case SubmissionStatus.Valid:
        return `${baseClasses} bg-green-100 text-green-800`;
      case SubmissionStatus.Invalid:
        return `${baseClasses} bg-red-100 text-red-800`;
      case SubmissionStatus.Pending:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Team Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Institution
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Proposal
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Members
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted At
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((submission) => (
            <tr key={submission.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {submission.team.teamName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {submission.team.institution}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                <a
                  href={submission.proposalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  View Proposal
                </a>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={getStatusBadge(submission.status)}>
                  {submission.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="space-y-1">
                  {submission.teamMembers.map((member) => (
                    <div key={member.id} className="text-xs">
                      {member.name} ({member.memberRole})
                      <span
                        className={`ml-2 px-1 py-0.5 rounded text-xs ${
                          member.memberApproval === "Accepted"
                            ? "bg-green-100 text-green-800"
                            : member.memberApproval === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {member.memberApproval}
                      </span>
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(submission.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSubmissionTable;
