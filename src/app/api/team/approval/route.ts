import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { TeamApproval } from "@/lib/interface/team";
import { EmailService } from "@/lib/services/emailService";

export async function PUT(request: NextRequest) {
  try {
    const { teamId, approval, rejectMessage } = await request.json();

    if (!teamId || !approval) {
      return NextResponse.json(
        { success: false, message: "Team ID and approval status are required" },
        { status: 400 }
      );
    }

    if (!Object.values(TeamApproval).includes(approval)) {
      return NextResponse.json(
        { success: false, message: "Invalid approval status" },
        { status: 400 }
      );
    }

    if (
      approval === TeamApproval.Rejected &&
      (!rejectMessage || rejectMessage.trim() === "")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Reject message is required when rejecting a team",
        },
        { status: 400 }
      );
    }
    const { data: teamData, error: fetchTeamError } = await supabaseServer
      .from("Team")
      .select("id, created_at, team_name")
      .eq("id", teamId)
      .single();

    if (fetchTeamError || !teamData) {
      console.error("Error fetching team data:", fetchTeamError);
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      );
    }

    const { data: leaderData, error: fetchLeaderError } = await supabaseServer
      .from("TeamMember")
      .select("email, name")
      .eq("team_id", teamId)
      .eq("is_leader", true)
      .single();

    if (fetchLeaderError || !leaderData) {
      console.error("Error fetching team leader data:", fetchLeaderError);
      return NextResponse.json(
        { success: false, message: "Team leader not found" },
        { status: 404 }
      );
    }

    const updateData: {
      approvalstatus: TeamApproval;
      reject_message?: string | null;
    } = {
      approvalstatus: approval,
    };

    if (approval === TeamApproval.Rejected) {
      updateData.reject_message = rejectMessage;
    } else if (approval === TeamApproval.Accepted) {
      updateData.reject_message = null;
    }

    const { data, error } = await supabaseServer
      .from("Team")
      .update(updateData)
      .eq("id", teamId)
      .select();

    if (error) {
      console.error("Error updating team approval:", error);
      return NextResponse.json(
        { success: false, message: "Failed to update team approval" },
        { status: 500 }
      );
    }

    try {
      if (approval === TeamApproval.Accepted) {
        await EmailService.sendEmailWithAutoBatch(
          leaderData.email,
          leaderData.name,
          teamData.created_at,
          "success"
        );
        console.log(
          `Success email sent to ${leaderData.email} (${leaderData.name})`
        );
      } else if (approval === TeamApproval.Rejected) {
        await EmailService.sendFailedRegistrationEmail(
          leaderData.email,
          leaderData.name,
          rejectMessage
        );
        console.log(
          `Rejection email sent to ${leaderData.email} (${leaderData.name})`
        );
      }
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Team approval updated successfully",
      data: data[0],
      emailSent: true,
    });
  } catch (error) {
    console.error("Team approval error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
