/** Respuesta de GET /api/patients/:patientId/insurances (Jackson camelCase). */
export interface PatientInsuranceRow {
  id: number;
  patientId: number;
  insurerName: string;
  policyNumber: string;
  coveragePercent: number;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}
