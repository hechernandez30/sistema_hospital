import {
  DoctorAdmissionReportRow,
  DoctorAppointmentReportRow,
  DoctorCatalogReportRow,
  DoctorImagingReportRow,
  DoctorLaboratoryReportRow,
  DoctorMedicalCareReportRow,
  DoctorMedicalOrderReportRow,
  DoctorProductivityReportRow,
  DoctorReportType,
} from '../models/doctor-report.models';
import { formatReportDateTime, ReportExportColumn } from './report-export.utils';

export const DOCTOR_CATALOG_COLUMNS: ReportExportColumn<DoctorCatalogReportRow>[] = [
  { header: 'ID', cell: (r) => String(r.doctorId) },
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Código', cell: (r) => r.employeeCode },
  { header: 'Colegiado', cell: (r) => r.licenseNumber ?? '—' },
  { header: 'Especialidad', cell: (r) => r.specialtyName },
  { header: 'Horario', cell: (r) => r.schedule ?? '—' },
  { header: 'Asistencia', cell: (r) => r.attendance ?? '—' },
  { header: 'Activo', cell: (r) => (r.active ? 'Sí' : 'No') },
  { header: 'Contratación', cell: (r) => r.hireDate ?? '—' },
];

export const DOCTOR_APPOINTMENT_COLUMNS: ReportExportColumn<DoctorAppointmentReportRow>[] = [
  { header: 'Cita', cell: (r) => String(r.appointmentId) },
  { header: 'Paciente', cell: (r) => r.patientName },
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Especialidad', cell: (r) => r.specialtyName },
  { header: 'Inicio', cell: (r) => formatReportDateTime(r.startAt) },
  { header: 'Fin', cell: (r) => formatReportDateTime(r.endAt) },
  { header: 'Estado', cell: (r) => r.status },
];

export const DOCTOR_MEDICAL_CARE_COLUMNS: ReportExportColumn<DoctorMedicalCareReportRow>[] = [
  { header: 'Atención', cell: (r) => String(r.medicalCareId) },
  { header: 'Paciente', cell: (r) => r.patientName },
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Diagnóstico', cell: (r) => r.diagnosis },
  { header: 'Hospitalización', cell: (r) => (r.requiresHospitalization ? 'Sí' : 'No') },
  { header: 'Fecha', cell: (r) => formatReportDateTime(r.careDate) },
];

export const DOCTOR_MEDICAL_ORDER_COLUMNS: ReportExportColumn<DoctorMedicalOrderReportRow>[] = [
  { header: 'Orden', cell: (r) => String(r.medicalOrderId) },
  { header: 'Paciente', cell: (r) => r.patientName },
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Tipo', cell: (r) => r.orderType },
  { header: 'Prioridad', cell: (r) => r.priority },
  { header: 'Estado', cell: (r) => r.status },
  { header: 'Fecha', cell: (r) => formatReportDateTime(r.orderDate) },
];

export const DOCTOR_ADMISSION_COLUMNS: ReportExportColumn<DoctorAdmissionReportRow>[] = [
  { header: 'Admisión', cell: (r) => String(r.admissionId) },
  { header: 'Paciente', cell: (r) => r.patientName },
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Cita', cell: (r) => (r.appointmentId != null ? String(r.appointmentId) : '—') },
  { header: 'Tipo', cell: (r) => r.admissionType },
  { header: 'Ingreso', cell: (r) => formatReportDateTime(r.admissionDate) },
  { header: 'Estado', cell: (r) => r.status },
];

export const DOCTOR_PRODUCTIVITY_COLUMNS: ReportExportColumn<DoctorProductivityReportRow>[] = [
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Especialidad', cell: (r) => r.specialtyName },
  { header: 'Citas', cell: (r) => String(r.appointmentCount) },
  { header: 'Atendidas', cell: (r) => String(r.attendedAppointmentCount) },
  { header: 'Atenciones', cell: (r) => String(r.medicalCareCount) },
  { header: 'Órdenes', cell: (r) => String(r.medicalOrderCount) },
  { header: 'Admisiones', cell: (r) => String(r.admissionCount) },
];

export const DOCTOR_LABORATORY_COLUMNS: ReportExportColumn<DoctorLaboratoryReportRow>[] = [
  { header: 'Lab', cell: (r) => String(r.laboratoryId) },
  { header: 'Orden', cell: (r) => String(r.medicalOrderId) },
  { header: 'Paciente', cell: (r) => r.patientName },
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Estado', cell: (r) => r.status },
  { header: 'Muestra', cell: (r) => (r.sampleReceived ? 'Recibida' : 'Pendiente') },
  { header: 'Resultado', cell: (r) => formatReportDateTime(r.resultAt) },
];

export const DOCTOR_IMAGING_COLUMNS: ReportExportColumn<DoctorImagingReportRow>[] = [
  { header: 'Imagen', cell: (r) => String(r.imagingId) },
  { header: 'Orden', cell: (r) => String(r.medicalOrderId) },
  { header: 'Paciente', cell: (r) => r.patientName },
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Estudio', cell: (r) => r.studyType },
  { header: 'Estado', cell: (r) => r.status },
  { header: 'Realizado', cell: (r) => formatReportDateTime(r.performedAt) },
];

export function doctorReportExportTitle(type: DoctorReportType): string {
  switch (type) {
    case 'catalog':
      return 'Catálogo de médicos';
    case 'appointments':
      return 'Citas por médico';
    case 'medical-cares':
      return 'Atenciones médicas por médico';
    case 'medical-orders':
      return 'Órdenes médicas por médico';
    case 'admissions':
      return 'Admisiones por médico';
    case 'productivity':
      return 'Productividad médica';
    case 'laboratory':
      return 'Laboratorio solicitado por médico';
    case 'imaging':
      return 'Imágenes solicitadas por médico';
  }
}

export function doctorReportFileName(type: DoctorReportType): string {
  return `reporte_medicos_${type}`;
}

export function doctorReportColumns(type: DoctorReportType): ReportExportColumn<unknown>[] {
  switch (type) {
    case 'catalog':
      return DOCTOR_CATALOG_COLUMNS as ReportExportColumn<unknown>[];
    case 'appointments':
      return DOCTOR_APPOINTMENT_COLUMNS as ReportExportColumn<unknown>[];
    case 'medical-cares':
      return DOCTOR_MEDICAL_CARE_COLUMNS as ReportExportColumn<unknown>[];
    case 'medical-orders':
      return DOCTOR_MEDICAL_ORDER_COLUMNS as ReportExportColumn<unknown>[];
    case 'admissions':
      return DOCTOR_ADMISSION_COLUMNS as ReportExportColumn<unknown>[];
    case 'productivity':
      return DOCTOR_PRODUCTIVITY_COLUMNS as ReportExportColumn<unknown>[];
    case 'laboratory':
      return DOCTOR_LABORATORY_COLUMNS as ReportExportColumn<unknown>[];
    case 'imaging':
      return DOCTOR_IMAGING_COLUMNS as ReportExportColumn<unknown>[];
  }
}
