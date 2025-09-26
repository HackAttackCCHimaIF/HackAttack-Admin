import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { SubmissionStats, SubmissionStatus } from "@/lib/interface/submission";
import { TeamApproval } from "@/lib/interface/team";

export async function GET() {
  try {
    const { count: totalApprovedTeams, error: countError } =
      await supabaseServer
        .from("Team")
        .select("*", { count: "exact" })
        .eq("approvalstatus", TeamApproval.Accepted)
        .limit(0);

    if (countError) {
      console.error("Error counting approved teams:", countError);
      return NextResponse.json(
        { error: "Failed to count approved teams" },
        { status: 500 }
      );
    }

    const { data: submissionsData, error: submissionsError } =
      await supabaseServer.from("Submission").select("team_id, status");

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    const { data: approvedTeamsData, error: approvedTeamsError } =
      await supabaseServer
        .from("Team")
        .select("id")
        .eq("approvalstatus", TeamApproval.Accepted);

    if (approvedTeamsError) {
      console.error("Error fetching approved teams:", approvedTeamsError);
      return NextResponse.json(
        { error: "Failed to fetch approved teams" },
        { status: 500 }
      );
    }

    const approvedTeamIds = new Set(
      approvedTeamsData?.map((team) => team.id) || []
    );

    const validSubmissionsData =
      submissionsData?.filter((submission) =>
        approvedTeamIds.has(submission.team_id)
      ) || [];

    const submittedTeams = new Set(validSubmissionsData.map((s) => s.team_id));

    const validSubmissions =
      validSubmissionsData.filter((s) => s.status === SubmissionStatus.Valid)
        .length || 0;

    const invalidSubmissions =
      validSubmissionsData.filter((s) => s.status === SubmissionStatus.Invalid)
        .length || 0;

    const total = totalApprovedTeams || 0;
    const submitted = submittedTeams.size;
    const notSubmitted = total - submitted;

    const stats: SubmissionStats = {
      total,
      valid: validSubmissions,
      invalid: invalidSubmissions,
      submitted,
      notSubmitted,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("API Error - Submission Stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
