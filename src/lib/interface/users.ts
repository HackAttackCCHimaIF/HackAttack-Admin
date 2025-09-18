export enum RoleUser {
  Admin = "Admin",
  TeamLeader = "TeamLeader",
}

export interface UserDB {
  id: string;
  email: string;
  username: string;
  role: RoleUser;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: RoleUser;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}
