import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RolePayload, RoleResponse } from '../models/role.models';

@Injectable({ providedIn: 'root' })
export class RoleApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/roles`;

  list(includeInactive = false): Observable<RoleResponse[]> {
    const params = includeInactive ? new HttpParams().set('includeInactive', 'true') : undefined;
    return this.http.get<RoleResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`${this.base}/${id}`);
  }

  create(body: RolePayload): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.base, body);
  }

  update(id: number, body: RolePayload): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
