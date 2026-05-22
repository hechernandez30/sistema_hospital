export const STAFF_TYPES = [
  'MEDICO',
  'ENFERMERIA',
  'ADMINISTRATIVO',
  'LABORATORIO',
  'FARMACIA',
  'CONTABILIDAD',
  'RRHH',
] as const;

export const ATTENDANCE_TYPES = ['PRESENTE', 'AUSENTE', 'PERMISO', 'VACACIONES'] as const;

export interface StaffResponse {
  id: number;
  userId: number | null;
  specialtyId: number | null;
  staffType: string;
  employeeCode: string;
  licenseNumber: string | null;
  schedule: string | null;
  attendance: string | null;
  active: boolean;
  hireDate: string | null;
  linkedUserFirstName: string | null;
  linkedUserLastName: string | null;
}

export interface StaffCreatePayload {
  userId?: number | null;
  specialtyId?: number | null;
  staffType: string;
  employeeCode: string;
  licenseNumber?: string | null;
  schedule?: string | null;
  attendance?: string | null;
  active?: boolean | null;
  hireDate?: string | null;
}

export interface StaffUpdatePayload {
  userId?: number | null;
  specialtyId?: number | null;
  staffType: string;
  employeeCode: string;
  licenseNumber?: string | null;
  schedule?: string | null;
  attendance?: string | null;
  active: boolean;
  hireDate?: string | null;
}
