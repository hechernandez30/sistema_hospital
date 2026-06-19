export interface AppointmentReportRow {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface AdmissionReportRow {
  admissionId: number;
  patientId: number;
  patientName: string;
  admissionType: string;
  status: string;
  admissionDate: string;
  dischargeDate: string | null;
}

export interface PaymentReportRow {
  paymentId: number;
  patientId: number;
  status: string;
  paymentMethod: string | null;
  totalToPay: number;
  paidAt: string | null;
}

export interface MedicationLowStockRow {
  medicationId: number;
  name: string;
  currentStock: number;
  minimumStock: number;
  active: boolean;
}

export interface LaboratoryReportRow {
  laboratoryId: number;
  medicalOrderId: number;
  status: string;
  sampleReceived: boolean;
  receptionAt: string | null;
  resultAt: string | null;
}
