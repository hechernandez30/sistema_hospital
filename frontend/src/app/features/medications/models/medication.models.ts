export interface MedicationResponse {
  id: number;
  name: string;
  presentation: string | null;
  unit: string | null;
  currentStock: number;
  minimumStock: number;
  active: boolean;
}

export interface MedicationPayload {
  name: string;
  presentation: string | null;
  unit: string | null;
  currentStock: number;
  minimumStock: number;
  active: boolean | null;
}
