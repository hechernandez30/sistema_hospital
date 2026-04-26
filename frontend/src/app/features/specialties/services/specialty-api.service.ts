import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpecialtyPayload, SpecialtyResponse } from '../models/specialty.models';

@Injectable({ providedIn: 'root' })
export class SpecialtyApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/specialties`;

  list(): Observable<SpecialtyResponse[]> {
    return this.http.get<SpecialtyResponse[]>(this.base);
  }

  getById(id: number): Observable<SpecialtyResponse> {
    return this.http.get<SpecialtyResponse>(`${this.base}/${id}`);
  }

  create(body: SpecialtyPayload): Observable<SpecialtyResponse> {
    return this.http.post<SpecialtyResponse>(this.base, body);
  }

  update(id: number, body: SpecialtyPayload): Observable<SpecialtyResponse> {
    return this.http.put<SpecialtyResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
