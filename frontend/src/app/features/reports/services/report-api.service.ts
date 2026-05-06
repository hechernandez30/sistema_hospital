import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdmissionReportRow,
  AppointmentReportRow,
  LaboratoryReportRow,
  MedicationLowStockRow,
  PaymentReportRow,
} from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/reports`;

  appointments(dateFrom: string, dateTo: string, status?: string): Observable<AppointmentReportRow[]> {
    const params = this.dateRangeParams(dateFrom, dateTo, status);
    return this.http.get<AppointmentReportRow[]>(`${this.base}/appointments`, { params });
  }

  admissions(dateFrom: string, dateTo: string, status?: string): Observable<AdmissionReportRow[]> {
    const params = this.dateRangeParams(dateFrom, dateTo, status);
    return this.http.get<AdmissionReportRow[]>(`${this.base}/admissions`, { params });
  }

  payments(dateFrom: string, dateTo: string, status?: string): Observable<PaymentReportRow[]> {
    const params = this.dateRangeParams(dateFrom, dateTo, status);
    return this.http.get<PaymentReportRow[]>(`${this.base}/payments`, { params });
  }

  lowStock(): Observable<MedicationLowStockRow[]> {
    return this.http.get<MedicationLowStockRow[]>(`${this.base}/medications/low-stock`);
  }

  laboratory(status?: string): Observable<LaboratoryReportRow[]> {
    let params = new HttpParams();
    if (status && status.trim()) {
      params = params.set('status', status.trim().toUpperCase());
    }
    return this.http.get<LaboratoryReportRow[]>(`${this.base}/laboratory`, { params });
  }

  private dateRangeParams(dateFrom: string, dateTo: string, status?: string): HttpParams {
    let params = new HttpParams().set('dateFrom', dateFrom).set('dateTo', dateTo);
    if (status && status.trim()) {
      params = params.set('status', status.trim().toUpperCase());
    }
    return params;
  }
}
