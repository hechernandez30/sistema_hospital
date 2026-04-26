import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaymentCreatePayload, PaymentResponse, PaymentUpdatePayload } from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/payments`;

  list(patientId?: number): Observable<PaymentResponse[]> {
    let params = new HttpParams();
    if (patientId != null && patientId > 0) {
      params = params.set('patientId', String(patientId));
    }
    return this.http.get<PaymentResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.base}/${id}`);
  }

  create(body: PaymentCreatePayload): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.base, body);
  }

  update(id: number, body: PaymentUpdatePayload): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
