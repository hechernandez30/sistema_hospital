/** Fila o detalle enriquecido en cliente (etiquetas legibles). */
export interface AppointmentView extends AppointmentResponse {
  patientLabel: string;
  doctorLabel: string;
  specialtyLabel: string;
}

export interface AppointmentResponse {
  id: number;
  patientId: number;
  doctorId: number;
  specialtyId: number | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  status: string;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWhatsapp: boolean;
  createdByUserId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AppointmentCreatePayload {
  patientId: number;
  doctorId: number;
  specialtyId: number | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  status: string;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWhatsapp: boolean;
  createdByUserId: number | null;
}

export interface AppointmentUpdatePayload {
  patientId: number;
  doctorId: number;
  specialtyId: number | null;
  startAt: string;
  endAt: string;
  reason: string | null;
  status: string;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWhatsapp: boolean;
  createdByUserId: number | null;
}

export const APPOINTMENT_STATUSES = [
  'PROGRAMADA',
  'REPROGRAMADA',
  'CANCELADA',
  'ATENDIDA',
  'NO_ASISTIO',
] as const;
