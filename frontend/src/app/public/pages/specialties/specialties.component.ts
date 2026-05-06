import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PublicContentService } from '../../services/public-content.service';
import { PublicSpecialtyItem } from '../../models/public-content.models';
import { slugify } from '../../utils/slug.util';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-specialties',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, AsyncPipe],
  templateUrl: './specialties.component.html',
  styleUrl: './specialties.component.scss',
})
export class SpecialtiesComponent {
  private readonly content = inject(PublicContentService);
  private readonly route = inject(ActivatedRoute);

  highlightedId: string | null = null;

  readonly specialties$: Observable<(PublicSpecialtyItem & { slug: string })[]> = this.content.specialties$.pipe(
    map((rows) => rows.map((r) => ({ ...r, slug: slugify(r.nombre) }))),
  );

  constructor() {
    this.route.fragment.subscribe((frag) => {
      if (!frag) {
        return;
      }
      this.highlightAndScroll(frag);
    });
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
