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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Eye,
  Circle,
  XCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

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
import { MemberApproval } from "@/lib/interface/teammember";
import { toast } from "sonner";

const mapApiStatusToComponentStatus = (apiStatus: TeamApproval): Status => {
  switch (apiStatus) {
    case TeamApproval.Pending:
      return "Pending";
    case TeamApproval.Accepted:
      return "Approve";
    case TeamApproval.Rejected:
      return "Rejected";
    default:
      return "Pending";
  }
};

type Status = "Pending" | "Approve" | "Rejected";

interface Participant {
  id: string;
  team: string;
  institution: string;
  members: number;
  status: Status;
  date: string;
  reason?: string;
  teamData?: TeamWithDetails;
}

const getStatusBadge = (status: Status) => {
  switch (status) {
    case "Pending":
      return (
        <Badge className="bg-orange-50 rounded-full text-orange-400 font-semibold py-2">
          <Circle className="!w-3 !h-3 fill-current text-orange-400 mr-1" />
          Pending
        </Badge>
      );
    case "Approve":
      return (
        <Badge className="bg-green-500 rounded-full text-lime-200 font-semibold py-2">
          <Circle className="!w-3 !h-3 fill-current text-lime-200 mr-1" />
          Approved
        </Badge>
      );
    case "Rejected":
      return (
        <Badge className="bg-red-600 rounded-full text-red-200 font-semibold py-2">
          <Circle className="!w-3 !h-3 fill-current text-red-200 mr-1" />
          Rejected
        </Badge>
      );
  }
};

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
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
  const [teamApprovalLoading, setTeamApprovalLoading] = useState<string | null>(
    null
  );
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

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
            date: new Date(team.createdAt).toLocaleDateString("en-GB"),
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

  const handleMemberApproval = async (
    memberId: string,
    approval: MemberApproval
  ) => {
    setApprovalLoading(memberId);

    try {
      const response = await fetch("/api/team/member/approval", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
          approval,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update member approval");
      }

      setParticipants((prevParticipants) =>
        prevParticipants.map((participant) => ({
          ...participant,
          teamData: participant.teamData
            ? {
                ...participant.teamData,
                members: participant.teamData.members.map((member) =>
                  member.id === memberId
                    ? { ...member, memberApproval: approval }
                    : member
                ),
              }
            : participant.teamData,
        }))
      );

      console.log(`Member approval updated to ${approval}`);
      toast.success(`Member approval updated to ${approval}`);
    } catch (error) {
      console.error("Error updating member approval:", error);
      toast.error(
        `Failed to update member approval: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setApprovalLoading(null);
    }
  };

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

  const filteredData = participants.filter((item) =>
    item.team.toLowerCase().includes(search.toLowerCase())
  );

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white text-black"
              >
                <Filter className="h-4 w-4 text-[#5B5B5B]" /> Filter By
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Status</DropdownMenuItem>
              <DropdownMenuItem>Date</DropdownMenuItem>
              <DropdownMenuItem>Institution</DropdownMenuItem>
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
                                    <div className="flex items-start gap-6 mt-3">
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() =>
                                            handleMemberApproval(
                                              member.id,
                                              MemberApproval.Accepted
                                            )
                                          }
                                          disabled={
                                            approvalLoading === member.id ||
                                            member.memberApproval ===
                                              MemberApproval.Accepted
                                          }
                                          className={badgeVariants({
                                            className: `cursor-pointer px-6 ${
                                              member.memberApproval ===
                                              MemberApproval.Accepted
                                                ? "bg-green-600"
                                                : "bg-[#4e4e4e] hover:bg-green-600"
                                            } ${
                                              approvalLoading === member.id
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                            }`,
                                          })}
                                        >
                                          {approvalLoading === member.id ? (
                                            <Clock className="size-4 animate-spin" />
                                          ) : (
                                            <CheckCircle className="size-4" />
                                          )}{" "}
                                          Yes!
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleMemberApproval(
                                              member.id,
                                              MemberApproval.Rejected
                                            )
                                          }
                                          disabled={
                                            approvalLoading === member.id ||
                                            member.memberApproval ===
                                              MemberApproval.Rejected
                                          }
                                          className={badgeVariants({
                                            className: `cursor-pointer px-6 ${
                                              member.memberApproval ===
                                              MemberApproval.Rejected
                                                ? "bg-red-800"
                                                : "bg-red-600 hover:bg-red-800"
                                            } ${
                                              approvalLoading === member.id
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                            }`,
                                          })}
                                        >
                                          {approvalLoading === member.id ? (
                                            <Clock className="size-4 animate-spin" />
                                          ) : (
                                            <XCircle className="size-4" />
                                          )}{" "}
                                          No!
                                        </button>
                                      </div>
                                      <Badge
                                        className={`ml-auto ${
                                          member.memberApproval === "Accepted"
                                            ? "bg-green-500 text-white"
                                            : member.memberApproval ===
                                              "Rejected"
                                            ? "bg-red-500 text-white"
                                            : "bg-yellow-500 text-black"
                                        }`}
                                      >
                                        {member.memberApproval}
                                      </Badge>
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
                                      ? "Team Leader"
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
                                    <Badge className="bg-[#FFF2DD] text-[#D98634] rounded-full">
                                      <Circle className="fill-current text-[#D98634] !size-2" />{" "}
                                      Verification Required
                                    </Badge>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      size={"sm"}
                                      variant="outline"
                                      className="bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white"
                                      onClick={() =>
                                        window.open(member.dataUrl, "_blank")
                                      }
                                    >
                                      <Eye /> Open Document
                                    </Button>
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
                    {getStatusBadge(row.status)}
                  </TableCell>
                  <TableCell className="py-4 px-6">{row.date}</TableCell>
                  <TableCell className="flex gap-2 py-4 px-6 flex-col">
                    {row.status === "Pending" ? (
                      <>
                        {/* Approve */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() =>
                                setSelected({ index: idx, action: "Approve" })
                              }
                              className="bg-[#8B8B8B] text-white border w-[120px] border-white/20 flex items-center justify-start gap-2 rounded-full"
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
                      getStatusBadge(row.status)
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
