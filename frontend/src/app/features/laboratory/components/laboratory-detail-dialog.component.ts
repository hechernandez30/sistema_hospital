import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  LAB_REQUESTER_LABELS,
  LAB_REQUEST_TYPE_LABELS,
  LaboratoryResponse,
  laboratoryStatusLabel,
} from '../models/laboratory.models';

@Component({
  selector: 'app-laboratory-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './laboratory-detail-dialog.component.html',
  styleUrl: './laboratory-detail-dialog.component.scss',
})
export class LaboratoryDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<LaboratoryDetailDialogComponent>);
  readonly data = inject<LaboratoryResponse>(MAT_DIALOG_DATA);
  readonly laboratoryStatusLabel = laboratoryStatusLabel;

  requesterDisplay(code: string | null): string {
    if (!code) {
      return '—';
    }
    const extra = LAB_REQUESTER_LABELS[code as keyof typeof LAB_REQUESTER_LABELS];
    return extra ? `${code} — ${extra}` : code;
  }

  requestTypeDisplay(code: string | null): string {
    if (!code) {
      return '—';
    }
    const extra = LAB_REQUEST_TYPE_LABELS[code as keyof typeof LAB_REQUEST_TYPE_LABELS];
    return extra ? `${code} — ${extra}` : code;
  }

  close(): void {
    this.dialogRef.close();
  }
}
