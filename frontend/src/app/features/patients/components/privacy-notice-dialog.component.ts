import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';

/** Texto legal en `privacy-notice-dialog.component.html`; datos en `environment.privacyNotice`. */
@Component({
  selector: 'app-privacy-notice-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './privacy-notice-dialog.component.html',
  styleUrl: './privacy-notice-dialog.component.scss',
})
export class PrivacyNoticeDialogComponent {
  readonly dialogRef = inject(MatDialogRef<PrivacyNoticeDialogComponent, void>);
  protected readonly n = environment.privacyNotice;
  /** Fecha mostrada al pie (tiempo de apertura del diálogo, formato local GT). */
  protected readonly lastUpdated = new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}
