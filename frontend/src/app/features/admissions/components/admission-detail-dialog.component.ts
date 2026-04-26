import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdmissionResponse } from '../models/admission.models';

@Component({
  selector: 'app-admission-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './admission-detail-dialog.component.html',
  styleUrl: './admission-detail-dialog.component.scss',
})
export class AdmissionDetailDialogComponent {
  readonly data = inject<AdmissionResponse>(MAT_DIALOG_DATA);
}
