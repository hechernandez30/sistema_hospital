import { TRIAGE_PRIORITIES } from '../models/triage.models';

export type TriagePriorityCode = (typeof TRIAGE_PRIORITIES)[number];

/** 1 = más grave (I) … 4 = menos urgente (IV). */
type SeverityLevel = 1 | 2 | 3 | 4;

const SEVERITY_TO_PRIORITY: Record<SeverityLevel, TriagePriorityCode> = {
  1: 'I_CRITICO',
  2: 'II_URGENTE',
  3: 'III_PRIORITARIO',
  4: 'IV_NO_URGENTE',
};

export interface TriageVitalsInput {
  heartRate?: number | null;
  respiratoryRate?: number | null;
  systolicPressure?: number | null;
  diastolicPressure?: number | null;
  oxygenSaturation?: number | null;
  temperature?: number | null;
  pain?: number | null;
}

/** CU10 RN03 — tiempo objetivo en minutos según categoría. */
export function targetMinutesForPriority(priority: TriagePriorityCode): number {
  switch (priority) {
    case 'I_CRITICO':
      return 0;
    case 'II_URGENTE':
      return 15;
    case 'III_PRIORITARIO':
      return 60;
    case 'IV_NO_URGENTE':
      return 120;
    default:
      return 60;
  }
}

function classifyHeartRate(hr: number): SeverityLevel {
  if (hr < 40 || hr > 150) {
    return 1;
  }
  if (hr < 50 || hr > 130) {
    return 2;
  }
  if (hr < 60 || hr > 120) {
    return 3;
  }
  return 4;
}

function classifyRespiratoryRate(rr: number): SeverityLevel {
  if (rr < 8 || rr > 35) {
    return 1;
  }
  if (rr < 10 || rr > 30) {
    return 2;
  }
  if (rr < 12 || rr > 24) {
    return 3;
  }
  return 4;
}

function classifySystolicPressure(sys: number): SeverityLevel {
  if (sys < 70 || sys > 220) {
    return 1;
  }
  if (sys < 90 || sys > 180) {
    return 2;
  }
  if (sys < 100 || sys > 160) {
    return 3;
  }
  return 4;
}

function classifyDiastolicPressure(dia: number): SeverityLevel {
  if (dia < 40 || dia > 130) {
    return 1;
  }
  if (dia < 50 || dia > 120) {
    return 2;
  }
  if (dia < 60 || dia > 110) {
    return 3;
  }
  return 4;
}

function classifyOxygenSaturation(spo2: number): SeverityLevel {
  if (spo2 < 85) {
    return 1;
  }
  if (spo2 < 90) {
    return 2;
  }
  if (spo2 < 94) {
    return 3;
  }
  return 4;
}

function classifyTemperature(temp: number): SeverityLevel {
  if (temp < 35 || temp > 41) {
    return 1;
  }
  if (temp < 36 || temp > 39.5) {
    return 2;
  }
  if (temp < 36.5 || temp > 38.5) {
    return 3;
  }
  return 4;
}

function classifyPain(pain: number): SeverityLevel {
  if (pain >= 9) {
    return 1;
  }
  if (pain >= 7) {
    return 2;
  }
  if (pain >= 4) {
    return 3;
  }
  return 4;
}

/**
 * Deriva prioridad CU10 (RN02) a partir de signos vitales informados.
 * Toma la categoría más grave entre los parámetros disponibles.
 * Sin vitales válidos devuelve null (se mantiene el valor por defecto del formulario).
 */
export function computeTriagePriorityFromVitals(
  vitals: TriageVitalsInput,
): { priority: TriagePriorityCode; targetMinutes: number } | null {
  const levels: SeverityLevel[] = [];

  if (vitals.heartRate != null && Number.isFinite(vitals.heartRate)) {
    levels.push(classifyHeartRate(vitals.heartRate));
  }
  if (vitals.respiratoryRate != null && Number.isFinite(vitals.respiratoryRate)) {
    levels.push(classifyRespiratoryRate(vitals.respiratoryRate));
  }
  if (vitals.systolicPressure != null && Number.isFinite(vitals.systolicPressure)) {
    levels.push(classifySystolicPressure(vitals.systolicPressure));
  }
  if (vitals.diastolicPressure != null && Number.isFinite(vitals.diastolicPressure)) {
    levels.push(classifyDiastolicPressure(vitals.diastolicPressure));
  }
  if (vitals.oxygenSaturation != null && Number.isFinite(vitals.oxygenSaturation)) {
    levels.push(classifyOxygenSaturation(vitals.oxygenSaturation));
  }
  if (vitals.temperature != null && Number.isFinite(vitals.temperature)) {
    levels.push(classifyTemperature(vitals.temperature));
  }
  if (vitals.pain != null && Number.isFinite(vitals.pain)) {
    levels.push(classifyPain(vitals.pain));
  }

  if (levels.length === 0) {
    return null;
  }

  const worst = Math.min(...levels) as SeverityLevel;
  const priority = SEVERITY_TO_PRIORITY[worst];
  return { priority, targetMinutes: targetMinutesForPriority(priority) };
}
