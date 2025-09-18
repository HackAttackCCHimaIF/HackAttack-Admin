import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { SubmissionStats, SubmissionStatus } from "@/lib/interface/submission";

export async function GET() {
  try {
    const { count: totalTeams, error: countError } = await supabaseServer
      .from("Team")
      .select("*", { count: "exact" })
      .limit(0);

    if (countError) {
      console.error("Error counting teams:", countError);
      return NextResponse.json(
        { error: "Failed to count teams" },
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

    const submittedTeams = new Set(
      submissionsData?.map((s) => s.team_id) || []
    );

    const validSubmissions =
      submissionsData?.filter((s) => s.status === SubmissionStatus.Valid)
        .length || 0;

    const invalidSubmissions =
      submissionsData?.filter((s) => s.status === SubmissionStatus.Invalid)
        .length || 0;

    const total = totalTeams || 0;
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
