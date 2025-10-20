import { NextRequest, NextResponse } from "next/server";
import { HistoryService } from "@/lib/services/historyService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;

    if (!entityId) {
      return NextResponse.json(
        { error: "Entity ID is required" },
        { status: 400 }
      );
    }

    const history = await HistoryService.getEntityHistory(entityId);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
