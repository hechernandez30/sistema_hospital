import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LaboratoryResponse } from '../models/laboratory.models';

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

  close(): void {
    this.dialogRef.close();
  }
}
