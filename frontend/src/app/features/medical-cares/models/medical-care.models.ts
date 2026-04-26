export interface MedicalCareView extends MedicalCareResponse {
  patientLabel: string;
  doctorLabel: string;
}

export interface MedicalCareResponse {
  id: number;
  patientId: number;
  admissionId: number | null;
  appointmentId: number | null;
  doctorId: number;
  consultationReason: string;
  clinicalEvaluation: string;
  diagnosis: string;
  treatmentPlan: string | null;
  requiresHospitalization: boolean;
  careDate: string | null;
}

export interface MedicalCareCreatePayload {
  patientId: number;
  admissionId: number | null;
  appointmentId: number | null;
  doctorId: number;
  consultationReason: string;
  clinicalEvaluation: string;
  diagnosis: string;
  treatmentPlan: string | null;
  requiresHospitalization: boolean | null;
}

export interface MedicalCareUpdatePayload {
  patientId: number;
  admissionId: number | null;
  appointmentId: number | null;
  doctorId: number;
  consultationReason: string;
  clinicalEvaluation: string;
  diagnosis: string;
  treatmentPlan: string | null;
  requiresHospitalization: boolean;
}
