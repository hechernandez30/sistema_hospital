import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PatientInsuranceRow } from '../models/patient-insurance.models';

@Injectable({ providedIn: 'root' })
export class PatientInsuranceApiService {
  private readonly http = inject(HttpClient);

  listByPatient(patientId: number): Observable<PatientInsuranceRow[]> {
    return this.http.get<PatientInsuranceRow[]>(`${environment.apiUrl}/api/patients/${patientId}/insurances`);
  }
}
