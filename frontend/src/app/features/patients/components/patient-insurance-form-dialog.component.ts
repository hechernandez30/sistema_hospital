import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientApiService } from '../services/patient-api.service';
import { InsurancePayload, InsuranceResponse } from '../models/patient-insurance.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';

export interface PatientInsuranceFormDialogData {
  patientId: number;
  mode: 'create' | 'edit';
  insurance?: InsuranceResponse;
}

function coveragePercentValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    const n =
      typeof raw === 'number'
        ? raw
        : raw === '' || raw === null || raw === undefined
          ? NaN
          : Number(String(raw).replace(',', '.'));
    if (raw === '' || raw === null || raw === undefined || Number.isNaN(n)) {
      return { required: true };
    }
    if (n < 0 || n > 100) {
      return { range: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-patient-insurance-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './patient-insurance-form-dialog.component.html',
  styleUrl: './patient-insurance-form-dialog.component.scss',
})
export class PatientInsuranceFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PatientApiService);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogRef = inject(MatDialogRef<PatientInsuranceFormDialogComponent, boolean>);
  readonly data = inject<PatientInsuranceFormDialogData>(MAT_DIALOG_DATA);

  saving = false;

  readonly form = this.fb.nonNullable.group({
    insurerName: ['', [Validators.required, Validators.maxLength(150)]],
    policyNumber: ['', [Validators.required, Validators.maxLength(50)]],
    coveragePercent: [100 as string | number, [coveragePercentValidator()]],
    startDate: [''],
    endDate: [''],
    active: [true],
  });

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.insurance) {
      const i = this.data.insurance;
      const cov =
        typeof i.coveragePercent === 'number'
          ? i.coveragePercent
          : Number(String(i.coveragePercent ?? '').replace(',', '.'));
      this.form.patchValue({
        insurerName: i.insurerName,
        policyNumber: i.policyNumber,
        coveragePercent: Number.isFinite(cov) ? cov : '',
        startDate: i.startDate?.substring(0, 10) ?? '',
        endDate: i.endDate?.substring(0, 10) ?? '',
        active: i.active,
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise cobertura (0–100) y datos obligatorios.', 'Cerrar', { duration: 5500 });
      return;
    }
    const raw = this.form.getRawValue();
    const coverage = Number(String(raw.coveragePercent).replace(',', '.'));
    const body: InsurancePayload = {
      insurerName: raw.insurerName.trim(),
      policyNumber: raw.policyNumber.trim(),
      coveragePercent: coverage,
      startDate: toIsoDateOrNull(raw.startDate),
      endDate: toIsoDateOrNull(raw.endDate),
      active: raw.active,
    };
    this.saving = true;
    if (this.data.mode === 'create') {
      this.api.createInsurance(this.data.patientId, body).subscribe({
        next: () => this.closeOk(),
        error: (err: unknown) => this.onSaveError(err),
      });
    } else if (this.data.insurance) {
      this.api.updateInsurance(this.data.patientId, this.data.insurance.id, body).subscribe({
        next: () => this.closeOk(),
        error: (err: unknown) => this.onSaveError(err),
      });
    }
  }

  private closeOk(): void {
    this.saving = false;
    this.snackBar.open('Seguro guardado.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private onSaveError(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el seguro.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.data.mode === 'edit';
}

function toIsoDateOrNull(s: string): string | null {
  const t = s?.trim();
  return t ? t : null;
}
