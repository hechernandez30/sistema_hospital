import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StaffCreatePayload, StaffResponse, StaffUpdatePayload } from '../models/staff.models';

@Injectable({ providedIn: 'root' })
export class StaffApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/staff`;

  list(): Observable<StaffResponse[]> {
    return this.http.get<StaffResponse[]>(this.base);
  }

  getById(id: number): Observable<StaffResponse> {
    return this.http.get<StaffResponse>(`${this.base}/${id}`);
  }

  create(body: StaffCreatePayload): Observable<StaffResponse> {
    return this.http.post<StaffResponse>(this.base, body);
  }

  update(id: number, body: StaffUpdatePayload): Observable<StaffResponse> {
    return this.http.put<StaffResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
