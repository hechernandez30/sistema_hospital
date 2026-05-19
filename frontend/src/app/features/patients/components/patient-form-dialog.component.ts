import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientApiService } from '../services/patient-api.service';
import { PatientCreatePayload, PatientResponse, PatientUpdatePayload } from '../models/patient.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import { nextPatientCodeFromExistingCodes } from '../../../core/utils/next-sequential-code';
import {
  birthDatePastValidator,
  DPI_NIT_PATTERN,
  optionalPhoneBackendPattern,
  patientPersonNameCu02Validator,
  requiredPhoneBackendPattern,
} from '../../shared/form-validators';
import { PrivacyNoticeDialogComponent } from './privacy-notice-dialog.component';

export interface PatientFormDialogData {
  mode: 'create' | 'edit';
  patientId?: number;
  /** Solo alta: códigos de la lista cargada para sugerir el siguiente PAC-nnnn. */
  existingPatientCodes?: readonly string[];
}

@Component({
  selector: 'app-patient-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './patient-form-dialog.component.html',
  styleUrl: './patient-form-dialog.component.scss',
})
export class PatientFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PatientApiService);
  private readonly dialogRef = inject(MatDialogRef<PatientFormDialogComponent, boolean>);
  private readonly overlayDialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<PatientFormDialogData>(MAT_DIALOG_DATA);

  loading = false;
  saving = false;

  readonly form = this.fb.nonNullable.group({
    patientCode: ['', [Validators.required, Validators.maxLength(30)]],
    firstName: ['', [Validators.required, Validators.maxLength(100), patientPersonNameCu02Validator()]],
    lastName: ['', [Validators.required, Validators.maxLength(100), patientPersonNameCu02Validator()]],
    dpiNit: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(DPI_NIT_PATTERN)]],
    birthDate: ['', [Validators.required, birthDatePastValidator()]],
    sex: ['M' as string | null, [Validators.required, Validators.pattern(/^(M|F|OTRO)$/)]],
    phone: ['', [requiredPhoneBackendPattern()]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    address: [''],
    emergencyContactName: ['', [Validators.maxLength(150)]],
    emergencyContactPhone: ['', [optionalPhoneBackendPattern()]],
    privacyAccepted: [false, [Validators.requiredTrue]],
    allergies: [''],
    conditions: [''],
    medicalHistory: [''],
    currentMedications: [''],
    active: [true],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'edit' && this.dialogData.patientId != null) {
      this.loading = true;
      this.api.getById(this.dialogData.patientId).subscribe({
        next: (p) => this.patchFromPatient(p),
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el paciente.'), 'Cerrar', { duration: 6000 });
          this.dialogRef.close(false);
        },
      });
    } else if (this.dialogData.mode === 'create') {
      const suggested = nextPatientCodeFromExistingCodes(this.dialogData.existingPatientCodes ?? []);
      this.form.patchValue({ patientCode: suggested });
    }
  }

  private patchFromPatient(p: PatientResponse): void {
    this.loading = false;
    this.form.patchValue({
      patientCode: p.patientCode,
      firstName: p.firstName,
      lastName: p.lastName,
      dpiNit: p.dpiNit,
      birthDate: p.birthDate?.substring(0, 10) ?? '',
      sex: (p.sex as 'M' | 'F' | 'OTRO') ?? 'M',
      phone: p.phone ?? '',
      email: p.email ?? '',
      address: p.address ?? '',
      emergencyContactName: p.emergencyContactName ?? '',
      emergencyContactPhone: p.emergencyContactPhone ?? '',
      privacyAccepted: p.privacyAccepted,
      allergies: p.allergies ?? '',
      conditions: p.conditions ?? '',
      medicalHistory: p.medicalHistory ?? '',
      currentMedications: p.currentMedications ?? '',
      active: p.active,
    });
    this.form.controls.privacyAccepted.clearValidators();
    this.form.controls.privacyAccepted.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados: hay datos inválidos o incompletos.', 'Cerrar', { duration: 6000 });
      return;
    }
    const raw = this.form.getRawValue();
    const phone = this.dialogData.mode === 'create' ? emptyToNull(raw.phone) : raw.phone.trim();
    const email = emptyToNull(raw.email);
    const em = raw.emergencyContactPhone?.trim() ?? '';

    this.saving = true;
    if (this.dialogData.mode === 'create') {
      const body: PatientCreatePayload = {
        patientCode: raw.patientCode.trim(),
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        dpiNit: raw.dpiNit.trim(),
        birthDate: raw.birthDate,
        sex: raw.sex,
        phone: phone as string | null,
        email,
        address: emptyToNull(raw.address),
        emergencyContactName: emptyToNull(raw.emergencyContactName),
        emergencyContactPhone: em ? em : null,
        privacyAccepted: raw.privacyAccepted,
        allergies: emptyToNull(raw.allergies),
        conditions: emptyToNull(raw.conditions),
        medicalHistory: emptyToNull(raw.medicalHistory),
        currentMedications: emptyToNull(raw.currentMedications),
        active: raw.active,
      };
      this.api.create(body).subscribe({
        next: () => this.closeOk(),
        error: (err: unknown) => this.onSaveError(err),
      });
    } else if (this.dialogData.patientId != null) {
      const body: PatientUpdatePayload = {
        patientCode: raw.patientCode.trim(),
        firstName: raw.firstName.trim(),
        lastName: raw.lastName.trim(),
        dpiNit: raw.dpiNit.trim(),
        birthDate: raw.birthDate,
        sex: raw.sex,
        phone: phone as string,
        email: email ?? '',
        address: emptyToNull(raw.address),
        emergencyContactName: emptyToNull(raw.emergencyContactName),
        emergencyContactPhone: em ? em : '',
        privacyAccepted: raw.privacyAccepted,
        allergies: emptyToNull(raw.allergies),
        conditions: emptyToNull(raw.conditions),
        medicalHistory: emptyToNull(raw.medicalHistory),
        currentMedications: emptyToNull(raw.currentMedications),
        active: raw.active,
      };
      this.api.update(this.dialogData.patientId, body).subscribe({
        next: () => this.closeOk(),
        error: (err: unknown) => this.onSaveError(err),
      });
    }
  }

  private closeOk(): void {
    this.saving = false;
    this.snackBar.open('Paciente guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private onSaveError(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el paciente.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  /** Abre el aviso legal; no altera el checkbox (evento aislado del `mat-checkbox`). */
  openPrivacyNotice(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.overlayDialog.open(PrivacyNoticeDialogComponent, {
      width: 'min(720px, 94vw)',
      maxHeight: '92vh',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }

  /** Solo dígitos Guatemala (8 máx.), evita texto y notación tipo `e` que ocurre en `input type="number"`. */
  onGtPhoneInput(controlKey: 'phone' | 'emergencyContactPhone', event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    const c = this.form.controls[controlKey];
    if (c.value !== digits) {
      c.setValue(digits);
    }
  }

  /** Nueva sugerencia PAC-nnnn tratando el código actual como «ocupado» para avanzar el correlativo. */
  regenerateSuggestedPatientCode(): void {
    if (this.dialogData.mode !== 'create') {
      return;
    }
    const current = this.form.controls.patientCode.value?.trim() ?? '';
    const base = [...(this.dialogData.existingPatientCodes ?? [])];
    if (current && !base.includes(current)) {
      base.push(current);
    }
    this.form.patchValue({ patientCode: nextPatientCodeFromExistingCodes(base) });
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}

function emptyToNull(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}
