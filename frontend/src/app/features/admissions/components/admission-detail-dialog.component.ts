import { DatePipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  ADMISSION_STATUS_LABELS,
  ADMISSION_TYPE_LABELS,
  AdmissionDetailData,
  VALIDATION_SOURCE_LABELS,
} from '../models/admission.models';
import { admissionStatusChipClass as resolveAdmissionStatusChip } from '../admission-chip-class';

@Component({
  selector: 'app-admission-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe, NgClass],
  templateUrl: './admission-detail-dialog.component.html',
  styleUrl: './admission-detail-dialog.component.scss',
})
export class AdmissionDetailDialogComponent {
  readonly data = inject<AdmissionDetailData>(MAT_DIALOG_DATA);

  patientHeading(): string {
    if (this.data.patientLabel?.trim()) {
      return `${this.data.patientLabel}`;
    }
    return `Paciente #${this.data.patientId}`;
  }

  typeLabel(code: string): string {
    return ADMISSION_TYPE_LABELS[code as keyof typeof ADMISSION_TYPE_LABELS] ?? code;
  }

  statusLabel(code: string): string {
    return ADMISSION_STATUS_LABELS[code as keyof typeof ADMISSION_STATUS_LABELS] ?? code;
  }

  validationLabel(code: string | null): string {
    if (!code) {
      return '—';
    }
    return VALIDATION_SOURCE_LABELS[code as keyof typeof VALIDATION_SOURCE_LABELS] ?? code;
  }

  statusChipCls(status: string): string {
    return resolveAdmissionStatusChip(status);
  }
}
