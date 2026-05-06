/** Contrato GET/POST/PUT anidado bajo paciente (`/api/patients/:id/insurances`). */

export interface InsuranceResponse {
  id: number;
  patientId: number;
  insurerName: string;
  policyNumber: string;
  coveragePercent: number;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}

export interface InsurancePayload {
  insurerName: string;
  policyNumber: string;
  coveragePercent: number;
  startDate: string | null;
  endDate: string | null;
  active: boolean | null;
}
