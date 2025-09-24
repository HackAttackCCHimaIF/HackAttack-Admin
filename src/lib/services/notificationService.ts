import { supabaseServer } from "@/lib/config/supabase-server";
import {
  CreateNotificationParams,
  NotificationType,
  Notification,
} from "@/lib/interface/notification";

import { broadcastNotification } from "@/app/api/notifications/stream/route";

export class NotificationService {
  static async createNotification(
    params: CreateNotificationParams
  ): Promise<boolean> {
    try {
      const notificationData = {
        user_id: params.userId,
        team_id: params.teamId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseServer
        .from("Notification")
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        return false;
      }

      console.log(
        `Notification created: ${params.type} for user ${params.userId}`
      );

      const notification: Notification = {
        id: data.id,
        userId: data.user_id,
        teamId: data.team_id,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: data.is_read,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      const sseSuccess = broadcastNotification(params.userId, notification);

      if (sseSuccess) {
        console.log(`✅ SSE notification sent to user ${params.userId}`);
      } else {
        console.log(`⚠️ User ${params.userId} not connected to SSE`);
      }

      return true;
    } catch (error) {
      console.error("Failed to create notification:", error);
      return false;
    }
  }

  static async createTeamApprovalNotification(
    userId: string,
    teamId: string,
    teamName: string,
    approved: boolean,
    rejectMessage?: string
  ): Promise<boolean> {
    const type = approved
      ? NotificationType.TEAM_APPROVED
      : NotificationType.TEAM_REJECTED;
    const title = approved ? "Team Approved! 🎉" : "Team Registration Rejected";
    const message = approved
      ? `Your team "${teamName}" has been approved for HackAttack! You can now proceed with the competition.`
      : `Your team "${teamName}" registration was rejected. Reason: ${rejectMessage}`;

    return this.createNotification({
      userId,
      teamId,
      type,
      title,
      message,
    });
  }

  static async createMemberApprovalNotification(
    userId: string,
    teamId: string,
    memberName: string,
    teamName: string,
    approved: boolean
  ): Promise<boolean> {
    const type = approved
      ? NotificationType.MEMBER_APPROVED
      : NotificationType.MEMBER_REJECTED;
    const title = approved ? "Team Member Approved" : "Team Member Rejected";
    const message = approved
      ? `Team member "${memberName}" has been approved for your team "${teamName}".`
      : `Team member "${memberName}" was rejected for your team "${teamName}".`;

    return this.createNotification({
      userId,
      teamId,
      type,
      title,
      message,
    });
  }

  static async createSubmissionApprovalNotification(
    userId: string,
    teamId: string,
    teamName: string,
    approved: boolean
  ): Promise<boolean> {
    const type = approved
      ? NotificationType.SUBMISSION_APPROVED
      : NotificationType.SUBMISSION_REJECTED;
    const title = approved
      ? "Submission Approved! ✅"
      : "Submission Rejected ❌";
    const message = approved
      ? `Your team "${teamName}" submission has been approved! Great work!`
      : `Your team "${teamName}" submission was rejected. Please check the requirements and resubmit.`;

    return this.createNotification({
      userId,
      teamId,
      type,
      title,
      message,
    });
  }
}
