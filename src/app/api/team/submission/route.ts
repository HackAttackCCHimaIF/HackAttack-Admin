import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import {
  SubmissionDB,
  Submission,
  SubmissionWithTeam,
} from "@/lib/interface/submission";
import { TeamDB, Team } from "@/lib/interface/team";
import { TeamMemberDB, TeamMember } from "@/lib/interface/teammember";

// Helper function to convert database types to app types
function convertSubmissionDBToSubmission(
  submissionDB: SubmissionDB
): Submission {
  return {
    id: submissionDB.id,
    teamId: submissionDB.team_id,
    proposalUrl: submissionDB.proposal_url,
    status: submissionDB.status,
    createdAt: submissionDB.created_at,
    updatedAt: submissionDB.updated_at,
  };
}

function convertTeamDBToTeam(teamDB: TeamDB): Team {
  return {
    id: teamDB.id,
    createdBy: teamDB.created_by,
    teamName: teamDB.team_name,
    institution: teamDB.institution,
    whatsappNumber: teamDB.whatsapp_number,
    paymentProofUrl: teamDB.paymentproof_url,
    createdAt: teamDB.created_at,
    updatedAt: teamDB.updated_at,
    approvalStatus: teamDB.approvalstatus,
  };
}

function convertTeamMemberDBToTeamMember(memberDB: TeamMemberDB): TeamMember {
  return {
    id: memberDB.id,
    teamId: memberDB.team_id,
    name: memberDB.name,
    email: memberDB.email,
    githubUrl: memberDB.github_url,
    dataUrl: memberDB.data_url,
    isLeader: memberDB.is_leader,
    createdAt: memberDB.created_at,
    updatedAt: memberDB.updated_at,
    memberRole: memberDB.member_role,
    memberApproval: memberDB.member_approval,
  };
}

export async function GET() {
  try {
    const { data: submissionsData, error: submissionsError } =
      await supabaseServer.from("Submission").select(`
        *,
        Team:Team(*),
        TeamMember:TeamMember(*)
      `);

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    // Convert to app types
    const submissions: SubmissionWithTeam[] = submissionsData.map(
      (submissionData) => {
        const submission = convertSubmissionDBToSubmission(submissionData);
        const team = convertTeamDBToTeam(submissionData.team);
        const teamMembers = submissionData.team_members.map(
          (member: TeamMemberDB) => convertTeamMemberDBToTeamMember(member)
        );

        return {
          ...submission,
          team,
          teamMembers,
        };
      }
    );

    return NextResponse.json({ data: submissions });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
