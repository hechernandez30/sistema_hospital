import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MedicationResponse } from '../models/medication.models';

@Component({
  selector: 'app-medication-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './medication-detail-dialog.component.html',
  styleUrl: './medication-detail-dialog.component.scss',
})
export class MedicationDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MedicationDetailDialogComponent>);
  readonly data = inject<MedicationResponse>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
