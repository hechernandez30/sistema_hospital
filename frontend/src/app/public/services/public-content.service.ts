import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, combineLatest, map, of, shareReplay } from 'rxjs';
import {
  PublicDoctorItem,
  PublicSearchResult,
  PublicServiceItem,
  PublicSpecialtyItem,
} from '../models/public-content.models';
import { normalizeForSearch, slugify } from '../utils/slug.util';

@Injectable({ providedIn: 'root' })
export class PublicContentService {
  private readonly http = inject(HttpClient);

  readonly services$: Observable<PublicServiceItem[]> = this.http.get<PublicServiceItem[]>('assets/data/services.json').pipe(
    catchError(() => of([] as PublicServiceItem[])),
    shareReplay(1),
  );

  readonly specialties$: Observable<PublicSpecialtyItem[]> = this.http
    .get<PublicSpecialtyItem[]>('assets/data/specialties.json')
    .pipe(catchError(() => of([] as PublicSpecialtyItem[])), shareReplay(1));

  readonly doctors$: Observable<PublicDoctorItem[]> = this.http.get<PublicDoctorItem[]>('assets/data/doctors.json').pipe(
    catchError(() => of([] as PublicDoctorItem[])),
    shareReplay(1),
  );

  search(query: string): Observable<PublicSearchResult[]> {
    const q = normalizeForSearch(query);
    if (!q) {
      return of([]);
    }
    return combineLatest([this.services$, this.specialties$, this.doctors$]).pipe(
      map(([services, specialties, doctors]) => {
        const results: PublicSearchResult[] = [];

        for (const s of services) {
          const keywords = [s.nombre, s.descripcion, ...(s.tags ?? [])].join(' ');
          if (matches(keywords, q)) {
            results.push({
              type: 'servicio',
              title: s.nombre,
              subtitle: 'Servicio',
              description: s.descripcion,
              route: '/p/servicios',
              fragment: slugify(s.nombre),
              keywords,
            });
          }
        }

        for (const e of specialties) {
          const keywords = [e.nombre, e.descripcion].join(' ');
          if (matches(keywords, q)) {
            results.push({
              type: 'especialidad',
              title: e.nombre,
              subtitle: 'Especialidad',
              description: e.descripcion,
              route: '/p/especialidades',
              fragment: slugify(e.nombre),
              keywords,
            });
          }
        }

        for (const d of doctors) {
          const keywords = [d.nombre, d.especialidad, d.perfil, d.horarioReferencial ?? ''].join(' ');
          if (matches(keywords, q)) {
            results.push({
              type: 'medico',
              title: d.nombre,
              subtitle: d.especialidad,
              description: d.perfil,
              route: '/p/medicos',
              fragment: slugify(d.nombre),
              keywords,
            });
          }
        }

        return results.slice(0, 25);
      }),
    );
  }
}

function matches(text: string, q: string): boolean {
  return normalizeForSearch(text).includes(q);
}
