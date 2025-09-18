import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { TeamApproval } from "@/lib/interface/team";

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

    return NextResponse.json({
      success: true,
      message: "Team approval updated successfully",
      data: data[0],
    });
  } catch (error) {
    console.error("Error in PUT /api/team/approval:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
