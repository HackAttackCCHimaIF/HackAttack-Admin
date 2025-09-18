import { supabaseServer } from "@/lib/config/supabase-server";
import { TeamStats } from "@/lib/types/team";
import Response from "@/lib/types/response";

export async function fetchTeamStats(): Promise<Response<TeamStats>> {
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
      accepted,
      rejected,
    };

    return {
      success: true,
      message: "Team statistics fetched successfully",
      data: stats,
    };
  } catch (error) {
    console.error("Error fetching team stats:", error);
    return {
      success: false,
      message: "Failed to fetch team statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
