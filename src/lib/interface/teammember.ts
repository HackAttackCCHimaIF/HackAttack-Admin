export enum RoleTeamMember {
  Hipster = "Hipster",
  Hustler = "Hustler",
  Hacker = "Hacker",
}

export enum MemberApproval {
  Pending = "Pending",
  Accepted = "Accepted",
  Rejected = "Rejected",
}

export interface TeamMemberDB {
  id: string;
  team_id: string;
  name: string;
  email: string;
  github_url: string;
  requirementLink: string;
  is_leader: boolean;
  created_at: string;
  updated_at: string;
  member_role: RoleTeamMember;
  member_approval: MemberApproval;
}

export interface TeamMember {
  id: string;
  teamId: string;
  name: string;
  email: string;
  githubUrl: string;
  requirementLink: string;
  isLeader: boolean;
  createdAt: string;
  updatedAt: string;
  memberRole: RoleTeamMember;
  memberApproval: MemberApproval;
}
