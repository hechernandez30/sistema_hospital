import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MedicationPayload, MedicationResponse } from '../models/medication.models';

@Injectable({ providedIn: 'root' })
export class MedicationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/medications`;

  list(includeInactive = false): Observable<MedicationResponse[]> {
    let params = new HttpParams();
    if (includeInactive) {
      params = params.set('includeInactive', 'true');
    }
    return this.http.get<MedicationResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<MedicationResponse> {
    return this.http.get<MedicationResponse>(`${this.base}/${id}`);
  }

  create(body: MedicationPayload): Observable<MedicationResponse> {
    return this.http.post<MedicationResponse>(this.base, body);
  }

  update(id: number, body: MedicationPayload): Observable<MedicationResponse> {
    return this.http.put<MedicationResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
