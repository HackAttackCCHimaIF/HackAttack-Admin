export interface AdminActionHistoryDB {
  id: string;
  admin_email: string;
  action: 'approve' | 'reject' | 'reset';
  old_status: string;
  new_status: string;
  entity_type: 'workshop' | 'team' | 'member' | 'submission';
  entity_id: string;
  created_at: string;
}

export interface AdminActionHistory {
  id: string;
  adminEmail: string;
  action: 'approve' | 'reject' | 'reset';
  oldStatus: string;
  newStatus: string;
  entityType: 'workshop' | 'team' | 'member' | 'submission';
  entityId: string;
  createdAt: string;
}