import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { SubmissionDB } from "@/lib/interface/submission";
import { TeamDB, Team } from "@/lib/interface/team";
import { TeamMemberDB, TeamMember } from "@/lib/interface/teammember";
import {
  convertTeamDBToTeam,
  convertTeamMemberDBToTeamMember,
} from "@/lib/utility/typeconverter";

interface TeamWithSubmissionStatus extends Team {
  teamMembers: TeamMember[];
  hasSubmission: boolean;
  submissionId?: string;
  submissionStatus?: string;
  submissionDate?: string;
}

export async function GET() {
  try {
    const { data: teamsData, error: teamsError } = await supabaseServer
      .from("Team")
      .select("*");

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: 500 }
      );
    }

    if (!teamsData || teamsData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const teamIds = teamsData.map((team: TeamDB) => team.id);

    const { data: membersData, error: membersError } = await supabaseServer
      .from("TeamMember")
      .select("*")
      .in("team_id", teamIds);

    if (membersError) {
      console.error("Error fetching team members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    const { data: submissionsData, error: submissionsError } =
      await supabaseServer
        .from("Submission")
        .select("*")
        .in("team_id", teamIds);

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    const submissionMap = new Map();
    submissionsData?.forEach((submission: SubmissionDB) => {
      submissionMap.set(submission.team_id, submission);
    });

    const teamsWithSubmissionStatus: TeamWithSubmissionStatus[] = teamsData.map(
      (teamData: TeamDB) => {
        const team = convertTeamDBToTeam(teamData);

        const teamMembers =
          membersData
            ?.filter((member: TeamMemberDB) => member.team_id === teamData.id)
            .map((member: TeamMemberDB) =>
              convertTeamMemberDBToTeamMember(member)
            ) || [];

        const submission = submissionMap.get(teamData.id);

        return {
          ...team,
          teamMembers,
          hasSubmission: !!submission,
          submissionId: submission?.id,
          submissionStatus: submission?.status,
          submissionDate: submission?.created_at,
        };
      }
    );

    return NextResponse.json({ data: teamsWithSubmissionStatus });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
