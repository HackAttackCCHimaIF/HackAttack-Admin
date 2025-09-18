import { Team } from "./team";
import { TeamMember } from "./teammember";
export enum SubmissionStatus {
  Valid = "Valid",
  Invalid = "Invalid",
  Pending = "Pending",
}

export interface SubmissionDB {
  id: string;
  team_id: string;
  proposal_url: string;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  teamId: string;
  proposalUrl: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionWithTeam extends Submission {
  team: Team;
  teamMembers: TeamMember[];
}
