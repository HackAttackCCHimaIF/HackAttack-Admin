import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/config/supabase-server";
import { SubmissionStatus } from "@/lib/interface/submission";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, status } = body;

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: "Submission ID and status are required" },
        { status: 400 }
      );
    }

    if (!Object.values(SubmissionStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("Submission")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating submission status:", error);
      return NextResponse.json(
        { error: "Failed to update submission status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `Submission ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
