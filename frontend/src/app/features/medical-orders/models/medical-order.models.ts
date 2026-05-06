export const MEDICAL_ORDER_TYPES = ['LABORATORIO', 'IMAGEN', 'FARMACIA', 'HOSPITALIZACION'] as const;
export type MedicalOrderType = (typeof MEDICAL_ORDER_TYPES)[number];

/** Prioridades frecuentes (el backend acepta texto libre hasta 20 caracteres). */
export const MEDICAL_ORDER_PRIORITY_PRESETS = ['NORMAL', 'URGENTE', 'STAT', 'BAJA', 'ALTA'] as const;

export const MEDICAL_ORDER_TYPE_LABELS: Record<MedicalOrderType, string> = {
  LABORATORIO: 'Laboratorio (estudios clínicos / muestra)',
  IMAGEN: 'Imagen (radiología)',
  FARMACIA: 'Farmacia (medicamentos)',
  HOSPITALIZACION: 'Hospitalización',
};

export const MEDICAL_ORDER_STATUSES = [
  'PENDIENTE',
  'EN_PROCESO',
  'COMPLETADO',
  'RECHAZADO',
  'PARCIAL',
  'ANULADO',
] as const;
export type MedicalOrderStatus = (typeof MEDICAL_ORDER_STATUSES)[number];

export const MEDICAL_ORDER_STATUS_LABELS: Record<MedicalOrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADO: 'Completado',
  RECHAZADO: 'Rechazado',
  PARCIAL: 'Parcial',
  ANULADO: 'Anulado',
};

export function medicalOrderTypeLabel(code: string): string {
  return MEDICAL_ORDER_TYPE_LABELS[code as MedicalOrderType] ?? code;
}

export function medicalOrderStatusLabel(code: string): string {
  return MEDICAL_ORDER_STATUS_LABELS[code as MedicalOrderStatus] ?? code;
}

/** Etiqueta de prioridad conocida o el valor tal cual si es personalizado. */
export function medicalOrderPriorityLabel(priority: string | null | undefined): string {
  if (priority == null || !priority.trim()) {
    return '—';
  }
  const t = priority.trim();
  const map: Record<string, string> = {
    NORMAL: 'Normal',
    URGENTE: 'Urgente',
    STAT: 'STAT / inmediato',
    BAJA: 'Baja',
    ALTA: 'Alta',
  };
  return map[t] ?? t;
}

export interface MedicalOrderResponse {
  id: number;
  medicalCareId: number;
  orderType: string;
  description: string;
  priority: string | null;
  status: string;
  observations: string | null;
  orderDate: string | null;
}

export interface MedicalOrderCreatePayload {
  medicalCareId: number;
  orderType: string;
  description: string;
  priority: string | null;
  status: string;
  observations: string | null;
}

export interface MedicalOrderUpdatePayload {
  medicalCareId: number;
  orderType: string;
  description: string;
  priority: string;
  status: string;
  observations: string | null;
}
