import { DestroyRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PaymentApiService } from '../services/payment-api.service';
import { PatientInsuranceApiService } from '../services/patient-insurance-api.service';
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUSES,
  PaymentCreatePayload,
  PaymentResponse,
  PaymentUpdatePayload,
  paymentMethodLabel,
  paymentStatusLabel,
} from '../models/payment.models';
import {
  previewPaymentMath,
  suggestCopayFromCoverage,
  suggestCoveragePercentFromPolicies,
} from '../utils/coverage-suggestion.util';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import {
  optionalDecimalRange,
  optionalPositiveInteger,
  parsePositiveInt,
  requiredPositiveInteger,
} from '../../shared/form-validators';
import { PatientApiService } from '../../patients/services/patient-api.service';
import { AdmissionApiService } from '../../admissions/services/admission-api.service';
import { MedicalOrderApiService } from '../../medical-orders/services/medical-order-api.service';
import { MedicalCareApiService } from '../../medical-cares/services/medical-care-api.service';
import { EntityPickerOption } from '../../shared/entity-picker.models';
import {
  buildAdmissionOptions,
  buildMedicalOrderOptions,
  buildPatientOptions,
  patientsToMap,
} from '../../shared/entity-picker.utils';
import { EntityAutocompleteComponent } from '../../shared/entity-autocomplete.component';
import { SessionUserFieldComponent } from '../../shared/session-user-field.component';
import { AuthService } from '../../../core/services/auth.service';
import { resolveActorUserIdForSubmit } from '../../shared/session-user.utils';
import { nextReceiptNumberFromExisting } from '../../../core/utils/next-sequential-code';
import { AdmissionResponse } from '../../admissions/models/admission.models';
import { MedicalCareResponse } from '../../medical-cares/models/medical-care.models';
import { MedicalOrderResponse } from '../../medical-orders/models/medical-order.models';

export interface PaymentFormDialogData {
  mode: 'create' | 'edit';
  paymentId?: number;
  /** Recibos ya conocidos (p. ej. desde lista); se complementan con GET /payments al crear. */
  existingReceiptNumbers?: string[];
}

