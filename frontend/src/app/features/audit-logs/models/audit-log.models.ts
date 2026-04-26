export interface AuditLogView extends AuditLogResponse {
  userLabel: string;
}

export interface AuditLogResponse {
  id: number;
  userId: number | null;
  module: string;
  entityType: string;
  recordId: string;
  action: string;
  previousData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  occurredAt: string;
  clientIp: string | null;
}
