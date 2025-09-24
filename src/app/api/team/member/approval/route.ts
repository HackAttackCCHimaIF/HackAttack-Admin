import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { MemberApproval } from "@/lib/interface/teammember";
import { NotificationService } from "@/lib/services/notificationService";

export async function PUT(request: NextRequest) {
  try {
    const { memberId, approval } = await request.json();

    if (!memberId || !approval) {
      return NextResponse.json(
        {
          success: false,
          message: "Member ID and approval status are required",
        },
        { status: 400 }
      );
    }

    if (!Object.values(MemberApproval).includes(approval)) {
      return NextResponse.json(
        { success: false, message: "Invalid approval status" },
        { status: 400 }
      );
    }

    const { data: memberData, error: fetchMemberError } = await supabaseServer
      .from("TeamMember")
      .select("id, name, team_id")
      .eq("id", memberId)
      .single();

    if (fetchMemberError || !memberData) {
      console.error("Error fetching member data:", fetchMemberError);
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    const { data: teamData, error: fetchTeamError } = await supabaseServer
      .from("Team")
      .select("id, team_name, created_by")
      .eq("id", memberData.team_id)
      .single();

    if (fetchTeamError || !teamData) {
      console.error("Error fetching team data:", fetchTeamError);
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseServer
      .from("TeamMember")
      .update({ member_approval: approval })
      .eq("id", memberId)
      .select();

    if (error) {
      console.error("Error updating member approval:", error);
      return NextResponse.json(
        { success: false, message: "Failed to update member approval" },
        { status: 500 }
      );
    }

    let notificationSent = false;
    try {
      notificationSent =
        await NotificationService.createMemberApprovalNotification(
          teamData.created_by,
          memberData.team_id,
          memberId,
          memberData.name,
          teamData.team_name
        );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Member approval updated successfully",
      data: data[0],
      notificationSent,
    });
  } catch (error) {
    console.error("Error in PUT /api/team/member/approval:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
