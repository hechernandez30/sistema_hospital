import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TriageResponse } from '../models/triage.models';

@Component({
  selector: 'app-triage-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './triage-detail-dialog.component.html',
  styleUrl: './triage-detail-dialog.component.scss',
})
export class TriageDetailDialogComponent {
  readonly data = inject<TriageResponse>(MAT_DIALOG_DATA);

  ta(d: TriageResponse): string {
    if (d.systolicPressure == null && d.diastolicPressure == null) {
      return '—';
    }
    return `${d.systolicPressure ?? '—'}/${d.diastolicPressure ?? '—'}`;
  }
}
