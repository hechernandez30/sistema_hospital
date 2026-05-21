/** Fila lista con etiqueta paciente / detalle enriquecido. */
export type AdmissionDetailData = AdmissionResponse & { patientLabel?: string };

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
export const ADMISSION_STATUSES = ['PENDIENTE', 'ADMITIDO', 'ALTA', 'TRANSFERIDO', 'RECHAZADO', 'ANULADO'] as const;
export const VALIDATION_SOURCES = ['SEGURO', 'PAGO_SITIO'] as const;

/** Etiquetas UI (valores backend sin cambiar). */
export const ADMISSION_TYPE_LABELS: Record<(typeof ADMISSION_TYPES)[number], string> = {
  CONSULTA: 'Consulta externa',
  EMERGENCIA: 'Emergencia',
  HOSPITALIZACION: 'Hospitalización',
};

export const ADMISSION_STATUS_LABELS: Record<(typeof ADMISSION_STATUSES)[number], string> = {
  PENDIENTE: 'Pendiente',
  ADMITIDO: 'Admitido',
  ALTA: 'Alta',
  TRANSFERIDO: 'Transferido',
  RECHAZADO: 'Rechazado',
  ANULADO: 'Anulado',
};

export const VALIDATION_SOURCE_LABELS: Record<(typeof VALIDATION_SOURCES)[number], string> = {
  SEGURO: 'Seguro — póliza vigente verificada',
  PAGO_SITIO: 'Pago en sitio / garantía administrativa registrada',
};
