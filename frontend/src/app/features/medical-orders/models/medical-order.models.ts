export const MEDICAL_ORDER_TYPES = ['LABORATORIO', 'IMAGEN', 'FARMACIA', 'HOSPITALIZACION'] as const;
export type MedicalOrderType = (typeof MEDICAL_ORDER_TYPES)[number];

export const MEDICAL_ORDER_STATUSES = [
  'PENDIENTE',
  'EN_PROCESO',
  'COMPLETADO',
  'RECHAZADO',
  'PARCIAL',
  'ANULADO',
] as const;
export type MedicalOrderStatus = (typeof MEDICAL_ORDER_STATUSES)[number];

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
