export const LABORATORY_STATUSES = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO'] as const;
export type LaboratoryStatus = (typeof LABORATORY_STATUSES)[number];

export const LABORATORY_STATUS_LABELS: Record<LaboratoryStatus, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
  RECHAZADO: 'Rechazado',
};

export function laboratoryStatusLabel(code: string): string {
  return LABORATORY_STATUS_LABELS[code as LaboratoryStatus] ?? code;
}

/** Valor vacío enviado como null al API */
export const LAB_REQUESTER_TYPES = ['', 'INTERNO', 'EXTERNO'] as const;
export const LAB_REQUEST_TYPES = ['', 'MUESTRA_MEDICA', 'LABORATORIO'] as const;

export const LAB_REQUESTER_LABELS: Record<'INTERNO' | 'EXTERNO', string> = {
  INTERNO: 'Solicitante interno (hospital)',
  EXTERNO: 'Solicitante externo',
};

export const LAB_REQUEST_TYPE_LABELS: Record<'MUESTRA_MEDICA' | 'LABORATORIO', string> = {
  MUESTRA_MEDICA: 'Muestra médica (CU06)',
  LABORATORIO: 'Solicitud de laboratorio clínico',
};

export interface LaboratoryResponse {
  id: number;
  medicalOrderId: number;
  requesterType: string | null;
  requestType: string | null;
  recordNumber: string | null;
  sampleDescription: string | null;
  sampleReceived: boolean;
  sampleValid: boolean | null;
  incident: string | null;
  result: string | null;
  attachment: string | null;
  status: string;
  receptionAt: string | null;
  resultAt: string | null;
  responsibleStaffId: number | null;
}

export interface LaboratoryCreatePayload {
  medicalOrderId: number;
  requesterType: string | null;
  requestType: string | null;
  recordNumber: string | null;
  sampleDescription: string | null;
  sampleReceived: boolean | null;
  sampleValid: boolean | null;
  incident: string | null;
  result: string | null;
  attachment: string | null;
  status: string;
  responsibleStaffId: number | null;
}

export interface LaboratoryUpdatePayload {
  requesterType: string | null;
  requestType: string | null;
  recordNumber: string | null;
  sampleDescription: string | null;
  sampleReceived: boolean;
  sampleValid: boolean | null;
  incident: string | null;
  result: string | null;
  attachment: string | null;
  status: string;
  receptionAt: string | null;
  resultAt: string | null;
  responsibleStaffId: number | null;
}
