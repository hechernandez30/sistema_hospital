export interface TriageResponse {
  id: number;
  admissionId: number;
  heartRate: number | null;
  respiratoryRate: number | null;
  systolicPressure: number | null;
  diastolicPressure: number | null;
  oxygenSaturation: string | null;
  temperature: string | null;
  pain: number | null;
  symptoms: string | null;
  priority: string;
  targetMinutes: number | null;
  responsibleStaffId: number | null;
  registeredAt: string | null;
}

export interface TriageCreatePayload {
  admissionId: number;
  heartRate: number | null;
  respiratoryRate: number | null;
  systolicPressure: number | null;
  diastolicPressure: number | null;
  oxygenSaturation: string | null;
  temperature: string | null;
  pain: number | null;
  symptoms: string | null;
  priority: string;
  targetMinutes: number | null;
  responsibleStaffId: number | null;
}

export interface TriageUpdatePayload {
  admissionId: number;
  heartRate: number | null;
  respiratoryRate: number | null;
  systolicPressure: number | null;
  diastolicPressure: number | null;
  oxygenSaturation: string | null;
  temperature: string | null;
  pain: number | null;
  symptoms: string | null;
  priority: string;
  targetMinutes: number | null;
  responsibleStaffId: number | null;
}

export const TRIAGE_PRIORITIES = [
  'I_CRITICO',
  'II_URGENTE',
  'III_PRIORITARIO',
  'IV_NO_URGENTE',
] as const;
