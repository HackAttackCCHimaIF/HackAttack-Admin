"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Eye,
  Circle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SubmissionStatus } from "@/lib/interface/submission";
import { toast } from "sonner";
import { TeamMember } from "@/lib/interface/teammember";

type Status = "Submitted" | "Not Submitted";

interface TeamWithSubmissionStatus {
  id: string;
  createdBy: string;
  teamName: string;
  institution: string;
  whatsappNumber: number;
  paymentProofUrl: string;
  createdAt: string;
  updatedAt: string;
  approvalStatus: string;
  rejectMessage: string;
  teamMembers: TeamMember[];
  hasSubmission: boolean;
  submissionId?: string;
  submissionStatus?: string;
  submissionDate?: string;
}

interface Participant {
  id: string;
  team: string;
  institution: string;
  members: number;
  status: Status;
  date: string;
  teamMembers: TeamMember[];
  submissionId?: string;
  submissionStatus?: string;
}

const getStatusBadge = (status: Status) => {
  switch (status) {
    case "Submitted":
      return (
        <Badge className="bg-green-500 rounded-full text-white font-semibold py-2">
          <Circle className="!w-2 !h-2 mr-1 fill-current" />
          Submitted
        </Badge>
      );
    case "Not Submitted":
      return (
        <Badge className="bg-red-600 rounded-full text-white font-semibold py-2">
          <Circle className="!w-2 !h-2 mr-1 fill-current" />
          Not Submitted
        </Badge>
      );
  }
};

