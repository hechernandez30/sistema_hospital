import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PublicContentService } from '../../services/public-content.service';
import { PublicServiceItem } from '../../models/public-content.models';
import { slugify } from '../../utils/slug.util';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [MatCardModule, MatIconModule, AsyncPipe],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  private readonly content = inject(PublicContentService);
  private readonly route = inject(ActivatedRoute);

  highlightedId: string | null = null;

  /** Nota: el portal público usa solo contenido estático (assets). */
  readonly services$: Observable<(PublicServiceItem & { slug: string })[]> = this.content.services$.pipe(
    map((rows) => rows.map((r) => ({ ...r, slug: slugify(r.nombre) }))),
  );

  readonly iconByName: Record<string, string> = {
    'Consulta externa': 'calendar_month',
    Urgencias: 'local_hospital',
    'Laboratorio clínico': 'biotech',
    'Imágenes médicas': 'photo_camera',
    Farmacia: 'medication',
  };

  constructor() {
    this.route.fragment.subscribe((frag) => {
      if (!frag) {
        return;
      }
      this.highlightAndScroll(frag);
    });
  }

  iconFor(name: string): string {
    return this.iconByName[name] ?? 'local_hospital';
  }

  private highlightAndScroll(id: string): void {
    this.highlightedId = id;
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    setTimeout(() => {
      if (this.highlightedId === id) {
        this.highlightedId = null;
      }
    }, 2000);
  }
}
