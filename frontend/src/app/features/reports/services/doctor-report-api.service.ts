import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DoctorAdmissionReportRow,
  DoctorAppointmentReportRow,
  DoctorCatalogReportRow,
  DoctorImagingReportRow,
  DoctorLaboratoryReportRow,
  DoctorMedicalCareReportRow,
  DoctorMedicalOrderReportRow,
  DoctorProductivityReportRow,
  DoctorTriageReportRow,
} from '../models/doctor-report.models';

@Injectable({ providedIn: 'root' })
export class DoctorReportApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/reports/doctors`;

  catalog(filters: {
    specialtyId?: number;
    active?: boolean | null;
    attendance?: string;
  }): Observable<DoctorCatalogReportRow[]> {
    let params = new HttpParams();
    if (filters.specialtyId != null && filters.specialtyId > 0) {
      params = params.set('specialtyId', String(filters.specialtyId));
    }
    if (filters.active != null) {
      params = params.set('active', String(filters.active));
    }
    if (filters.attendance?.trim()) {
      params = params.set('attendance', filters.attendance.trim().toUpperCase());
    }
    return this.http.get<DoctorCatalogReportRow[]>(`${this.base}/catalog`, { params });
  }

  appointments(
    dateFrom: string,
    dateTo: string,
    filters: { doctorId?: number; specialtyId?: number; status?: string },
  ): Observable<DoctorAppointmentReportRow[]> {
    return this.http.get<DoctorAppointmentReportRow[]>(`${this.base}/appointments`, {
      params: this.rangeWithDoctorParams(dateFrom, dateTo, filters),
    });
  }

  medicalCares(
    dateFrom: string,
    dateTo: string,
    filters: {
      doctorId?: number;
      specialtyId?: number;
      requiresHospitalization?: boolean | null;
      pendingOnly?: boolean | null;
      pendingReassignmentOnly?: boolean | null;
    },
  ): Observable<DoctorMedicalCareReportRow[]> {
    let params = this.rangeWithDoctorParams(dateFrom, dateTo, filters);
    if (filters.requiresHospitalization != null) {
      params = params.set('requiresHospitalization', String(filters.requiresHospitalization));
    }
    if (filters.pendingOnly === true) {
      params = params.set('pendingOnly', 'true');
    }
    if (filters.pendingReassignmentOnly === true) {
      params = params.set('pendingReassignmentOnly', 'true');
    }
    return this.http.get<DoctorMedicalCareReportRow[]>(`${this.base}/medical-cares`, { params });
  }

  medicalOrders(
    dateFrom: string,
    dateTo: string,
    filters: { doctorId?: number; specialtyId?: number; orderType?: string; status?: string },
  ): Observable<DoctorMedicalOrderReportRow[]> {
    let params = this.rangeWithDoctorParams(dateFrom, dateTo, filters);
    if (filters.orderType?.trim()) {
      params = params.set('orderType', filters.orderType.trim().toUpperCase());
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim().toUpperCase());
    }
    return this.http.get<DoctorMedicalOrderReportRow[]>(`${this.base}/medical-orders`, { params });
  }

  admissions(
    dateFrom: string,
    dateTo: string,
    filters: { doctorId?: number; specialtyId?: number; status?: string; admissionType?: string },
  ): Observable<DoctorAdmissionReportRow[]> {
    let params = this.rangeWithDoctorParams(dateFrom, dateTo, filters);
    if (filters.admissionType?.trim()) {
      params = params.set('admissionType', filters.admissionType.trim().toUpperCase());
    }
    return this.http.get<DoctorAdmissionReportRow[]>(`${this.base}/admissions`, { params });
  }

  productivity(
    dateFrom: string,
    dateTo: string,
    filters: { doctorId?: number; specialtyId?: number },
  ): Observable<DoctorProductivityReportRow[]> {
    return this.http.get<DoctorProductivityReportRow[]>(`${this.base}/productivity`, {
      params: this.rangeWithDoctorParams(dateFrom, dateTo, filters),
    });
  }

  laboratory(
    dateFrom: string,
    dateTo: string,
    filters: { doctorId?: number; specialtyId?: number; status?: string },
  ): Observable<DoctorLaboratoryReportRow[]> {
    return this.http.get<DoctorLaboratoryReportRow[]>(`${this.base}/laboratory`, {
      params: this.rangeWithDoctorParams(dateFrom, dateTo, filters),
    });
  }

  imaging(
    dateFrom: string,
    dateTo: string,
    filters: { doctorId?: number; specialtyId?: number; status?: string },
  ): Observable<DoctorImagingReportRow[]> {
    return this.http.get<DoctorImagingReportRow[]>(`${this.base}/imaging`, {
      params: this.rangeWithDoctorParams(dateFrom, dateTo, filters),
    });
  }

  triage(
    dateFrom: string,
    dateTo: string,
    filters: { doctorId?: number; specialtyId?: number; priority?: string },
  ): Observable<DoctorTriageReportRow[]> {
    let params = this.rangeWithDoctorParams(dateFrom, dateTo, filters);
    if (filters.priority?.trim()) {
      params = params.set('priority', filters.priority.trim().toUpperCase());
    }
    return this.http.get<DoctorTriageReportRow[]>(`${this.base}/triage`, { params });
  }

  private rangeWithDoctorParams(
    dateFrom: string,
    dateTo: string,
    filters: { doctorId?: number; specialtyId?: number; status?: string },
  ): HttpParams {
    let params = new HttpParams().set('dateFrom', dateFrom).set('dateTo', dateTo);
    if (filters.doctorId != null && filters.doctorId > 0) {
      params = params.set('doctorId', String(filters.doctorId));
    }
    if (filters.specialtyId != null && filters.specialtyId > 0) {
      params = params.set('specialtyId', String(filters.specialtyId));
    }
    if (filters.status?.trim()) {
      params = params.set('status', filters.status.trim().toUpperCase());
    }
    return params;
  }
}
