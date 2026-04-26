import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MedicalOrderCreatePayload,
  MedicalOrderResponse,
  MedicalOrderUpdatePayload,
} from '../models/medical-order.models';

@Injectable({ providedIn: 'root' })
export class MedicalOrderApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/medical-orders`;

  list(medicalCareId?: number): Observable<MedicalOrderResponse[]> {
    let params = new HttpParams();
    if (medicalCareId != null && medicalCareId > 0) {
      params = params.set('medicalCareId', String(medicalCareId));
    }
    return this.http.get<MedicalOrderResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<MedicalOrderResponse> {
    return this.http.get<MedicalOrderResponse>(`${this.base}/${id}`);
  }

  create(body: MedicalOrderCreatePayload): Observable<MedicalOrderResponse> {
    return this.http.post<MedicalOrderResponse>(this.base, body);
  }

  update(id: number, body: MedicalOrderUpdatePayload): Observable<MedicalOrderResponse> {
    return this.http.put<MedicalOrderResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
