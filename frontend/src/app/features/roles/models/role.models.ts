export interface RoleResponse {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

export interface RolePayload {
  name: string;
  description: string | null;
}
