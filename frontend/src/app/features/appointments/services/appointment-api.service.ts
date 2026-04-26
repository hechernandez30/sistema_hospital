import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppointmentCreatePayload, AppointmentResponse, AppointmentUpdatePayload } from '../models/appointment.models';

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/appointments`;

  list(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(this.base);
  }

  getById(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.base}/${id}`);
  }

  create(body: AppointmentCreatePayload): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.base, body);
  }

  update(id: number, body: AppointmentUpdatePayload): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
