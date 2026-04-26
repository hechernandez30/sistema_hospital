export const IMAGING_STATUSES = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO'] as const;

export interface ImagingStudyResponse {
  id: number;
  medicalOrderId: number;
  studyType: string;
  scheduledAt: string | null;
  performedAt: string | null;
  reportResult: string | null;
  resultFile: string | null;
  status: string;
  responsibleStaffId: number | null;
}

export interface ImagingStudyCreatePayload {
  medicalOrderId: number;
  studyType: string;
  scheduledAt: string | null;
  performedAt: string | null;
  reportResult: string | null;
  resultFile: string | null;
  status: string;
  responsibleStaffId: number | null;
}

export interface ImagingStudyUpdatePayload {
  studyType: string;
  scheduledAt: string | null;
  performedAt: string | null;
  reportResult: string | null;
  resultFile: string | null;
  status: string;
  responsibleStaffId: number | null;
}
