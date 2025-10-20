import { TeamDB, Team } from "@/lib/interface/team";
import { UserDB, User } from "@/lib/interface/users";
import { TeamMemberDB, TeamMember } from "@/lib/interface/teammember";
import { WorkshopDB, Workshop } from "@/lib/interface/workshop";
import { AdminActionHistoryDB, AdminActionHistory } from "@/lib/interface/history";

export function convertUserDBToUser(userDB: UserDB): User {
  return {
    id: userDB.id,
    email: userDB.email,
    username: userDB.username,
    role: userDB.role,
    onboarded: userDB.onboarded,
    createdAt: userDB.created_at,
    updatedAt: userDB.updated_at,
  };
}

export function convertTeamDBToTeam(teamDB: TeamDB): Team {
  return {
    id: teamDB.id,
    createdBy: teamDB.created_by,
    teamName: teamDB.team_name,
    institution: teamDB.institution,
    whatsappNumber: teamDB.whatsapp_number,
    paymentProofUrl: teamDB.paymentproof_url,
    createdAt: teamDB.created_at,
    updatedAt: teamDB.updated_at,
    approvalStatus: teamDB.approvalstatus,
    rejectMessage: teamDB.reject_message,
  };
}

export function convertTeamMemberDBToTeamMember(
  memberDB: TeamMemberDB
): TeamMember {
  return {
    id: memberDB.id,
    teamId: memberDB.team_id,
    name: memberDB.name,
    email: memberDB.email,
    githubUrl: memberDB.github_url,
    dataUrl: memberDB.data_url,
    isLeader: memberDB.is_leader,
    createdAt: memberDB.created_at,
    updatedAt: memberDB.updated_at,
    memberRole: memberDB.member_role,
    memberApproval: memberDB.member_approval,
  };
}

export function convertWorkshopDBToWorkshop(workshopDB: WorkshopDB): Workshop {
  return {
    id: workshopDB.id,
    createdAt: workshopDB.created_at,
    fullName: workshopDB.full_name,
    email: workshopDB.email,
    institution: workshopDB.institution,
    whatsappNumber: workshopDB.whatsapp_number,
    workshop: workshopDB.workshop,
    paymentProofLink: workshopDB.payment_proof_link,
    approval: workshopDB.approval,
    rejectionMessage: workshopDB.rejection_message,
  };
}

export function convertHistoryDBToHistory(historyDB: AdminActionHistoryDB): AdminActionHistory {
  return {
    id: historyDB.id,
    adminEmail: historyDB.admin_email,
    action: historyDB.action,
    oldStatus: historyDB.old_status,
    newStatus: historyDB.new_status,
    entityType: historyDB.entity_type,
    entityId: historyDB.entity_id,
    createdAt: historyDB.created_at,
  };
}
