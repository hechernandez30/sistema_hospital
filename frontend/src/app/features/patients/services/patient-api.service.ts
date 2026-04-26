import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PatientCreatePayload, PatientResponse, PatientUpdatePayload } from '../models/patient.models';

@Injectable({ providedIn: 'root' })
export class PatientApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/patients`;

  list(): Observable<PatientResponse[]> {
    return this.http.get<PatientResponse[]>(this.base);
  }

  getById(id: number): Observable<PatientResponse> {
    return this.http.get<PatientResponse>(`${this.base}/${id}`);
  }

  create(body: PatientCreatePayload): Observable<PatientResponse> {
    return this.http.post<PatientResponse>(this.base, body);
  }

  update(id: number, body: PatientUpdatePayload): Observable<PatientResponse> {
    return this.http.put<PatientResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
