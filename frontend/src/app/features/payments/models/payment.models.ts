export const PAYMENT_STATUSES = ['PENDIENTE', 'PAGADO', 'ANULADO'] as const;

export const PAYMENT_METHOD_OPTIONS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] as const;

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
