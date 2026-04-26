import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdmissionCreatePayload, AdmissionResponse, AdmissionUpdatePayload } from '../models/admission.models';

@Injectable({ providedIn: 'root' })
export class AdmissionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/admissions`;

  list(): Observable<AdmissionResponse[]> {
    return this.http.get<AdmissionResponse[]>(this.base);
  }

  getById(id: number): Observable<AdmissionResponse> {
    return this.http.get<AdmissionResponse>(`${this.base}/${id}`);
  }

  create(body: AdmissionCreatePayload): Observable<AdmissionResponse> {
    return this.http.post<AdmissionResponse>(this.base, body);
  }

  update(id: number, body: AdmissionUpdatePayload): Observable<AdmissionResponse> {
    return this.http.put<AdmissionResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
