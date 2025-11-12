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
import { Search, Filter, Eye, XCircle, CheckCircle, File } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TeamWithDetails, TeamApproval } from "@/lib/interface/team";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { exportToExcel, formatDateForExcel } from "@/lib/utils/excelExport";
import { HoverableStatus } from "@/components/ui/hoverable-status";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { GithubLogo } from "phosphor-react";

const mapApiStatusToComponentStatus = (apiStatus: TeamApproval): Status => {
  switch (apiStatus) {
    case TeamApproval.Pending:
      return "Pending";
    case TeamApproval.Accepted:
      return "Approve";
    case TeamApproval.Rejected:
      return "Rejected";
    case TeamApproval.Submitted:
      return "Submitted";
    case TeamApproval.Resubmitted:
      return "Resubmitted";
    default:
      return "Pending";
  }
};

type Status = "Pending" | "Approve" | "Rejected" | "Submitted" | "Resubmitted";

interface Participant {
  id: string;
  team: string;
  institution: string;
  members: number;
  status: Status;
  paymentproof_url: string;
  date: string;
  reason?: string;
  teamData?: TeamWithDetails;
}

export default function RegistrationTable() {
  const [search, setSearch] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    index: number;
    action: "Approve" | "Reject" | null;
  }>({ index: -1, action: null });
  const [showSuccess, setShowSuccess] = useState(false);
  const [, setTeamApprovalLoading] = useState<string | null>(null);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [filterPending, setFilterPending] = useState(false);
  const [filterAccepted, setFilterAccepted] = useState(false);
  const [filterRejected, setFilterRejected] = useState(false);
  const [filterSubmitted, setFilterSubmitted] = useState(false);
  const [filterResubmitted, setFilterResubmitted] = useState(false);

  const handleSelectAll = () => {
    setFilterPending(true);
    setFilterAccepted(true);
    setFilterRejected(true);
    setFilterSubmitted(true);
    setFilterResubmitted(true);
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/team/registration");
        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }
        const result = await response.json();

        const transformedData: Participant[] = result.data.map(
          (team: TeamWithDetails) => ({
            id: team.id,
            team: team.teamName,
            institution: team.institution,
            members: team.memberCount,
            status: mapApiStatusToComponentStatus(team.approvalStatus),
            paymentproof_url: team.paymentproof_url,
            date: team.createdAt,
            teamData: team,
          })
        );

        setParticipants(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleTeamApproval = async (
    teamId: string,
    approval: TeamApproval,
    rejectMessage?: string
  ) => {
    setTeamApprovalLoading(teamId);

    try {
      const response = await fetch("/api/team/approval", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
          approval,
          rejectMessage: rejectMessage || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update team approval");
      }

      setParticipants((prevParticipants) =>
        prevParticipants.map((participant) =>
          participant.id === teamId
            ? {
                ...participant,
                status: mapApiStatusToComponentStatus(approval),
                reason: rejectMessage || undefined,
                teamData: participant.teamData
                  ? {
                      ...participant.teamData,
                      approvalStatus: approval,
                      rejectMessage: rejectMessage || "",
                    }
                  : participant.teamData,
              }
            : participant
        )
      );

      toast.success(`Team ${approval.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Error updating team approval:", error);
      toast.error(
        `Failed to update team approval: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setTeamApprovalLoading(null);
    }
  };

  const handleTeamApprove = () => {
    if (selected.index !== -1) {
      const participant = participants[selected.index];
      handleTeamApproval(participant.id, TeamApproval.Accepted);
      setSelected({ index: -1, action: null });
    }
  };

  const handleTeamReject = () => {
    setShowReason(true);
  };

  const handleTeamSubmitReason = () => {
    if (selected.index !== -1 && reason.trim()) {
      const participant = participants[selected.index];
      handleTeamApproval(participant.id, TeamApproval.Rejected, reason);
      setShowReason(false);
      setReason("");
      setSelected({ index: -1, action: null });
    }
  };

  const filteredData = participants.filter((item) => {
    const matchSearch = item.team.toLowerCase().includes(search.toLowerCase());

    // Kalau semua filter false, artinya tampilkan semua
    if (!filterPending && !filterAccepted && !filterRejected)
      return matchSearch;

    const matchPending = filterPending && item.status === "Pending";
    const matchAccepted = filterAccepted && item.status === "Approve";
    const matchRejected = filterRejected && item.status === "Rejected";
    const matchSubmitted = filterSubmitted && item.status === "Submitted";
    const matchResubmitted = filterResubmitted && item.status === "Resubmitted";

    return (
      matchSearch &&
      (matchPending ||
        matchAccepted ||
        matchRejected ||
        matchSubmitted ||
        matchResubmitted)
    );
  });

  if (loading) {
    return (
      <div className="rounded-[20px] p-[2px] bg-gradient-to-r from-[#0F75BD] to-[#64BB48] h-full">
        <div className="bg-gradient-to-t from-black to-[#575757] rounded-[18px] p-6 text-white h-full flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p>Loading registration data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] p-[2px] bg-gradient-to-r from-[#0F75BD] to-[#64BB48] h-full">
        <div className="bg-gradient-to-t from-black to-[#575757] rounded-[18px] p-6 text-white h-full flex flex-col items-center justify-center">
          <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
            Error: {error}
          </div>
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
        Status: participant.status,
        "Registration Date": formatDateForExcel(participant.date),
        "Team Leader":
          participant.teamData?.members?.find((m) => m.isLeader === true)
            ?.name || "-",
        "Team Leader Email":
          participant.teamData?.members?.find((m) => m.isLeader === true)
            ?.email || "-",
        "WhatsApp Number": participant.teamData?.whatsappNumber || "-",
        "Rejection Reason": participant.reason || "-",
      }));

      const filename = `Team_Registration_${
        new Date().toISOString().split("T")[0]
      }`;
      await exportToExcel(exportData, filename, "Team Registration");
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
            <h2 className="text-xl font-bold">Registration Progress</h2>
            <p className="text-sm text-gray-300">
              Overview of Team Registration Progress
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
              <div className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pending"
                      checked={filterPending}
                      onCheckedChange={(checked) =>
                        setFilterPending(checked as boolean)
                      }
                      className="border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor="pending"
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      Pending
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepted"
                      checked={filterAccepted}
                      onCheckedChange={(checked) =>
                        setFilterAccepted(checked as boolean)
                      }
                      className="border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <label
                      htmlFor="accepted"
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      Accepted
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rejected"
                      checked={filterRejected}
                      onCheckedChange={(checked) =>
                        setFilterRejected(checked as boolean)
                      }
                      className="border-gray-400 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <label
                      htmlFor="rejected"
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      Rejected
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="submitted"
                      checked={filterSubmitted}
                      onCheckedChange={(checked) =>
                        setFilterSubmitted(checked as boolean)
                      }
                      className="border-gray-400 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
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
                      id="resubmitted"
                      checked={filterResubmitted}
                      onCheckedChange={(checked) =>
                        setFilterResubmitted(checked as boolean)
                      }
                      className="border-gray-400 data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600"
                    />
                    <label
                      htmlFor="resubmitted"
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      Resubmitted
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

        {/* Table */}
        <div className="rounded-md border-none overflow-hidden flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white">Team Name</TableHead>
                <TableHead className="text-white">Institution</TableHead>
                <TableHead className="text-white">Members</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Payment Proof</TableHead>
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
                  <TableCell className="py-4 px-6">
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
                      <DialogContent className="!max-w-3xl lg:!max-w-7xl !w-full rounded-2xl backdrop-blur-lg bg-gradient-to-b from-white/50 to-black/50 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">
                            Team Members : {row.team}
                          </DialogTitle>
                        </DialogHeader>

                        {/* List anggota tim dari API */}
                        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                          {row.teamData?.members.map((member) => (
                            <div
                              key={member.id}
                              className="bg-white/20 backdrop-blur-lg rounded-lg p-4 shadow-md flex flex-col"
                            >
                              {/* Nama & Role */}
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col items-start gap-2 w-full">
                                  <div className="flex items-start justify-between w-full">
                                    <div>
                                      <h3 className="font-semibold text-lg">
                                        {member.name}
                                      </h3>
                                      <p className="text-sm text-white">
                                        {member.email}
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      member.isLeader
                                        ? "bg-black text-white"
                                        : "bg-gray-700 text-gray-200"
                                    }`}
                                  >
                                    {member.isLeader
                                      ? "Team Leader, " + member.memberRole
                                      : member.memberRole}
                                  </span>
                                </div>
                              </div>

                              {/* Documents Section */}
                              <div className="mt-4">
                                <h4 className="font-semibold">Documents</h4>
                                <div className="flex items-center gap-3 mt-2 flex-col p-2 bg-white/30 rounded-md min-h-[140px]">
                                  <div className="w-full flex justify-between">
                                    <h5 className="text-xs">Link Files</h5>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      variant="outline"
                                      type="button"
                                      size={"sm"}
                                      className="bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white"
                                      onClick={() =>
                                        window.open(
                                          member.requirementLink,
                                          "_blank"
                                        )
                                      }
                                    >
                                      <Eye /> Open Document
                                    </Button>
                                    <p className="text-xs text-white/70">
                                      {member.requirementLink}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      variant="outline"
                                      type="button"
                                      size={"sm"}
                                      className="bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white"
                                      onClick={() =>
                                        window.open(member.githubUrl, "_blank")
                                      }
                                    >
                                      <GithubLogo /> Open GitHub
                                    </Button>
                                    <p className="text-xs text-white/70">
                                      {member.githubUrl}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <HoverableStatus
                      status={row.status}
                      entityId={row.id}
                      entityType="team"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {/* <button
                            type="button"
                            className="text-white/60 hover:text-white"
                          > */}
                          <Button
                            variant="outline"
                            type="button"
                            size={"sm"}
                            className="bg-blue-600 border border-blue-600 text-white hover:bg-blue-800 hover:text-white"
                            onClick={() =>
                              window.open(row.paymentproof_url, "_blank")
                            }
                          >
                            <Eye /> Payment Proof
                          </Button>
                          {/* <InfoIcon className="size-4" /> */}
                          {/* </button> */}
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-xs text-sm"
                        >
                          <p>{row.paymentproof_url}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>{" "}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {new Date(row.date).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="flex gap-2 py-4 px-6 flex-col">
                    {row.status === "Submitted" ||
                    row.status === "Resubmitted" ? (
                      <>
                        {/* Approve */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() =>
                                setSelected({ index: idx, action: "Approve" })
                              }
                              className="bg-green-600 text-white border w-[120px] border-white/20 flex items-center justify-start gap-2 rounded-full"
                            >
                              <CheckCircle />
                              Approve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="backdrop-blur-lg bg-black/80 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg font-bold">
                                Are you sure you want to approve this team?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                This action will approve{" "}
                                <span className="font-semibold">
                                  {row.team}
                                </span>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex gap-3 justify-center mt-6">
                              <AlertDialogCancel className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700">
                                NO
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleTeamApprove}
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                              >
                                YES
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {/* Reject */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() =>
                                setSelected({ index: idx, action: "Reject" })
                              }
                              className="bg-red-600 text-white w-[120px] flex items-center justify-start rounded-full gap-2"
                            >
                              <XCircle />
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="backdrop-blur-lg bg-black/80 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg font-bold">
                                Are you sure you want to reject this team?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                This action will reject{" "}
                                <span className="font-semibold">
                                  {row.team}
                                </span>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex gap-3 mt-6 items-center justify-center w-full">
                              <AlertDialogCancel className="bg-red-600 border-none text-white px-6 py-2 rounded-md hover:bg-red-700 max-w-[120px] w-full">
                                NO
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleTeamReject}
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 max-w-[120px] w-full"
                              >
                                YES
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <HoverableStatus
                        status={row.status}
                        entityId={row.id}
                        entityType="team"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Modal alasan reject */}
        <Dialog open={showReason} onOpenChange={setShowReason}>
          <DialogContent className="backdrop-blur-lg bg-black/80 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Provide Rejection Reason
              </DialogTitle>
              {selected.index !== -1 && (
                <p className="text-gray-300">
                  Rejecting team:{" "}
                  <span className="font-semibold">
                    {participants[selected.index].team}
                  </span>
                </p>
              )}
            </DialogHeader>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Write the reason for rejection..."
              className="mt-3 bg-white/10 text-white border border-white/20"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                onClick={() => setShowReason(false)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTeamSubmitReason}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal success */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="backdrop-blur-lg bg-black/80 text-white text-center">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                ✅ Success!
              </DialogTitle>
            </DialogHeader>
            <p className="text-gray-300 mt-4">
              Team status has been updated successfully.
            </p>
            <Button
              onClick={() => setShowSuccess(false)}
              className="bg-green-600 text-white hover:bg-green-700 mt-4"
            >
              OK
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
