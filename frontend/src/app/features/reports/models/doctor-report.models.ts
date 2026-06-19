export type DoctorReportType =
  | 'catalog'
  | 'appointments'
  | 'medical-cares'
  | 'medical-orders'
  | 'admissions'
  | 'productivity'
  | 'laboratory'
  | 'imaging';

export interface DoctorReportTypeOption {
  id: DoctorReportType;
  label: string;
  description: string;
  needsDateRange: boolean;
}

export const DOCTOR_REPORT_TYPES: DoctorReportTypeOption[] = [
  {
    id: 'catalog',
    label: 'Catálogo de médicos',
    description: 'Listado del personal médico con especialidad, colegiado, horario y asistencia.',
    needsDateRange: false,
  },
  {
    id: 'appointments',
    label: 'Citas por médico',
    description: 'Citas agendadas/atendidas filtradas por médico, especialidad, fechas y estado.',
    needsDateRange: true,
  },
  {
    id: 'medical-cares',
    label: 'Atenciones médicas',
    description: 'Episodios clínicos registrados por médico, con diagnóstico e indicador de hospitalización.',
    needsDateRange: true,
  },
  {
    id: 'medical-orders',
    label: 'Órdenes médicas',
    description: 'Órdenes emitidas por médico (laboratorio, imagen, farmacia, hospitalización).',
    needsDateRange: true,
  },
  {
    id: 'admissions',
    label: 'Admisiones vía citas',
    description: 'Ingresos hospitalarios vinculados a la cita del médico tratante.',
    needsDateRange: true,
  },
  {
    id: 'productivity',
    label: 'Productividad (resumen)',
    description: 'Conteos por médico: citas, atenciones, órdenes y admisiones en el periodo.',
    needsDateRange: true,
  },
  {
    id: 'laboratory',
    label: 'Laboratorio solicitado',
    description: 'Estudios de laboratorio originados en órdenes del médico.',
    needsDateRange: true,
  },
  {
    id: 'imaging',
    label: 'Imágenes solicitadas',
    description: 'Estudios radiológicos originados en órdenes del médico.',
    needsDateRange: true,
  },
];

export interface DoctorCatalogReportRow {
  doctorId: number;
  doctorName: string;
  employeeCode: string;
  licenseNumber: string | null;
  specialtyName: string;
  schedule: string | null;
  attendance: string | null;
  active: boolean;
  hireDate: string | null;
}

export interface DoctorAppointmentReportRow {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  specialtyName: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface DoctorMedicalCareReportRow {
  medicalCareId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  specialtyName: string;
  diagnosis: string;
  requiresHospitalization: boolean;
  careDate: string;
}

export interface DoctorMedicalOrderReportRow {
  medicalOrderId: number;
  medicalCareId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  specialtyName: string;
  orderType: string;
  status: string;
  priority: string;
  orderDate: string;
}

export interface DoctorAdmissionReportRow {
  admissionId: number;
  patientId: number;
  patientName: string;
  doctorId: number | null;
  doctorName: string;
  specialtyName: string;
  appointmentId: number | null;
  admissionType: string;
  status: string;
  admissionDate: string;
  dischargeDate: string | null;
}

export interface DoctorProductivityReportRow {
  doctorId: number;
  doctorName: string;
  specialtyName: string;
  appointmentCount: number;
  attendedAppointmentCount: number;
  medicalCareCount: number;
  medicalOrderCount: number;
  admissionCount: number;
}

export interface DoctorLaboratoryReportRow {
  laboratoryId: number;
  medicalOrderId: number;
  medicalCareId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  status: string;
  sampleReceived: boolean;
  receptionAt: string | null;
  resultAt: string | null;
}

export interface DoctorImagingReportRow {
  imagingId: number;
  medicalOrderId: number;
  medicalCareId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  studyType: string;
  status: string;
  scheduledAt: string | null;
  performedAt: string | null;
}

export type DoctorReportRow =
  | DoctorCatalogReportRow
  | DoctorAppointmentReportRow
  | DoctorMedicalCareReportRow
  | DoctorMedicalOrderReportRow
  | DoctorAdmissionReportRow
  | DoctorProductivityReportRow
  | DoctorLaboratoryReportRow
  | DoctorImagingReportRow;

export const DOCTOR_APPOINTMENT_STATUSES = [
  'PROGRAMADA',
  'REPROGRAMADA',
  'CANCELADA',
  'ATENDIDA',
  'NO_ASISTIO',
] as const;

export const DOCTOR_ADMISSION_STATUSES = [
  'PENDIENTE',
  'ADMITIDO',
  'ALTA',
  'TRANSFERIDO',
  'RECHAZADO',
  'ANULADO',
] as const;

export const DOCTOR_ADMISSION_TYPES = ['CONSULTA', 'EMERGENCIA', 'HOSPITALIZACION'] as const;

export const DOCTOR_ORDER_TYPES = ['LABORATORIO', 'IMAGEN', 'FARMACIA', 'HOSPITALIZACION'] as const;

export const DOCTOR_ORDER_STATUSES = [
  'PENDIENTE',
  'EN_PROCESO',
  'COMPLETADO',
  'RECHAZADO',
  'PARCIAL',
  'ANULADO',
] as const;

export const DOCTOR_LAB_IMAGING_STATUSES = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO', 'ANULADO'] as const;

export const DOCTOR_ATTENDANCE_TYPES = ['PRESENTE', 'AUSENTE', 'PERMISO', 'VACACIONES'] as const;
