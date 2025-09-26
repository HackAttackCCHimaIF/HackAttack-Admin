export enum NotificationType {
  TEAM_APPROVED = "team_approved",
  TEAM_REJECTED = "team_rejected",
  MEMBER_APPROVED = "member_approved",
  MEMBER_REJECTED = "member_rejected",
  SUBMISSION_APPROVED = "submission_approved",
  SUBMISSION_REJECTED = "submission_rejected",
  WORKSHOP_APPROVED = "workshop_approved",
  WORKSHOP_REJECTED = "workshop_rejected",
}

export interface NotificationDB {
  id: string;
  user_id: string;
  team_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  userId: string;
  teamId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationParams {
  userId: string;
  teamId?: string;
  type: NotificationType;
  title: string;
  message: string;
}
