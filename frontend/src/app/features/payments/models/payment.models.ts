export const PAYMENT_STATUSES = ['PENDIENTE', 'PAGADO', 'ANULADO'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ANULADO: 'Anulado',
};

export const PAYMENT_METHOD_OPTIONS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] as const;

export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHOD_OPTIONS)[number], string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
};

export function paymentStatusLabel(code: string): string {
  return PAYMENT_STATUS_LABELS[code as PaymentStatus] ?? code;
}

export function paymentMethodLabel(method: string | null | undefined): string {
  if (method == null || !method.trim()) {
    return '—';
  }
  const m = method.trim().toUpperCase();
  return PAYMENT_METHOD_LABELS[m as keyof typeof PAYMENT_METHOD_LABELS] ?? method;
}

export interface PaymentView extends PaymentResponse {
  patientLabel: string;
}

export interface PaymentResponse {
  id: number;
  patientId: number;
  admissionId: number | null;
  medicalOrderId: number | null;
  concept: string;
  subtotal: number;
  insurancePercent: number;
  insuranceDiscount: number;
  copay: number;
  totalToPay: number;
  paymentMethod: string | null;
  status: string;
  receiptNumber: string | null;
  paidAt: string | null;
  registeredByUserId: number | null;
}

export interface PaymentCreatePayload {
  patientId: number;
  admissionId: number | null;
  medicalOrderId: number | null;
  concept: string;
  subtotal: number;
  insurancePercent: number;
  copay: number;
  paymentMethod: string | null;
  status: string;
  receiptNumber: string | null;
  registeredByUserId: number | null;
}

export type PaymentUpdatePayload = PaymentCreatePayload;
