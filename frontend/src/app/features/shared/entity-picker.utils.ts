import {
  AdmissionResponse,
  ADMISSION_STATUS_LABELS,
  ADMISSION_TYPE_LABELS,
} from '../admissions/models/admission.models';
import { AppointmentResponse } from '../appointments/models/appointment.models';
import { MedicalCareResponse } from '../medical-cares/models/medical-care.models';
import {
  MedicalOrderResponse,
  medicalOrderStatusLabel,
  medicalOrderTypeLabel,
} from '../medical-orders/models/medical-order.models';
import { PatientResponse } from '../patients/models/patient.models';
import { StaffResponse } from '../staff/models/staff.models';
import { SpecialtyResponse } from '../specialties/models/specialty.models';
import { EntityPickerOption } from './entity-picker.models';

const CLOSED_ADMISSION = new Set(['RECHAZADO', 'ANULADO']);
const ACTIVE_APPOINTMENT = new Set(['PROGRAMADA', 'REPROGRAMADA']);

export function patientSearchBlob(p: PatientResponse): string {
  return [p.firstName, p.lastName, p.dpiNit, p.patientCode, String(p.id)]
    .join(' ')
    .toLowerCase();
}

export function formatPatientLabel(p: PatientResponse): string {
  return `${p.firstName} ${p.lastName}`;
}

export function formatPatientSublabel(p: PatientResponse): string {
  const dpi = p.dpiNit?.trim() ? `DPI ${p.dpiNit}` : 'Sin DPI';
  return `${p.patientCode} · ${dpi} · #${p.id}`;
}

