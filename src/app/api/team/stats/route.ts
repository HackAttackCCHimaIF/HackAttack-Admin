import { NextResponse } from "next/server";
import { TeamStats } from "@/lib/interface/team";
import { supabaseServer } from "@/lib/config/supabase-server";

export async function GET() {
  try {
    const { count, error: countError } = await supabaseServer
      .from("Team")
      .select("*", { count: "exact" })
      .limit(0);

    if (countError) throw countError;

    const { data: statusData, error: statusError } = await supabaseServer
      .from("Team")
      .select("approvalstatus");

    if (statusError) throw statusError;

    const pending =
      statusData?.filter((team) => team.approvalstatus === "Pending").length ||
      0;
    const accepted =
      statusData?.filter((team) => team.approvalstatus === "Accepted").length ||
      0;
    const rejected =
      statusData?.filter((team) => team.approvalstatus === "Rejected").length ||
      0;

    const stats: TeamStats = {
      total: count || 0,
      pending,
      approved: accepted,
      rejected,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("API Error - Team Stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
