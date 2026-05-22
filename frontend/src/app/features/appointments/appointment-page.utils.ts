import { AppointmentView } from './models/appointment.models';
import { PatientResponse } from '../patients/models/patient.models';
import { StaffResponse } from '../staff/models/staff.models';
import { SpecialtyResponse } from '../specialties/models/specialty.models';
import { UserResponse } from '../users/models/user.models';
import { EntityPickerOption } from '../shared/entity-picker.models';
import { formatPatientLabel, patientSearchBlob } from '../shared/entity-picker.utils';

/** Primer token de nombre y primer token de apellido (p. ej. «María José» + «López García» → «María López»). */
export function formatDoctorShortName(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim().split(/\s+/)[0] ?? '';
  const last = lastName?.trim().split(/\s+/)[0] ?? '';
  return `${first} ${last}`.trim();
}

/** Etiqueta médico: `EMP-0007 — Nombre Apellido`. Con `agendaHeader`, solo primer nombre y primer apellido. */
export function formatDoctorDisplayLabel(
  staff: StaffResponse | undefined,
  staffId: number,
  userById?: ReadonlyMap<number, UserResponse>,
  agendaHeader = false,
): string {
  if (!staff) {
    return `Personal #${staffId}`;
  }
  const code = staff.employeeCode?.trim() || `#${staffId}`;
  const displayName = resolveDoctorPersonName(staff, userById, agendaHeader);
  if (displayName) {
    return `${code} — ${displayName}`;
  }
  return `${code} — Médico`;
}

function resolveDoctorPersonName(
  staff: StaffResponse,
  userById: ReadonlyMap<number, UserResponse> | undefined,
  shortName: boolean,
): string | null {
  if (staff.linkedUserFirstName || staff.linkedUserLastName) {
    return shortName
      ? formatDoctorShortName(staff.linkedUserFirstName, staff.linkedUserLastName) || null
      : `${staff.linkedUserFirstName ?? ''} ${staff.linkedUserLastName ?? ''}`.trim() || null;
  }
  if (staff.userId != null) {
    const user = userById?.get(staff.userId);
    if (user) {
      return shortName
        ? formatDoctorShortName(user.firstName, user.lastName) || null
        : `${user.firstName} ${user.lastName}`.trim() || null;
    }
  }
  return null;
}

