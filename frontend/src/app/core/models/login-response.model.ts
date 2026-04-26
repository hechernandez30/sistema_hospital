export interface LoginResponse {
  userId: number;
  username: string;
  roles: string[];
  accessToken: string;
}
