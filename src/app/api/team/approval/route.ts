import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { TeamApproval } from "@/lib/interface/team";
import { EmailService } from "@/lib/services/emailService";
import { NotificationService } from "@/lib/services/notificationService";

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

    const { data: teamData, error: fetchTeamError } = await supabaseServer
      .from("Team")
      .select("id, created_at, team_name, created_by")
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
      .or(`is_leader.eq.true,email.eq.${teamData.created_by}`)
      .limit(1)
      .single();

    if (fetchLeaderError || !leaderData) {
      console.error("Error fetching team leader data:", fetchLeaderError);

      const { data: anyMemberData, error: anyMemberError } =
        await supabaseServer
          .from("TeamMember")
          .select("email, name")
          .eq("team_id", teamId)
          .limit(1)
          .single();

      if (anyMemberError || !anyMemberData) {
        return NextResponse.json(
          { success: false, message: "No team members found" },
          { status: 404 }
        );
      }
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

    let emailSent = false;
    try {
      if (approval === TeamApproval.Accepted) {
        await EmailService.sendEmailWithAutoBatch(
          leaderData?.email || "",
          leaderData?.name || "",
          teamData.created_at,
          "success"
        );
        console.log(
          `Success email sent to ${leaderData?.email || ""} (${
            leaderData?.name || ""
          })`
        );
        emailSent = true;
      } else if (approval === TeamApproval.Rejected) {
        await EmailService.sendFailedRegistrationEmail(
          leaderData?.email || "",
          leaderData?.name || "",
          rejectMessage
        );
        console.log(
          `Rejection email sent to ${leaderData?.email || ""} (${
            leaderData?.name || ""
          })`
        );
        emailSent = true;
      }
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    let notificationSent = false;
    try {
      notificationSent =
        await NotificationService.createTeamApprovalNotification(
          teamData.created_by,
          teamId,
          teamData.team_name,
          approval === TeamApproval.Accepted,
          rejectMessage
        );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Team approval updated successfully",
      data: data[0],
      emailSent,
      notificationSent,
    });
  } catch (error) {
    console.error("Team approval error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
