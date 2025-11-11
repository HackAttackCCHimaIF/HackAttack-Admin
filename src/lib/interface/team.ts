import { User } from "./users";
import { TeamMember } from "./teammember";

export enum TeamApproval {
  Pending = "Pending",
  Accepted = "Accepted",
  Rejected = "Rejected",
  Submitted = "Submitted",
  Resubmitted = "Resubmitted",
}

export interface TeamDB {
  id: string;
  created_by: string;
  team_name: string;
  institution: string;
  whatsapp_number: number;
  paymentproof_url: string;
  created_at: string;
  updated_at: string;
  approvalstatus: TeamApproval;
  reject_message: string;
}

export interface Team {
  id: string;
  createdBy: string;
  teamName: string;
  institution: string;
  whatsappNumber: number;
  paymentproof_url: string;
  createdAt: string;
  updatedAt: string;
  approvalStatus: TeamApproval;
  rejectMessage: string;
}

export interface TeamStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface TeamWithDetails extends Team {
  creator: User;
  members: TeamMember[];
  memberCount: number;
}
