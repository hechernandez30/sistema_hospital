import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentApiService } from '../services/payment-api.service';
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUSES,
  PaymentCreatePayload,
  PaymentResponse,
  PaymentUpdatePayload,
} from '../models/payment.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import {
  optionalDecimalRange,
  optionalPositiveInteger,
  parsePositiveInt,
  requiredPositiveInteger,
} from '../../shared/form-validators';

export interface PaymentFormDialogData {
  mode: 'create' | 'edit';
  paymentId?: number;
}

function parseMoneyToNumber(raw: string): number {
  const s = String(raw ?? '')
    .trim()
    .replace(',', '.');
  return Number(s);
}

@Component({
  selector: 'app-payment-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './payment-form-dialog.component.html',
  styleUrl: './payment-form-dialog.component.scss',
})
export class PaymentFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PaymentApiService);
  private readonly dialogRef = inject(MatDialogRef<PaymentFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<PaymentFormDialogData>(MAT_DIALOG_DATA);

  readonly statuses = [...PAYMENT_STATUSES];
  readonly methodOptions = [...PAYMENT_METHOD_OPTIONS];

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    patientId: ['', [requiredPositiveInteger()]],
    admissionId: ['', [optionalPositiveInteger()]],
    medicalOrderId: ['', [optionalPositiveInteger()]],
    concept: ['', [Validators.required, Validators.maxLength(200)]],
    subtotal: ['', [Validators.required, optionalDecimalRange(0, 1_000_000_000)]],
    insurancePercent: ['', [Validators.required, optionalDecimalRange(0, 100)]],
    copay: ['', [Validators.required, optionalDecimalRange(0, 1_000_000_000)]],
    paymentMethod: ['' as string],
    status: ['PENDIENTE', [Validators.required]],
    receiptNumber: ['', [Validators.maxLength(50)]],
    registeredByUserId: ['', [optionalPositiveInteger()]],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'edit' && this.dialogData.paymentId != null) {
      this.loading = true;
      this.api.getById(this.dialogData.paymentId).subscribe({
        next: (p) => this.patchFrom(p),
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el pago.'), 'Cerrar', { duration: 6000 });
          this.dialogRef.close(false);
        },
      });
    }
  }

  private patchFrom(p: PaymentResponse): void {
    this.loading = false;
    this.form.patchValue({
      patientId: String(p.patientId),
      admissionId: p.admissionId != null ? String(p.admissionId) : '',
      medicalOrderId: p.medicalOrderId != null ? String(p.medicalOrderId) : '',
      concept: p.concept,
      subtotal: String(p.subtotal),
      insurancePercent: String(p.insurancePercent),
      copay: String(p.copay),
      paymentMethod: (p.paymentMethod ?? '') as '' | 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA',
      status: p.status as (typeof PAYMENT_STATUSES)[number],
      receiptNumber: p.receiptNumber ?? '',
      registeredByUserId: p.registeredByUserId != null ? String(p.registeredByUserId) : '',
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const patientId = parsePositiveInt(v.patientId);
    if (patientId == null) {
      this.snackBar.open('ID de paciente no válido.', 'Cerrar', { duration: 5000 });
      return;
    }
    const subtotal = parseMoneyToNumber(v.subtotal as string);
    const insurancePercent = parseMoneyToNumber(v.insurancePercent as string);
    const copay = parseMoneyToNumber(v.copay as string);
    if (!Number.isFinite(subtotal) || !Number.isFinite(insurancePercent) || !Number.isFinite(copay)) {
      this.snackBar.open('Montos no válidos.', 'Cerrar', { duration: 5000 });
      return;
    }
    const methodRaw = (v.paymentMethod ?? '').trim();
    const body: PaymentCreatePayload = {
      patientId,
      admissionId: parsePositiveInt(v.admissionId),
      medicalOrderId: parsePositiveInt(v.medicalOrderId),
      concept: (v.concept ?? '').trim(),
      subtotal,
      insurancePercent,
      copay,
      paymentMethod: methodRaw ? methodRaw : null,
      status: v.status as string,
      receiptNumber: v.receiptNumber?.trim() ? v.receiptNumber.trim() : null,
      registeredByUserId: parsePositiveInt(v.registeredByUserId),
    };
    this.saving = true;
    if (this.dialogData.mode === 'create') {
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.paymentId != null) {
      this.api.update(this.dialogData.paymentId, body as PaymentUpdatePayload).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else {
      this.saving = false;
      this.snackBar.open('No se pudo guardar: falta el identificador.', 'Cerrar', { duration: 6000 });
    }
  }

  private ok(): void {
    this.saving = false;
    this.snackBar.open('Pago guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el pago.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
