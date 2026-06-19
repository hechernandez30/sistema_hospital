import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  LaboratoryAttachmentMetadata,
  LaboratoryCreatePayload,
  LaboratoryResponse,
  LaboratoryUpdatePayload,
} from '../models/laboratory.models';

@Injectable({ providedIn: 'root' })
export class LaboratoryApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/laboratory`;

  list(medicalOrderId?: number): Observable<LaboratoryResponse[]> {
    let params = new HttpParams();
    if (medicalOrderId != null && medicalOrderId > 0) {
      params = params.set('medicalOrderId', String(medicalOrderId));
    }
    return this.http.get<LaboratoryResponse[]>(this.base, { params });
  }

  getById(id: number): Observable<LaboratoryResponse> {
    return this.http.get<LaboratoryResponse>(`${this.base}/${id}`);
  }

  create(body: LaboratoryCreatePayload): Observable<LaboratoryResponse> {
    return this.http.post<LaboratoryResponse>(this.base, body);
  }

  update(id: number, body: LaboratoryUpdatePayload): Observable<LaboratoryResponse> {
    return this.http.put<LaboratoryResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadAttachment(id: number, file: File): Observable<LaboratoryResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<LaboratoryResponse>(`${this.base}/${id}/attachment`, formData);
  }

  downloadAttachment(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/attachment`, { responseType: 'blob' });
  }

  getAttachmentMetadata(id: number): Observable<LaboratoryAttachmentMetadata> {
    return this.http.get<LaboratoryAttachmentMetadata>(`${this.base}/${id}/attachment/metadata`);
  }

  deleteAttachment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/attachment`);
  }
}
