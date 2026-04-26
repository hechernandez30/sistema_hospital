import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe } from '@angular/common';
import { catchError, of } from 'rxjs';

export interface PublicSpecialty {
  id: number;
  nombre: string;
  descripcion: string;
  duracionMinutos: number;
}

@Component({
  selector: 'app-specialties',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, AsyncPipe],
  templateUrl: './specialties.component.html',
  styleUrl: './specialties.component.scss',
})
export class SpecialtiesComponent {
  private readonly http = inject(HttpClient);

  readonly specialties$ = this.http.get<PublicSpecialty[]>('assets/data/specialties.json').pipe(
    catchError(() => of([] as PublicSpecialty[])),
  );
}
