import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MedicalCareView } from '../models/medical-care.models';

@Component({
  selector: 'app-medical-care-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './medical-care-detail-dialog.component.html',
  styleUrl: './medical-care-detail-dialog.component.scss',
})
export class MedicalCareDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MedicalCareDetailDialogComponent>);
  readonly data = inject<MedicalCareView>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
