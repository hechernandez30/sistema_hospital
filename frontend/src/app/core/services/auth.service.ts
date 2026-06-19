import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { STORAGE_ACCESS_TOKEN, STORAGE_USER_ID, STORAGE_USERNAME } from '../constants/storage-keys';
import { LoginResponse } from '../models/login-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(username: string, password: string): Observable<LoginResponse> {
    const url = `${environment.apiUrl}/api/auth/login`;
    return this.http.post<LoginResponse>(url, { username, password }).pipe(
      tap((res) => {
        sessionStorage.setItem(STORAGE_ACCESS_TOKEN, res.accessToken);
        sessionStorage.setItem(STORAGE_USERNAME, res.username);
        sessionStorage.setItem(STORAGE_USER_ID, String(res.userId));
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_USERNAME);
    sessionStorage.removeItem(STORAGE_USER_ID);
    void this.router.navigate(['/p/acceso']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(STORAGE_ACCESS_TOKEN);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const exp = this.getTokenExpiration(token);
    if (exp == null) {
      return true;
    }
    return Date.now() < exp * 1000;
  }

  getRoles(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }
    const payload = this.decodePayload(token);
    const roles = payload['roles'];
    return Array.isArray(roles) ? (roles as string[]) : [];
  }

  getUsername(): string | null {
    return sessionStorage.getItem(STORAGE_USERNAME);
  }

  getUserId(): number | null {
    const raw = sessionStorage.getItem(STORAGE_USER_ID);
    if (!raw) {
      return null;
    }
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  hasAnyRole(allowed: readonly string[]): boolean {
    const roles = this.getRoles();
    return allowed.some((r) => roles.includes(r));
  }

  private decodePayload(token: string): Record<string, unknown> {
    try {
      const part = token.split('.')[1];
      if (!part) {
        return {};
      }
      const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private getTokenExpiration(token: string): number | null {
    const payload = this.decodePayload(token);
    const exp = payload['exp'];
    return typeof exp === 'number' ? exp : null;
  }
}
