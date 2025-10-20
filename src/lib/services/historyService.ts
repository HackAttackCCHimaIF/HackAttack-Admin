import { supabaseServer } from "@/lib/config/supabase-server";
import {
  AdminActionHistoryDB,
  AdminActionHistory,
} from "@/lib/interface/history";
import { convertHistoryDBToHistory } from "@/lib/utility/typeconverter";

export class HistoryService {
  static async recordAction(
    adminEmail: string,
    action: "approve" | "reject" | "reset",
    oldStatus: string,
    newStatus: string,
    entityType: "workshop" | "team" | "member" | "submission",
    entityId: string
  ): Promise<void> {
    try {
      const { error } = await supabaseServer.from("AdminAction").insert({
        admin_email: adminEmail,
        action,
        old_status: oldStatus,
        new_status: newStatus,
        entity_type: entityType,
        entity_id: entityId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error recording admin action:", error);
      }
    } catch (error) {
      console.error("Failed to record admin action:", error);
    }
  }

  static async getEntityHistory(
    entityId: string
  ): Promise<AdminActionHistory[]> {
    try {
      const { data, error } = await supabaseServer
        .from("AdminAction")
        .select("*")
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entity history:", error);
        return [];
      }

      return (
        data?.map((item: AdminActionHistoryDB) =>
          convertHistoryDBToHistory(item)
        ) || []
      );
    } catch (error) {
      console.error("Failed to fetch entity history:", error);
      return [];
    }
  }
}
