import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TriageCreatePayload, TriageResponse, TriageUpdatePayload } from '../models/triage.models';

@Injectable({ providedIn: 'root' })
export class TriageApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/triage`;

  list(admissionId?: number | null): Observable<TriageResponse[]> {
    let params = new HttpParams();
    if (admissionId != null && admissionId > 0) {
      params = params.set('admissionId', String(admissionId));
    }
    return this.http.get<TriageResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<TriageResponse> {
    return this.http.get<TriageResponse>(`${this.base}/${id}`);
  }

  create(body: TriageCreatePayload): Observable<TriageResponse> {
    return this.http.post<TriageResponse>(this.base, body);
  }

  update(id: number, body: TriageUpdatePayload): Observable<TriageResponse> {
    return this.http.put<TriageResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
