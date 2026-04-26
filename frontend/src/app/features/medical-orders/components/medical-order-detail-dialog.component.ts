import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MedicalOrderResponse } from '../models/medical-order.models';

@Component({
  selector: 'app-medical-order-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './medical-order-detail-dialog.component.html',
  styleUrl: './medical-order-detail-dialog.component.scss',
})
export class MedicalOrderDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MedicalOrderDetailDialogComponent>);
  readonly data = inject<MedicalOrderResponse>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
