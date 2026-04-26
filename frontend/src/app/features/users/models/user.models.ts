export const USER_STATES = ['ACTIVO', 'BLOQUEADO', 'DESHABILITADO'] as const;
export type UserState = (typeof USER_STATES)[number];

export interface UserResponse {
  id: number;
  roleId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  state: string;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreatePayload {
  roleId: number;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mfaEnabled?: boolean;
}

/** Cuerpo PUT: no incluir `password` si no se desea cambiar. */
export interface UserUpdatePayload {
  roleId: number;
  email: string;
  firstName: string;
  lastName: string;
  state: string;
  password?: string;
}
