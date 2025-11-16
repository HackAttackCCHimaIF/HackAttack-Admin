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
import { Search, Filter, ChevronDown, File } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { TeamMember } from "@/lib/interface/teammember";
import { exportToExcel, formatDateForExcel } from "@/lib/utils/excelExport";
import { HoverableStatus } from "@/components/ui/hoverable-status";

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
  proposal_url?: string;
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
  proposal_url?: string;
  submissionStatus?: string;
}

export default function AdminSubmissionTable() {
  const [search, setSearch] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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
            proposal_url: team.proposal_url,
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

  const handleSelectAll = () => {
    setFilterSubmitted(true);
    setFilterNotSubmitted(true);
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

  const handleExportToExcel = async () => {
    try {
      const exportData = filteredData.map((participant, index) => ({
        No: index + 1,
        "Team Name": participant.team,
        Institution: participant.institution,
        "Members Count": participant.members,
        "Submission Status": participant.status,
        "Submission Date": participant.date
          ? formatDateForExcel(participant.date)
          : "-",
        "Team Leader":
          participant.teamMembers?.find((m) => m.isLeader === true)?.name ||
          "-",
        "Team Leader Email":
          participant.teamMembers?.find((m) => m.isLeader === true)?.email ||
          "-",
        "Team Members":
          participant.teamMembers
            ?.filter((m) => m.isLeader === false)
            .map((m) => m.name)
            .join(", ") || "-",
        "Submission URL": participant.proposal_url || "-",
      }));

      const filename = `Team_Submissions_${
        new Date().toISOString().split("T")[0]
      }`;
      await exportToExcel(exportData, filename, "Team Submissions");
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="rounded-[20px] p-[2px] bg-gradient-to-r from-[#0F75BD] to-[#64BB48] h-full">
      <div className="bg-gradient-to-t from-black to-[#575757] rounded-[18px] p-6 text-white h-full flex flex-col">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Submission Progress</h2>
            <p className="text-sm text-gray-300">
              Overview of Team Submission Progress
            </p>
          </div>
          <div>
            <Button
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={handleExportToExcel}
            >
              <File className="h-4 w-4 mr-2" />
              Download by Excel (.xlsx)
            </Button>
          </div>
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
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                      open ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                <div className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="submitted"
                        checked={filterSubmitted}
                        onCheckedChange={(checked) =>
                          setFilterSubmitted(checked as boolean)
                        }
                        className="border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <label
                        htmlFor="submitted"
                        className="text-sm font-medium text-white cursor-pointer"
                      >
                        Submitted
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="not-submitted"
                        checked={filterNotSubmitted}
                        onCheckedChange={(checked) =>
                          setFilterNotSubmitted(checked as boolean)
                        }
                        className="border-gray-400 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                      <label
                        htmlFor="not-submitted"
                        className="text-sm font-medium text-white cursor-pointer"
                      >
                        Not Submitted
                      </label>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-700 my-3" />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSelectAll}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Select All
                    </Button>
                  </div>
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
                <TableHead className="text-white">Submission</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Submission Date</TableHead>
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
                    {row.proposal_url != null ? (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              type="button"
                              size={"sm"}
                              className="bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white"
                              onClick={() =>
                                window.open(row.proposal_url, "_blank")
                              }
                            >
                              View Proposal
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="max-w-xs text-sm"
                          >
                            <p>{row.proposal_url}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <p className="text-xs text-white/70">Not Submitted Yet</p>
                    )}
                  </TableCell>

                  <TableCell className="py-4 px-6">
                    <HoverableStatus
                      status={row.status}
                      entityId={row.submissionId || row.id}
                      entityType="submission"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {" "}
                    {new Date(row.date).toLocaleDateString("en-GB")}
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