export default function AdminSubmissionTable() {
  const [search, setSearch] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // filter states
  const [filterSubmitted, setFilterSubmitted] = useState(false);
  const [filterNotSubmitted, setFilterNotSubmitted] = useState(false);

  useEffect(() => {
    const fetchTeamsWithSubmissions = async () => {
      try {
        const response = await fetch("/api/team/submission");
        if (!response.ok) {
          throw new Error("Failed to fetch teams with submissions");
        }
        const result = await response.json();

        // Convert TeamWithSubmissionStatus to Participant format
        const participantsData: Participant[] = result.data.map(
          (team: TeamWithSubmissionStatus) => ({
            id: team.id,
            team: team.teamName,
            institution: team.institution,
            members: team.teamMembers.length,
            status: team.hasSubmission ? "Submitted" : "Not Submitted",
            date: new Date(team.createdAt).toLocaleDateString(),
            teamMembers: team.teamMembers,
            submissionId: team.submissionId,
            submissionStatus: team.submissionStatus,
          })
        );

        setParticipants(participantsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        toast.error("Failed to fetch teams with submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamsWithSubmissions();
  }, []);

  const handleSubmissionApproval = async (
    submissionId: string,
    status: SubmissionStatus
  ) => {
    if (!submissionId) {
      toast.error("No submission found for this team");
      return;
    }

    setActionLoading(submissionId);
    try {
      const response = await fetch("/api/team/submission/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update submission status");
      }

      setParticipants((prev) =>
        prev.map((participant) =>
          participant.submissionId === submissionId
            ? { ...participant, submissionStatus: status }
            : participant
        )
      );

      toast.success(`Submission ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("Error updating submission status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update submission status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectAll = () => {
    setFilterSubmitted(true);
    setFilterNotSubmitted(true);
  };

  const handleApply = () => {
    // hanya trigger re-render, logiknya ada di filteredData
  };

  const filteredData = participants.filter((item) => {
    const matchesSearch =
      item.team?.toLowerCase().includes(search.toLowerCase()) ?? false;

    const matchesFilter =
      (filterSubmitted && item.status === "Submitted") ||
      (filterNotSubmitted && item.status === "Not Submitted") ||
      (!filterSubmitted && !filterNotSubmitted); // jika filter belum dipilih, tampilkan semua

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="rounded-[20px] p-[2px] bg-gradient-to-r from-[#0F75BD] to-[#64BB48] h-full">
        <div className="bg-gradient-to-t from-black to-[#575757] rounded-[18px] p-6 text-white h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] p-[2px] bg-gradient-to-r from-[#0F75BD] to-[#64BB48] h-full">
        <div className="bg-gradient-to-t from-black to-[#575757] rounded-[18px] p-6 text-white h-full flex items-center justify-center">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] p-[2px] bg-gradient-to-r from-[#0F75BD] to-[#64BB48] h-full">
      <div className="bg-gradient-to-t from-black to-[#575757] rounded-[18px] p-6 text-white h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">Registration Progress</h2>
          <p className="text-sm text-gray-300">
            Overview of Participant Registration Progress
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/10 border border-white text-white placeholder:text-gray-400"
            />
          </div>

          <div className="inline-flex w-52">
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 bg-white text-black w-full"
                >
                  <Filter className="h-4 w-4 text-[#5B5B5B]" />
                  Filter By
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                      open ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="p-2 w-52">
                {/* Checkbox Submitted */}
                <div
                  className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
                  onClick={() => setFilterSubmitted(!filterSubmitted)}
                >
                  <Checkbox
                    checked={filterSubmitted}
                    onCheckedChange={(checked) =>
                      setFilterSubmitted(checked === true)
                    }
                  />
                  <span className="text-sm">Submitted</span>
                </div>

                {/* Checkbox Not Submitted */}
                <div
                  className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-100"
                  onClick={() => setFilterNotSubmitted(!filterNotSubmitted)}
                >
                  <Checkbox
                    checked={filterNotSubmitted}
                    onCheckedChange={(checked) =>
                      setFilterNotSubmitted(checked === true)
                    }
                  />
                  <span className="text-sm">Not Submitted</span>
                </div>

                <DropdownMenuSeparator />

                {/* Action links */}
                <div className="flex items-center justify-between px-2 py-1">
                  <button
                    onClick={handleSelectAll}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={handleApply}
                    className="text-blue-600 text-sm hover:underline font-medium"
                  >
                    Apply
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border-none overflow-hidden flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white">Team Name</TableHead>
                <TableHead className="text-white">Institution</TableHead>
                <TableHead className="text-white">Members</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Registration Date</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className={`border-white/10 ${
                    idx % 2 === 0 ? "bg-white/20" : ""
                  }`}
                >
                  <TableCell className="py-4 px-6">{row.team}</TableCell>
                  <TableCell className="py-4 px-6">{row.institution}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 bg-white/10 border-white/20 text-white"
                        >
                          <Eye className="h-4 w-4" /> Details ({row.members})
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="!max-w-3xl lg:!max-w-5xl !w-full rounded-2xl backdrop-blur-lg bg-gradient-to-b from-white/50 to-black/50 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">
                            Team Members : {row.team}
                          </DialogTitle>
                        </DialogHeader>

                        {/* List anggota tim */}
                        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                          {row.teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="bg-white/20 backdrop-blur-lg rounded-lg p-4 shadow-md flex flex-col gap-3"
                            >
                              {/* Nama & Role */}
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg ">
                                  {member.name}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    member.isLeader
                                      ? "bg-black text-white"
                                      : "bg-gray-700 text-gray-200"
                                  }`}
                                >
                                  {member.isLeader ? "Team Leader" : "Member"}
                                </span>
                              </div>

                              {/* Documents Status */}
                              <div className="flex items-center justify-between bg-white/10 rounded-md px-4 py-2">
                                <span className="text-sm font-medium">
                                  Documents
                                </span>
                                <Badge
                                  className={`rounded-full px-3 py-1 ${
                                    member.memberApproval === "Accepted"
                                      ? "bg-green-600 text-white"
                                      : member.memberApproval === "Rejected"
                                      ? "bg-red-600 text-white"
                                      : "bg-yellow-600 text-white"
                                  }`}
                                >
                                  {member.memberApproval === "Accepted"
                                    ? "All Completed"
                                    : member.memberApproval === "Rejected"
                                    ? "Rejected"
                                    : "Pending"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    {getStatusBadge(row.status)}
                  </TableCell>
                  <TableCell className="py-4 px-6">{row.date}</TableCell>
                  <TableCell className="py-4 px-6">
                    {row.submissionStatus === SubmissionStatus.Pending ? (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          onClick={() =>
                            handleSubmissionApproval(
                              row.id,
                              SubmissionStatus.Valid
                            )
                          }
                          disabled={actionLoading === row.id}
                        >
                          {actionLoading === row.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Valid"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          onClick={() =>
                            handleSubmissionApproval(
                              row.id,
                              SubmissionStatus.Invalid
                            )
                          }
                          disabled={actionLoading === row.id}
                        >
                          {actionLoading === row.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Invalid"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          disabled={true}
                        >
                          Valid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          disabled={true}
                        >
                          Invalid
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
