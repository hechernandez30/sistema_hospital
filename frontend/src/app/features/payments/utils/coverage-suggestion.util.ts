import { PatientInsuranceRow } from '../models/patient-insurance.models';

/** Solo fecha local (sin huso UTC). */
function parseIsoDateLocal(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** Hoy como medianoche local */
function todayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Póliza vigente y activa a la fecha de hoy según fecha_inicio / fecha_fin (si vienen informadas). */
export function insuranceEffectiveToday(row: PatientInsuranceRow): boolean {
  if (!row.active || row.coveragePercent == null) {
    return false;
  }
  const t = todayLocal();
  if (row.startDate) {
    const s = parseIsoDateLocal(row.startDate);
    if (s != null && t < s) {
      return false;
    }
  }
  if (row.endDate) {
    const e = parseIsoDateLocal(row.endDate);
    if (e != null && t > e) {
      return false;
    }
  }
  return true;
}

/**
 * Elige el mayor porcentaje de cobertura entre pólizas efectivas (sugerencia no vinculante).
 * RN: sin seguro válido ⇒ null.
 */
export function suggestCoveragePercentFromPolicies(rows: PatientInsuranceRow[]): {
  coveragePercent: number;
  insurerHint: string;
} | null {
  const cand = rows.filter(insuranceEffectiveToday);
  if (cand.length === 0) {
    return null;
  }
  const best = cand.reduce((a, b) => (a.coveragePercent >= b.coveragePercent ? a : b));
  const hintParts = [`${best.insurerName}`, `póliza #${best.id}`].filter(Boolean);
  return { coveragePercent: best.coveragePercent, insurerHint: hintParts.join(' · ') };
}

/** Descuento por seguro (2 decimales, HALF_UP) coherente con `PaymentService`. */
export function computeInsuranceDiscount(subtotal: number, insurancePercent: number): number {
  if (!Number.isFinite(subtotal) || subtotal < 0 || !Number.isFinite(insurancePercent)) {
    return 0;
  }
  const pct = Math.min(100, Math.max(0, insurancePercent));
  if (pct <= 0) {
    return 0;
  }
  return Math.round(((subtotal * pct) / 100) * 100) / 100;
}

/**
 * Copago sugerido al aplicar % desde póliza (CU09 RN03): parte del subtotal no cubierta por el seguro.
 * Con cobertura 100 % devuelve 0 (FA02).
 */
export function suggestCopayFromCoverage(subtotal: number, insurancePercent: number): number {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return 0;
  }
  const discount = computeInsuranceDiscount(subtotal, insurancePercent);
  return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
}

/** Descuento y total coherentes con `PaymentService` (HALF_UP a 2 decimales). */
export function previewPaymentMath(subtotal: number, insurancePercent: number, copay: number): {
  discount: number;
  total: number;
} | null {
  if (!Number.isFinite(subtotal) || !Number.isFinite(insurancePercent) || !Number.isFinite(copay)) {
    return null;
  }
  const discount = insurancePercent > 0 ? computeInsuranceDiscount(subtotal, insurancePercent) : 0;
  const total = Math.round(copay * 100) / 100;
  return { discount, total };
}
