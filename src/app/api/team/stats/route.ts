import { NextResponse } from "next/server";
import { fetchTeamStats } from "@/lib/services/admin/teamService";

export async function GET() {
  try {
    const result = await fetchTeamStats();

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("API Error - Team Stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
