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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { exportToExcel, formatDateForExcel } from "@/lib/utils/excelExport";
import { toast } from "sonner";
import { Workshop, WorkshopApproval } from "@/lib/interface/workshop";
import { HoverableStatus } from "@/components/ui/hoverable-status";

interface WorkshopParticipant {
  id: string;
  name: string;
  email: string;
  institution: string;
  whatsappNumber: string;
  workshop: string;
  paymentProofLink: string;
  approval: WorkshopApproval;
  date: string;
  rejectreason?: string;
}

export default function AdminWorkshopTable() {
  const [search, setSearch] = useState("");
  const [participants, setParticipants] = useState<WorkshopParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<{
    index: number;
    action: "Approved" | "Rejected" | null;
  }>({ index: -1, action: null });

  const [showReason, setShowReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [filterPending, setFilterPending] = useState(false);
  const [filterApproved, setFilterApproved] = useState(false);
  const [filterRejected, setFilterRejected] = useState(false);
  useEffect(() => {
    const fetchWorkshopData = async () => {
      try {
        const response = await fetch("/api/workshop");
        const result = await response.json();

        if (result.success) {
          const transformedData: WorkshopParticipant[] = result.data.map(
            (workshop: Workshop) => ({
              id: workshop.id,
              name: workshop.fullName,
              email: workshop.email,
              institution: workshop.institution,
              whatsappNumber: workshop.whatsappNumber,
              workshop: workshop.workshop,
              paymentProofLink: workshop.paymentProofLink,
              approval: workshop.approval,
              date: workshop.createdAt,
            })
          );
          setParticipants(transformedData);
        } else {
          toast.error("Failed to fetch workshop data");
        }
      } catch (error) {
        console.error("Error fetching workshop data:", error);
        toast.error("Error loading workshop data");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshopData();
  }, []);

  const handleApprove = async () => {
    if (selected.index !== -1) {
      try {
        const participant = participants[selected.index];
        const response = await fetch("/api/workshop", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: participant.id,
            status: "Approved",
          }),
        });

        const result = await response.json();

        if (result.success) {
          const updated = [...participants];
          updated[selected.index].approval = WorkshopApproval.Approved;
          setParticipants(updated);
          setSelected({ index: -1, action: null });
          setShowSuccess(true);
          toast.success("Participant approved successfully");
        } else {
          toast.error("Failed to approve participant");
        }
      } catch (error) {
        console.error("Error approving participant:", error);
        toast.error("Error approving participant");
      }
    }
  };

  const handleReject = () => {
    setShowReason(true);
  };

  const handleSelectAll = () => {
    setFilterPending(true);
    setFilterApproved(true);
    setFilterRejected(true);
  };

  const handleSubmitReason = async () => {
    if (selected.index !== -1 && rejectReason.trim()) {
      try {
        const participant = participants[selected.index];
        const response = await fetch("/api/workshop", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: participant.id,
            status: "Rejected",
            rejectMessage: rejectReason.trim(),
          }),
        });

        const result = await response.json();

        if (result.success) {
          const updated = [...participants];
          updated[selected.index].approval = WorkshopApproval.Rejected;
          updated[selected.index].rejectreason = rejectReason.trim();
          setParticipants(updated);
          setSelected({ index: -1, action: null });
          setShowReason(false);
          setRejectReason("");
          setShowSuccess(true);
          toast.success("Participant rejected and email sent successfully");
        } else {
          toast.error("Failed to reject participant");
        }
      } catch (error) {
        console.error("Error rejecting participant:", error);
        toast.error("Error rejecting participant");
      }
    }
  };

  const filteredData = participants.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.institution.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      (filterPending && item.approval === WorkshopApproval.Pending) ||
      (filterApproved && item.approval === WorkshopApproval.Approved) ||
      (filterRejected && item.approval === WorkshopApproval.Rejected) ||
      (!filterApproved && !filterPending && !filterRejected);

    return matchesSearch && matchesFilter;
  });

  const handleExportToExcel = async () => {
    try {
      const exportData = filteredData.map((participant, index) => ({
        No: index + 1,
        Name: participant.name,
        Email: participant.email,
        Institution: participant.institution,
        "WhatsApp Number": participant.whatsappNumber,
        Workshop: participant.workshop,
        Status: participant.approval,
        "Registration Date": formatDateForExcel(participant.date),
        "Payment Proof": participant.paymentProofLink,
        "Rejection Reason": participant.rejectreason || "-",
      }));

      const filename = `Workshop_Participants_${
        new Date().toISOString().split("T")[0]
      }`;
      await exportToExcel(exportData, filename, "Workshop Participants");
      toast.success("Success Exporting data");
    } catch (error) {
      toast.error("Export failed. Please try again.");
      console.error("Export failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[20px] p-[2px] bg-gradient-to-r from-[#0F75BD] to-[#64BB48] h-full">
        <div className="bg-gradient-to-t from-black to-[#575757] rounded-[18px] p-6 text-white h-full flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
          <p className="mt-4">Loading workshop data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] p-[2px] bg-gradient-to-r from-[#0F75BD] to-[#64BB48] h-full">
      <div className="bg-gradient-to-t from-black to-[#575757] rounded-[18px] p-6 text-white h-full flex flex-col">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Workshop Progress</h2>
            <p className="text-sm text-gray-300">
              Overview of Participant Workshop Progress
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
              placeholder="Search by name, email, or institution"
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
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
              <div className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="approved"
                      checked={filterApproved}
                      onCheckedChange={(checked) =>
                        setFilterApproved(checked as boolean)
                      }
                      className="border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <label
                      htmlFor="approved"
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      Approved
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pending"
                      checked={filterPending}
                      onCheckedChange={(checked) =>
                        setFilterPending(checked as boolean)
                      }
                      className="border-gray-400 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
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
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white">Institution</TableHead>
                <TableHead className="text-white">Workshop</TableHead>
                <TableHead className="text-white">WhatsApp</TableHead>
                <TableHead className="text-white">Payment Proof</TableHead>
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
                  <TableCell className="py-4 px-6">{row.name}</TableCell>
                  <TableCell className="py-4 px-6">{row.email}</TableCell>
                  <TableCell className="py-4 px-6">
                    {row.institution === "telkom"
                      ? "Telkom University"
                      : "Non Telkom"}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {row.workshop === "workshop1" ? "Workshop 1" : "Workshop 2"}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {row.whatsappNumber}
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      onClick={() =>
                        window.open(row.paymentProofLink, "_blank")
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Proof
                    </Button>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <HoverableStatus
                      status={row.approval}
                      entityId={row.id}
                      entityType="workshop"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {new Date(row.date).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="flex gap-2 py-4 px-6 flex-col">
                    {row.approval === "Pending" && (
                      <>
                        {/* Approve */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() =>
                                setSelected({ index: idx, action: "Approved" })
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
                                Are you sure you want to approve this
                                participant?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                This action will approve{" "}
                                <span className="font-semibold">
                                  {row.name}
                                </span>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex gap-3 justify-center mt-6">
                              <AlertDialogCancel className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700">
                                NO
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleApprove}
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
                                setSelected({ index: idx, action: "Rejected" })
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
                                Are you sure you want to reject this
                                participant?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                This action will reject{" "}
                                <span className="font-semibold">
                                  {row.name}
                                </span>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex gap-3 mt-6 items-center justify-center w-full">
                              <AlertDialogCancel className="bg-red-600 border-none text-white px-6 py-2 rounded-md hover:bg-red-700 max-w-[120px] w-full">
                                NO
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleReject}
                                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 max-w-[120px] w-full"
                              >
                                YES
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Success Dialog */}
        <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
          <AlertDialogContent className="backdrop-blur-lg bg-black/80 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-center">
                Success!
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300 text-center">
                The participant status has been updated successfully.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex justify-center">
              <AlertDialogAction
                onClick={() => setShowSuccess(false)}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reason Dialog */}
        <AlertDialog open={showReason} onOpenChange={setShowReason}>
          <AlertDialogContent className="backdrop-blur-lg bg-black/80 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold">
                Rejection Reason
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Please provide a reason for rejecting this participant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-white/10 border border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <AlertDialogFooter className="flex gap-3 justify-center">
              <AlertDialogCancel
                onClick={() => {
                  setShowReason(false);
                  setRejectReason("");
                  setSelected({ index: -1, action: null });
                }}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSubmitReason}
                disabled={!rejectReason.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
