import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { SubmissionStatus } from "@/lib/interface/submission";
import { NotificationService } from "@/lib/services/notificationService";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, status } = body;

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: "Submission ID and status are required" },
        { status: 400 }
      );
    }

    if (!Object.values(SubmissionStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { data: submissionData, error: fetchSubmissionError } =
      await supabaseServer
        .from("Submission")
        .select("id, team_id")
        .eq("id", submissionId)
        .single();

    if (fetchSubmissionError || !submissionData) {
      console.error("Error fetching submission data:", fetchSubmissionError);
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const { data: teamData, error: fetchTeamError } = await supabaseServer
      .from("Team")
      .select("id, team_name, created_by")
      .eq("id", submissionData.team_id)
      .single();

    if (fetchTeamError || !teamData) {
      console.error("Error fetching team data:", fetchTeamError);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const { data, error } = await supabaseServer
      .from("Submission")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating submission status:", error);
      return NextResponse.json(
        { error: "Failed to update submission status" },
        { status: 500 }
      );
    }

    let notificationSent = false;
    try {
      notificationSent =
        await NotificationService.createSubmissionApprovalNotification(
          teamData.created_by,
          submissionData.team_id,
          submissionId,
          teamData.team_name,
          status === SubmissionStatus.Valid
        );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `Submission ${status.toLowerCase()} successfully`,
      notificationSent,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