/** Opciones de paciente en formulario de cita: solo nombre completo visible; búsqueda por DPI/código conservada. */
export function buildAppointmentPatientOptions(
  patients: PatientResponse[],
  activeOnly = true,
): EntityPickerOption[] {
  return patients
    .filter((p) => !activeOnly || p.active)
    .map((p) => ({
      id: p.id,
      label: formatPatientLabel(p),
      searchText: patientSearchBlob(p),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

/** Opciones de médico en formulario de cita: `EMP-0007 — Nombre Apellido — Especialidad`. */
export function buildAppointmentDoctorOptions(
  staff: StaffResponse[],
  specialties: SpecialtyResponse[],
  activeOnly = true,
): EntityPickerOption[] {
  const specMap = new Map(specialties.map((s) => [s.id, s.name] as const));
  return staff
    .filter((s) => (!activeOnly || s.active) && s.staffType === 'MEDICO')
    .map((s) => {
      const shortName = formatDoctorShortName(s.linkedUserFirstName, s.linkedUserLastName) || 'Médico';
      const specName =
        s.specialtyId != null ? (specMap.get(s.specialtyId) ?? 'Sin especialidad') : 'Sin especialidad';
      const code = s.employeeCode?.trim() || `#${s.id}`;
      const label = `${code} — ${shortName} — ${specName}`;
      return {
        id: s.id,
        label,
        searchText: [code, shortName, specName, s.licenseNumber, String(s.id)].filter(Boolean).join(' ').toLowerCase(),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export type PageViewMode = 'agenda' | 'list';
export type AgendaRangeMode = 'day' | 'week' | 'month';

export const AGENDA_DAY_START_HOUR = 7;
export const AGENDA_DAY_END_HOUR = 20;
export const AGENDA_SLOT_MINUTES = 30;
export const AGENDA_DEFAULT_DURATION_MIN = 30;

export interface AgendaDoctorColumn {
  id: number;
  label: string;
  specialtyId: number | null;
}

export interface AgendaTimeSlot {
  label: string;
  minutesFromMidnight: number;
}

export interface AgendaLayoutBlock {
  apt: AppointmentView;
  topPct: number;
  heightPct: number;
}

export interface WeekDayColumn {
  date: Date;
  label: string;
  shortLabel: string;
  isToday: boolean;
}

export interface MonthCalendarCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  appointments: AppointmentView[];
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateInput(value: string): Date | null {
  const v = value?.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return null;
  }
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Lunes como primer día de la semana (es-GT). */
export function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const day = s.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  s.setDate(s.getDate() + diff);
  return s;
}

export function endOfWeek(d: Date): Date {
  const e = startOfWeek(d);
  e.setDate(e.getDate() + 6);
  return endOfDay(e);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

export function addWeeks(d: Date, weeks: number): Date {
  return addDays(d, weeks * 7);
}

export function addMonths(d: Date, months: number): Date {
  const n = new Date(d);
  n.setMonth(n.getMonth() + months);
  return n;
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function parseAppointmentStart(apt: AppointmentView): Date | null {
  const t = new Date(apt.startAt);
  return Number.isNaN(t.getTime()) ? null : t;
}

export function parseAppointmentEnd(apt: AppointmentView): Date | null {
  const t = new Date(apt.endAt);
  return Number.isNaN(t.getTime()) ? null : t;
}

export function appointmentInRange(apt: AppointmentView, rangeStart: Date, rangeEnd: Date): boolean {
  const start = parseAppointmentStart(apt);
  const end = parseAppointmentEnd(apt) ?? start;
  if (!start) {
    return false;
  }
  const endMs = (end ?? start).getTime();
  return start.getTime() <= rangeEnd.getTime() && endMs >= rangeStart.getTime();
}

export function getRangeForMode(anchor: Date, mode: AgendaRangeMode): { start: Date; end: Date } {
  switch (mode) {
    case 'week':
      return { start: startOfWeek(anchor), end: endOfWeek(anchor) };
    case 'month':
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    default:
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
  }
}

export function buildAgendaTimeSlots(): AgendaTimeSlot[] {
  const slots: AgendaTimeSlot[] = [];
  for (let h = AGENDA_DAY_START_HOUR; h < AGENDA_DAY_END_HOUR; h++) {
    for (let m = 0; m < 60; m += AGENDA_SLOT_MINUTES) {
      const minutesFromMidnight = h * 60 + m;
      slots.push({
        label: `${pad2(h)}:${pad2(m)}`,
        minutesFromMidnight,
      });
    }
  }
  return slots;
}

export function agendaTotalDayMinutes(): number {
  return (AGENDA_DAY_END_HOUR - AGENDA_DAY_START_HOUR) * 60;
}

export function minutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function layoutBlocksForDay(appointments: AppointmentView[], day: Date): AgendaLayoutBlock[] {
  const total = agendaTotalDayMinutes();
  const dayStartMin = AGENDA_DAY_START_HOUR * 60;
  const blocks: AgendaLayoutBlock[] = [];

  for (const apt of appointments) {
    const start = parseAppointmentStart(apt);
    const end = parseAppointmentEnd(apt);
    if (!start || !sameCalendarDay(start, day)) {
      continue;
    }
    const startMin = minutesFromMidnight(start);
    const endMin = end ? minutesFromMidnight(end) : startMin + AGENDA_DEFAULT_DURATION_MIN;
    const relStart = Math.max(0, startMin - dayStartMin);
    const relEnd = Math.min(total, Math.max(relStart + 15, endMin - dayStartMin));
    blocks.push({
      apt,
      topPct: (relStart / total) * 100,
      heightPct: Math.max(4, ((relEnd - relStart) / total) * 100),
    });
  }
  return blocks.sort((a, b) => a.topPct - b.topPct);
}

export function buildWeekDayColumns(anchor: Date): WeekDayColumn[] {
  const start = startOfWeek(anchor);
  const today = startOfDay(new Date());
  const cols: WeekDayColumn[] = [];
  const names = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    cols.push({
      date,
      label: date.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' }),
      shortLabel: names[i],
      isToday: sameCalendarDay(date, today),
    });
  }
  return cols;
}

export function buildMonthCalendar(anchor: Date, appointments: AppointmentView[]): MonthCalendarCell[] {
  const first = startOfMonth(anchor);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const gridStart = addDays(first, -startPad);
  const today = startOfDay(new Date());
  const cells: MonthCalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    const inMonth = date.getMonth() === anchor.getMonth();
    const dayApts = appointments.filter((a) => {
      const s = parseAppointmentStart(a);
      return s != null && sameCalendarDay(s, date);
    });
    cells.push({
      date,
      inMonth,
      isToday: sameCalendarDay(date, today),
      appointments: dayApts.sort((a, b) => (parseAppointmentStart(a)?.getTime() ?? 0) - (parseAppointmentStart(b)?.getTime() ?? 0)),
    });
  }
  return cells;
}

export function buildDoctorColumns(
  staff: StaffResponse[],
  doctorLabels: Map<number, string>,
  filterDoctorId: number | null,
  filterSpecialtyId: number | null,
): AgendaDoctorColumn[] {
  let doctors = staff.filter((s) => s.staffType === 'MEDICO' && s.active);
  if (filterDoctorId != null) {
    doctors = doctors.filter((d) => d.id === filterDoctorId);
  }
  if (filterSpecialtyId != null) {
    doctors = doctors.filter((d) => d.specialtyId === filterSpecialtyId);
  }
  return doctors
    .map((d) => ({
      id: d.id,
      label: doctorLabels.get(d.id) ?? `Médico #${d.id}`,
      specialtyId: d.specialtyId,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function filterAppointments(
  rows: AppointmentView[],
  opts: {
    rangeStart: Date;
    rangeEnd: Date;
    doctorId: number | null;
    specialtyId: number | null;
    status: string;
    staffById: Map<number, StaffResponse>;
  },
): AppointmentView[] {
  return rows.filter((a) => {
    if (!appointmentInRange(a, opts.rangeStart, opts.rangeEnd)) {
      return false;
    }
    if (opts.doctorId != null && a.doctorId !== opts.doctorId) {
      return false;
    }
    if (opts.status && a.status !== opts.status) {
      return false;
    }
    if (opts.specialtyId != null) {
      const docSpec = opts.staffById.get(a.doctorId)?.specialtyId ?? null;
      if (a.specialtyId !== opts.specialtyId && docSpec !== opts.specialtyId) {
        return false;
      }
    }
    return true;
  });
}

export function patientCodeFromLabel(label: string): string | null {
  const m = /\(([^)]+)\)\s*$/.exec(label);
  return m?.[1]?.trim() ?? null;
}

export function formatAgendaTimeRange(apt: AppointmentView): string {
  const s = parseAppointmentStart(apt);
  const e = parseAppointmentEnd(apt);
  if (!s) {
    return '—';
  }
  const fmt = (d: Date) => d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  return e ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}

export function slotClickDatetimeLocal(day: Date, minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  return `${toDateInputValue(d)}T${pad2(h)}:${pad2(m)}`;
}

export function rangeTitle(anchor: Date, mode: AgendaRangeMode): string {
  switch (mode) {
    case 'week': {
      const s = startOfWeek(anchor);
      const e = endOfWeek(anchor);
      return `${s.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    case 'month':
      return anchor.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });
    default:
      return anchor.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}