function formatMoneyFieldValue(n: number): string {
  if (!Number.isFinite(n)) {
    return '0';
  }
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
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
    DecimalPipe,
    EntityAutocompleteComponent,
    SessionUserFieldComponent,
  ],
  templateUrl: './payment-form-dialog.component.html',
  styleUrl: './payment-form-dialog.component.scss',
})
export class PaymentFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PaymentApiService);
  private readonly patientInsuranceApi = inject(PatientInsuranceApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly admissionApi = inject(AdmissionApiService);
  private readonly medicalOrderApi = inject(MedicalOrderApiService);
  private readonly medicalCareApi = inject(MedicalCareApiService);
  private readonly dialogRef = inject(MatDialogRef<PaymentFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  readonly dialogData = inject<PaymentFormDialogData>(MAT_DIALOG_DATA);

  readonly statuses = [...PAYMENT_STATUSES];
  readonly methodOptions = [...PAYMENT_METHOD_OPTIONS];

  patientOptions: EntityPickerOption[] = [];
  admissionOptions: EntityPickerOption[] = [];
  medicalOrderOptions: EntityPickerOption[] = [];
  catalogError: string | null = null;
  private patientMap = new Map<number, import('../../patients/models/patient.models').PatientResponse>();
  private allAdmissions: AdmissionResponse[] = [];
  private allOrders: MedicalOrderResponse[] = [];
  private careById = new Map<number, MedicalCareResponse>();

  loading = false;
  saving = false;
  /** Intento reciente de sugerencia desde pólizas API (solo UX). */
  suggestLoading = false;
  private preservedActorUserId: number | null = null;

  readonly form = this.fb.group({
    patientId: ['', [requiredPositiveInteger()]],
    admissionId: ['', [optionalPositiveInteger()]],
    medicalOrderId: ['', [optionalPositiveInteger()]],
    concept: ['', [Validators.required, Validators.maxLength(200)]],
    subtotal: ['', [Validators.required, optionalDecimalRange(0, 1_000_000_000)]],
    insurancePercent: ['0', [Validators.required, optionalDecimalRange(0, 100)]],
    copay: ['0', [Validators.required, optionalDecimalRange(0, 1_000_000_000)]],
    paymentMethod: ['' as string],
    status: ['PENDIENTE', [Validators.required]],
    receiptNumber: ['', [Validators.maxLength(50)]],
  });

  ngOnInit(): void {
    this.form.controls.status.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.syncPaymentMethodValidator();
    });
    this.syncPaymentMethodValidator();

    this.loading = true;
    const catalogRequests = {
      patients: this.patientApi.list(),
      admissions: this.admissionApi.list(),
      orders: this.medicalOrderApi.list(),
      cares: this.medicalCareApi.list(),
      ...(this.dialogData.mode === 'create' ? { payments: this.api.list() } : {}),
    };
    forkJoin(catalogRequests).subscribe({
      next: (result) => {
        const { patients, admissions, orders, cares } = result;
        this.patientMap = patientsToMap(patients);
        this.allAdmissions = admissions;
        this.allOrders = orders;
        this.careById = new Map(cares.map((c) => [c.id, c] as const));
        this.patientOptions = buildPatientOptions(patients);
        this.catalogError = null;
        if (this.dialogData.mode === 'edit' && this.dialogData.paymentId != null) {
          this.api.getById(this.dialogData.paymentId).subscribe({
            next: (p) => this.patchFrom(p),
            error: (err: unknown) => this.failLoad(err),
          });
        } else {
          const payments =
            'payments' in result && Array.isArray(result.payments) ? result.payments : [];
          this.applySuggestedReceiptNumber(payments);
          this.loading = false;
        }
      },
      error: (err: unknown) => this.failLoad(err),
    });

    this.form.controls.patientId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshPaymentContext();
      this.form.controls.admissionId.setValue('');
      this.form.controls.medicalOrderId.setValue('');
    });
  }

  private failLoad(err: unknown): void {
    this.loading = false;
    this.catalogError = 'No se pudieron cargar catálogos.';
    this.snackBar.open(getHttpErrorMessage(err, this.catalogError), 'Cerrar', { duration: 7000 });
    this.dialogRef.close(false);
  }

  private applySuggestedReceiptNumber(payments: PaymentResponse[]): void {
    const fromApi = payments
      .map((p) => p.receiptNumber)
      .filter((n): n is string => Boolean(n?.trim()));
    const fromDialog = this.dialogData.existingReceiptNumbers ?? [];
    const suggested = nextReceiptNumberFromExisting([...fromApi, ...fromDialog]);
    this.form.patchValue({ receiptNumber: suggested });
  }

  private refreshPaymentContext(): void {
    const patientId = parsePositiveInt(this.form.controls.patientId.value);
    if (patientId == null) {
      this.admissionOptions = [];
      this.medicalOrderOptions = [];
      return;
    }
    this.admissionOptions = buildAdmissionOptions(this.allAdmissions, this.patientMap, {
      excludeClosed: true,
    }).filter((o) => this.allAdmissions.find((a) => a.id === o.id)?.patientId === patientId);
    const careIds = new Set(
      [...this.careById.values()].filter((c) => c.patientId === patientId).map((c) => c.id),
    );
    const ordersForPatient = this.allOrders.filter((o) => careIds.has(o.medicalCareId));
    this.medicalOrderOptions = buildMedicalOrderOptions(ordersForPatient, this.patientMap, this.careById, {
      excludeAnulled: true,
    });
  }

  private syncPaymentMethodValidator(): void {
    const ctl = this.form.controls.paymentMethod;
    if (this.form.controls.status.value === 'PAGADO') {
      ctl.setValidators([Validators.required]);
    } else {
      ctl.clearValidators();
    }
    ctl.updateValueAndValidity({ emitEvent: false });
  }

  readonly paymentStatusCaption = paymentStatusLabel;
  readonly paymentMethodCaption = paymentMethodLabel;

  applySuggestedInsurancePercent(): void {
    const pid = parsePositiveInt(this.form.controls.patientId.value);
    if (pid == null) {
      this.snackBar.open('Indique primero un ID de paciente válido.', 'Cerrar', { duration: 6000 });
      return;
    }
    this.suggestLoading = true;
    this.patientInsuranceApi.listByPatient(pid).subscribe({
      next: (rows) => {
        this.suggestLoading = false;
        const sug = suggestCoveragePercentFromPolicies(rows);
        if (sug == null) {
          this.snackBar.open(
            'No hay póliza activa y vigente a la fecha para sugerir cobertura. Use 0% o indique porcentaje manualmente.',
            'Cerrar',
            { duration: 9000 },
          );
          return;
        }
        const subtotal = parseMoneyToNumber(this.form.controls.subtotal.value as string);
        const suggestedCopay = suggestCopayFromCoverage(subtotal, sug.coveragePercent);
        this.form.patchValue({
          insurancePercent: String(sug.coveragePercent),
          copay: formatMoneyFieldValue(suggestedCopay),
        });
        this.snackBar.open(
          `Sugerido por ${sug.insurerHint}: cobertura ${sug.coveragePercent}%, copago ${formatMoneyFieldValue(suggestedCopay)} — puede cambiar estos valores.`,
          'Cerrar',
          { duration: 8000 },
        );
      },
      error: (err: unknown) => {
        this.suggestLoading = false;
        this.snackBar.open(
          getHttpErrorMessage(err, 'No se pudieron cargar seguros del paciente. ¿Permisos o sesión caducada?'),
          'Cerrar',
          { duration: 8000 },
        );
      },
    });
  }

  paymentPreview(): { discount: number; total: number; negative?: boolean } | null {
    const v = this.form.getRawValue();
    const sub = parseMoneyToNumber(v.subtotal as string);
    const pct = parseMoneyToNumber(v.insurancePercent as string);
    const cop = parseMoneyToNumber(v.copay as string);
    const p = previewPaymentMath(sub, pct, cop);
    if (p == null) {
      return null;
    }
    return { discount: p.discount, total: p.total, negative: p.total < 0 };
  }

  private patchFrom(p: PaymentResponse): void {
    this.loading = false;
    this.form.patchValue(
      {
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
      },
      { emitEvent: false },
    );
    this.preservedActorUserId = p.registeredByUserId;
    this.refreshPaymentContext();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.status.value === 'PAGADO' && this.form.controls.paymentMethod.invalid) {
        this.snackBar.open(
          'En estado Pagado debe seleccionar un método de pago.',
          'Cerrar',
          { duration: 9000 },
        );
      } else {
        this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      }
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
    const pre = previewPaymentMath(subtotal, insurancePercent, copay);
    if (pre != null && pre.total < 0) {
      this.snackBar.open(
        'El copago (total a pagar) no puede ser negativo. El servidor rechazaría el guardado.',
        'Cerrar',
        { duration: 9500 },
      );
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
      registeredByUserId: resolveActorUserIdForSubmit(
        this.auth,
        this.dialogData.mode,
        this.preservedActorUserId,
      ),
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
