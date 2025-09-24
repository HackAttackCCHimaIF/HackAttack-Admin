import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { TeamDB, TeamWithDetails } from "@/lib/interface/team";
import { UserDB } from "@/lib/interface/users";
import { TeamMemberDB } from "@/lib/interface/teammember";
import {
  convertTeamDBToTeam,
  convertUserDBToUser,
  convertTeamMemberDBToTeamMember,
} from "@/lib/utility/typeconverter";

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
