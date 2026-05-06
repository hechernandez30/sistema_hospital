import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PublicContentService } from '../../services/public-content.service';
import { slugify } from '../../utils/slug.util';
import { map, Observable } from 'rxjs';
import { PublicDoctorItem } from '../../models/public-content.models';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, AsyncPipe],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.scss',
})
export class DoctorsComponent {
  private readonly content = inject(PublicContentService);
  private readonly route = inject(ActivatedRoute);

  highlightedId: string | null = null;

  readonly doctors$: Observable<(PublicDoctorItem & { slug: string })[]> = this.content.doctors$.pipe(
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

