import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentView, paymentMethodLabel, paymentStatusLabel } from '../models/payment.models';
import { exportPaymentReceiptPdf } from '../utils/payment-receipt-pdf.util';

@Component({
  selector: 'app-payment-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule, DatePipe, DecimalPipe],
  templateUrl: './payment-detail-dialog.component.html',
  styleUrl: './payment-detail-dialog.component.scss',
})
export class PaymentDetailDialogComponent {
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogRef = inject(MatDialogRef<PaymentDetailDialogComponent>);
  readonly data = inject<PaymentView>(MAT_DIALOG_DATA);
  readonly paymentStatusLabelFn = paymentStatusLabel;
  readonly paymentMethodLabelFn = paymentMethodLabel;
  readonly isPaid = this.data.status === 'PAGADO';

  downloadReceipt(): void {
    const receipt = this.data.receiptNumber?.trim();
    if (!receipt) {
      this.snackBar.open(
        'Registre un número de recibo antes de imprimir el comprobante. Edite el pago y guarde el Nº recibo.',
        'Cerrar',
        { duration: 9000 },
      );
      return;
    }
    exportPaymentReceiptPdf(this.data);
  }

  close(): void {
    this.dialogRef.close();
  }
}