export function buildPatientOptions(patients: PatientResponse[], activeOnly = true): EntityPickerOption[] {
  return patients
    .filter((p) => !activeOnly || p.active)
    .map((p) => ({
      id: p.id,
      label: formatPatientLabel(p),
      sublabel: formatPatientSublabel(p),
      searchText: patientSearchBlob(p),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function buildDoctorOptions(
  staff: StaffResponse[],
  specialties: SpecialtyResponse[],
  activeOnly = true,
): EntityPickerOption[] {
  const specMap = new Map(specialties.map((s) => [s.id, s.name] as const));
  return staff
    .filter((s) => (!activeOnly || s.active) && s.staffType === 'MEDICO')
    .map((s) => {
      const spec = s.specialtyId != null ? specMap.get(s.specialtyId) : null;
      const specPart = spec ? ` · ${spec}` : '';
      return {
        id: s.id,
        label: `${s.employeeCode} — Médico${specPart}`,
        sublabel: `Lic. ${s.licenseNumber ?? '—'} · #${s.id}`,
        searchText: [s.employeeCode, s.staffType, spec, s.licenseNumber, String(s.id)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function buildAdmissionOptions(
  admissions: AdmissionResponse[],
  patientById: Map<number, PatientResponse>,
  opts?: { excludeClosed?: boolean },
): EntityPickerOption[] {
  const excludeClosed = opts?.excludeClosed ?? false;
  return admissions
    .filter((a) => !excludeClosed || !CLOSED_ADMISSION.has(a.status?.trim().toUpperCase() ?? ''))
    .map((a) => {
      const p = patientById.get(a.patientId);
      const patientPart = p ? formatPatientLabel(p) : `Paciente #${a.patientId}`;
      const typeLbl = ADMISSION_TYPE_LABELS[a.admissionType as keyof typeof ADMISSION_TYPE_LABELS] ?? a.admissionType;
      const statusLbl = ADMISSION_STATUS_LABELS[a.status as keyof typeof ADMISSION_STATUS_LABELS] ?? a.status;
      const datePart = a.admissionDate ? formatShortDateTime(a.admissionDate) : '—';
      return {
        id: a.id,
        label: `Adm. #${a.id} — ${patientPart}`,
        sublabel: `${typeLbl} · ${statusLbl} · ${datePart}`,
        searchText: [
          String(a.id),
          patientPart,
          p?.patientCode,
          p?.dpiNit,
          a.admissionType,
          a.status,
          typeLbl,
          statusLbl,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    })
    .sort((a, b) => b.id - a.id);
}

export function buildAppointmentOptions(
  appointments: AppointmentResponse[],
  patientById: Map<number, PatientResponse>,
  staffById: Map<number, StaffResponse>,
  opts?: { patientId?: number; activeOnly?: boolean },
): EntityPickerOption[] {
  const activeOnly = opts?.activeOnly ?? true;
  const patientId = opts?.patientId;
  return appointments
    .filter((apt) => (patientId == null || apt.patientId === patientId))
    .filter((apt) => !activeOnly || ACTIVE_APPOINTMENT.has(apt.status?.trim().toUpperCase() ?? ''))
    .map((apt) => {
      const p = patientById.get(apt.patientId);
      const doc = staffById.get(apt.doctorId);
      const patientPart = p ? formatPatientLabel(p) : `Paciente #${apt.patientId}`;
      const docPart = doc ? doc.employeeCode : `Médico #${apt.doctorId}`;
      const when = formatShortDateTime(apt.startAt);
      return {
        id: apt.id,
        label: `Cita #${apt.id} — ${when}`,
        sublabel: `${patientPart} · ${docPart} · ${apt.status}`,
        searchText: [String(apt.id), patientPart, docPart, apt.status, when, p?.patientCode]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function buildMedicalCareOptions(
  cares: MedicalCareResponse[],
  patientById: Map<number, PatientResponse>,
): EntityPickerOption[] {
  return cares.map((c) => {
    const p = patientById.get(c.patientId);
    const patientPart = p ? formatPatientLabel(p) : `Paciente #${c.patientId}`;
    const when = c.careDate ? formatShortDateTime(c.careDate) : '—';
    const dx = clipText(c.diagnosis, 60);
    return {
      id: c.id,
      label: `Atención #${c.id} — ${patientPart}`,
      sublabel: `${when} · Dx: ${dx}`,
      searchText: [String(c.id), patientPart, when, dx, p?.patientCode, String(c.patientId)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    };
  }).sort((a, b) => b.id - a.id);
}

export function buildMedicalOrderOptions(
  orders: MedicalOrderResponse[],
  patientById: Map<number, PatientResponse>,
  careById: Map<number, MedicalCareResponse>,
  opts: { orderType?: string; excludeAnulled?: boolean },
): EntityPickerOption[] {
  const typeFilter = opts.orderType?.trim().toUpperCase();
  const excludeAnulled = opts.excludeAnulled ?? true;
  return orders
    .filter((o) => !typeFilter || o.orderType?.trim().toUpperCase() === typeFilter)
    .filter((o) => !excludeAnulled || o.status?.trim().toUpperCase() !== 'ANULADO')
    .map((o) => {
      const care = careById.get(o.medicalCareId);
      const p = care ? patientById.get(care.patientId) : undefined;
      const patientPart = p ? formatPatientLabel(p) : care ? `Paciente #${care.patientId}` : '—';
      const when = o.orderDate ? formatShortDateTime(o.orderDate) : '—';
      const typeLbl = medicalOrderTypeLabel(o.orderType);
      const statusLbl = medicalOrderStatusLabel(o.status);
      const desc = clipText(o.description, 50);
      return {
        id: o.id,
        label: `Orden #${o.id} — ${typeLbl}`,
        sublabel: `${patientPart} · ${statusLbl} · ${when} · ${desc}`,
        searchText: [
          String(o.id),
          o.orderType,
          typeLbl,
          statusLbl,
          patientPart,
          desc,
          p?.patientCode,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    })
    .sort((a, b) => b.id - a.id);
}

export function patientsToMap(patients: PatientResponse[]): Map<number, PatientResponse> {
  return new Map(patients.map((p) => [p.id, p] as const));
}

export function staffToMap(staff: StaffResponse[]): Map<number, StaffResponse> {
  return new Map(staff.map((s) => [s.id, s] as const));
}

function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 16);
  }
  return d.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function clipText(text: string | null | undefined, max: number): string {
  if (!text?.trim()) {
    return '—';
  }
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}
