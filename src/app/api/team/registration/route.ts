import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { TeamDB, Team, TeamWithDetails } from "@/lib/interface/team";
import { UserDB, User } from "@/lib/interface/users";
import { TeamMemberDB, TeamMember } from "@/lib/interface/teammember";

function convertUserDBToUser(userDB: UserDB): User {
  return {
    id: userDB.id,
    email: userDB.email,
    username: userDB.username,
    role: userDB.role,
    onboarded: userDB.onboarded,
    createdAt: userDB.created_at,
    updatedAt: userDB.updated_at,
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
    rejectMessage: teamDB.reject_message,
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

    const { data: usersData, error: usersError } = await supabaseServer
      .from("Users")
      .select("*");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const { data: membersData, error: membersError } = await supabaseServer
      .from("TeamMember")
      .select("*");

    if (membersError) {
      console.error("Error fetching team members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    const teams: TeamWithDetails[] = teamsData
      .map((teamData: TeamDB) => {
        const team = convertTeamDBToTeam(teamData);

        const creatorData = usersData.find(
          (user: UserDB) => user.id === teamData.created_by
        );
        const creator = creatorData ? convertUserDBToUser(creatorData) : null;

        const teamMembers = membersData
          .filter((member: TeamMemberDB) => member.team_id === teamData.id)
          .map((member: TeamMemberDB) =>
            convertTeamMemberDBToTeamMember(member)
          );

        return {
          ...team,
          creator: creator!,
          members: teamMembers,
          memberCount: teamMembers.length,
        };
      })
      .filter((team) => team.creator !== null);

    return NextResponse.json({ data: teams });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
