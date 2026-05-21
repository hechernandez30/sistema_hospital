export interface SpecialtyResponse {
  id: number;
  name: string;
  durationMinutes: number;
  active: boolean;
}

export interface SpecialtyPayload {
  name: string;
  durationMinutes: number;
}
