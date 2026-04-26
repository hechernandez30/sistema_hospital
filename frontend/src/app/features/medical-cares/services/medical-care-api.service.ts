import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MedicalCareCreatePayload,
  MedicalCareResponse,
  MedicalCareUpdatePayload,
} from '../models/medical-care.models';

@Injectable({ providedIn: 'root' })
export class MedicalCareApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/medical-cares`;

  list(patientId?: number): Observable<MedicalCareResponse[]> {
    let params = new HttpParams();
    if (patientId != null && patientId > 0) {
      params = params.set('patientId', String(patientId));
    }
    return this.http.get<MedicalCareResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<MedicalCareResponse> {
    return this.http.get<MedicalCareResponse>(`${this.base}/${id}`);
  }

  create(body: MedicalCareCreatePayload): Observable<MedicalCareResponse> {
    return this.http.post<MedicalCareResponse>(this.base, body);
  }

  update(id: number, body: MedicalCareUpdatePayload): Observable<MedicalCareResponse> {
    return this.http.put<MedicalCareResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
