import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { MemberApproval } from "@/lib/interface/teammember";

export async function PUT(request: NextRequest) {
  try {
    const { memberId, approval } = await request.json();

    if (!memberId || !approval) {
      return NextResponse.json(
        { success: false, message: "Member ID and approval status are required" },
        { status: 400 }
      );
    }

    if (!Object.values(MemberApproval).includes(approval)) {
      return NextResponse.json(
        { success: false, message: "Invalid approval status" },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      message: "Member approval updated successfully",
      data: data[0],
    });
  } catch (error) {
    console.error("Error in PUT /api/team/member/approval:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}