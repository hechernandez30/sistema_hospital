import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MedicalOrderResponse,
  PharmacyOrderLineResponse,
  medicalOrderPriorityLabel,
  medicalOrderStatusLabel,
  medicalOrderTypeLabel,
} from '../models/medical-order.models';
import { MedicalOrderApiService } from '../services/medical-order-api.service';

@Component({
  selector: 'app-medical-order-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, DatePipe],
  templateUrl: './medical-order-detail-dialog.component.html',
  styleUrl: './medical-order-detail-dialog.component.scss',
})
export class MedicalOrderDetailDialogComponent implements OnInit {
  private readonly api = inject(MedicalOrderApiService);
  readonly dialogRef = inject(MatDialogRef<MedicalOrderDetailDialogComponent>);
  readonly data = inject<MedicalOrderResponse>(MAT_DIALOG_DATA);
  readonly medicalOrderTypeLabel = medicalOrderTypeLabel;
  readonly medicalOrderStatusLabel = medicalOrderStatusLabel;
  readonly medicalOrderPriorityLabel = medicalOrderPriorityLabel;

  pharmacyLines: PharmacyOrderLineResponse[] = [];
  loadingPharmacyLines = false;

  ngOnInit(): void {
    if (this.data.orderType !== 'FARMACIA') {
      return;
    }
    this.loadingPharmacyLines = true;
    this.api.listPharmacyLines(this.data.id).subscribe({
      next: (lines) => {
        this.pharmacyLines = lines;
        this.loadingPharmacyLines = false;
      },
      error: () => {
        this.loadingPharmacyLines = false;
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
