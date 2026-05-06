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

/** Etiquetas legibles (CU10) — el valor enviado a la API sigue siendo el código (I_CRITICO, …). */
export const TRIAGE_PRIORITY_LABELS: Record<(typeof TRIAGE_PRIORITIES)[number], string> = {
  I_CRITICO: 'Nivel I — Crítico (inmediatez)',
  II_URGENTE: 'Nivel II — Urgente',
  III_PRIORITARIO: 'Nivel III — Prioritario',
  IV_NO_URGENTE: 'Nivel IV — No urgente',
};

export function triagePriorityLabel(code: string): string {
  return TRIAGE_PRIORITY_LABELS[code as (typeof TRIAGE_PRIORITIES)[number]] ?? code;
}

export const TRIAGE_PRIORITY_OPTIONS = TRIAGE_PRIORITIES.map((code) => ({
  code,
  label: TRIAGE_PRIORITY_LABELS[code],
}));
