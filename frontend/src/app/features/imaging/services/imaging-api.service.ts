import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ImagingStudyCreatePayload, ImagingStudyResponse, ImagingStudyUpdatePayload } from '../models/imaging.models';

@Injectable({ providedIn: 'root' })
export class ImagingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/imaging`;

  list(medicalOrderId?: number): Observable<ImagingStudyResponse[]> {
    let params = new HttpParams();
    if (medicalOrderId != null && medicalOrderId > 0) {
      params = params.set('medicalOrderId', String(medicalOrderId));
    }
    return this.http.get<ImagingStudyResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<ImagingStudyResponse> {
    return this.http.get<ImagingStudyResponse>(`${this.base}/${id}`);
  }

  create(body: ImagingStudyCreatePayload): Observable<ImagingStudyResponse> {
    return this.http.post<ImagingStudyResponse>(this.base, body);
  }

  update(id: number, body: ImagingStudyUpdatePayload): Observable<ImagingStudyResponse> {
    return this.http.put<ImagingStudyResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
