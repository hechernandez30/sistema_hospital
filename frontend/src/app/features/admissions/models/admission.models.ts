export interface AdmissionResponse {
  id: number;
  patientId: number;
  appointmentId: number | null;
  admissionType: string;
  status: string;
  currentArea: string | null;
  room: string | null;
  financialValidationOk: boolean;
  validationSource: string | null;
  observations: string | null;
  admissionDate: string | null;
  dischargeDate: string | null;
  transferredArea: string | null;
  admittedByUserId: number | null;
}

export interface AdmissionCreatePayload {
  patientId: number;
  appointmentId: number | null;
  admissionType: string;
  status: string | null;
  currentArea: string | null;
  room: string | null;
  financialValidationOk: boolean | null;
  validationSource: string | null;
  observations: string | null;
  dischargeDate: string | null;
  transferredArea: string | null;
  admittedByUserId: number | null;
}

export interface AdmissionUpdatePayload {
  patientId: number;
  appointmentId: number | null;
  admissionType: string;
  status: string;
  currentArea: string | null;
  room: string | null;
  financialValidationOk: boolean;
  validationSource: string | null;
  observations: string | null;
  dischargeDate: string | null;
  transferredArea: string | null;
  admittedByUserId: number | null;
}

export const ADMISSION_TYPES = ['CONSULTA', 'EMERGENCIA', 'HOSPITALIZACION'] as const;
export const ADMISSION_STATUSES = ['PENDIENTE', 'ADMITIDO', 'ALTA', 'TRANSFERIDO', 'RECHAZADO'] as const;
export const VALIDATION_SOURCES = ['SEGURO', 'PAGO_SITIO'] as const;
