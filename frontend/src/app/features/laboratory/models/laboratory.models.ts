export const LABORATORY_STATUSES = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO'] as const;

/** Valor vacío enviado como null al API */
export const LAB_REQUESTER_TYPES = ['', 'INTERNO', 'EXTERNO'] as const;
export const LAB_REQUEST_TYPES = ['', 'MUESTRA_MEDICA', 'LABORATORIO'] as const;

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
