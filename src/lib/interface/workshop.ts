export enum WorkshopApproval {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
}

export enum WorkshopType {
  Workshop1 = "workshop1",
  Workshop2 = "workshop2",
}

export enum InstitutionType {
  TelkomUniversity = "telkom",
  Other = "other",
}

export interface WorkshopDB {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  institution: InstitutionType;
  whatsapp_number: string;
  workshop: WorkshopType;
  payment_proof_link: string;
  approval: WorkshopApproval;
  rejection_message: string;
}

export interface Workshop {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  institution: InstitutionType;
  whatsappNumber: string;
  workshop: WorkshopType;
  paymentProofLink: string;
  approval: WorkshopApproval;
  rejectionMessage: string;
}

export interface WorkshopStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
