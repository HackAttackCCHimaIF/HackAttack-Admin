import { NextResponse } from "next/server";
import { WorkshopStats } from "@/lib/interface/workshop";
import { supabaseServer } from "@/lib/config/supabase-server";

export async function GET() {
  try {
    const { count, error: countError } = await supabaseServer
      .from("Workshop")
      .select("*", { count: "exact" })
      .limit(0);

    if (countError) throw countError;

    const { data: statusData, error: statusError } = await supabaseServer
      .from("Workshop")
      .select("approval");

    if (statusError) throw statusError;

    const pending =
      statusData?.filter((workshop) => workshop.approval === "Pending")
        .length || 0;
    const approved =
      statusData?.filter((workshop) => workshop.approval === "Approved")
        .length || 0;
    const rejected =
      statusData?.filter((workshop) => workshop.approval === "Rejected")
        .length || 0;

    const stats: WorkshopStats = {
      total: count || 0,
      pending,
      approved,
      rejected,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("API Error - Workshop Stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
