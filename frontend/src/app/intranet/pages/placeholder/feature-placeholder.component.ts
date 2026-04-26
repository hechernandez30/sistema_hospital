import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card class="placeholder-card">
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
        <mat-card-subtitle>Fase 1 — módulo en preparación</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>
          Esta sección se conectará a la API en fases posteriores. La navegación y permisos ya reflejan los roles del
          backend.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .placeholder-card {
        max-width: 720px;
      }
    `,
  ],
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = toSignal(
    this.route.data.pipe(map((d) => (d['title'] as string) ?? 'Módulo')),
    { initialValue: (this.route.snapshot.data['title'] as string) ?? 'Módulo' },
  );
}
