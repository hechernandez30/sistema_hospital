import {
  AdmissionReportRow,
  AppointmentReportRow,
  LaboratoryReportRow,
  MedicationLowStockRow,
  PaymentReportRow,
} from '../models/report.models';
import { formatReportDateTime, formatReportDecimal, ReportExportColumn } from './report-export.utils';

export const APPOINTMENT_REPORT_COLUMNS: ReportExportColumn<AppointmentReportRow>[] = [
  { header: 'ID', cell: (r) => String(r.appointmentId) },
  { header: 'Paciente', cell: (r) => r.patientName },
  { header: 'Médico', cell: (r) => r.doctorName },
  { header: 'Inicio', cell: (r) => formatReportDateTime(r.startAt) },
  { header: 'Estado', cell: (r) => r.status },
];

export const ADMISSION_REPORT_COLUMNS: ReportExportColumn<AdmissionReportRow>[] = [
  { header: 'ID', cell: (r) => String(r.admissionId) },
  { header: 'Paciente', cell: (r) => r.patientName },
  { header: 'Tipo', cell: (r) => r.admissionType },
  { header: 'Ingreso', cell: (r) => formatReportDateTime(r.admissionDate) },
  { header: 'Estado', cell: (r) => r.status },
];

export const PAYMENT_REPORT_COLUMNS: ReportExportColumn<PaymentReportRow>[] = [
  { header: 'ID', cell: (r) => String(r.paymentId) },
  { header: 'Paciente', cell: (r) => String(r.patientId) },
  { header: 'Total', cell: (r) => formatReportDecimal(r.totalToPay) },
  { header: 'Estado', cell: (r) => r.status },
  { header: 'Fecha', cell: (r) => formatReportDateTime(r.paidAt) },
];

export const LOW_STOCK_REPORT_COLUMNS: ReportExportColumn<MedicationLowStockRow>[] = [
  { header: 'ID', cell: (r) => String(r.medicationId) },
  { header: 'Nombre', cell: (r) => r.name },
  { header: 'Stock', cell: (r) => String(r.currentStock) },
  { header: 'Mínimo', cell: (r) => String(r.minimumStock) },
  { header: 'Activo', cell: (r) => (r.active ? 'Sí' : 'No') },
];

export const LABORATORY_REPORT_COLUMNS: ReportExportColumn<LaboratoryReportRow>[] = [
  { header: 'ID', cell: (r) => String(r.laboratoryId) },
  { header: 'Orden', cell: (r) => String(r.medicalOrderId) },
  { header: 'Estado', cell: (r) => r.status },
  { header: 'Muestra', cell: (r) => (r.sampleReceived ? 'Recibida' : 'Pendiente') },
];
