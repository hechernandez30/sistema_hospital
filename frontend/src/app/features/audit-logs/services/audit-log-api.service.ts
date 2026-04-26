import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuditLogResponse } from '../models/audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/audit-logs`;

  list(filters?: { module?: string; userId?: number }): Observable<AuditLogResponse[]> {
    let params = new HttpParams();
    const m = filters?.module?.trim();
    if (m) {
      params = params.set('module', m);
    }
    if (filters?.userId != null && filters.userId > 0) {
      params = params.set('userId', String(filters.userId));
    }
    return this.http.get<AuditLogResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(`${this.base}/${id}`);
  }
}
