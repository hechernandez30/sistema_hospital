import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentView, paymentMethodLabel, paymentStatusLabel } from '../models/payment.models';

@Component({
  selector: 'app-payment-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe, DecimalPipe],
  templateUrl: './payment-detail-dialog.component.html',
  styleUrl: './payment-detail-dialog.component.scss',
})
export class PaymentDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<PaymentDetailDialogComponent>);
  readonly data = inject<PaymentView>(MAT_DIALOG_DATA);
  readonly paymentStatusLabelFn = paymentStatusLabel;
  readonly paymentMethodLabelFn = paymentMethodLabel;

  close(): void {
    this.dialogRef.close();
  }
}
