import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserCreatePayload, UserResponse, UserUpdatePayload } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/users`;

  list(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.base);
  }

  getById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/${id}`);
  }

  create(body: UserCreatePayload): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.base, body);
  }

  update(id: number, body: UserUpdatePayload): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
