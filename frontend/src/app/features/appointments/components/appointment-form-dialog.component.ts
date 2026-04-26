import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AppointmentApiService } from '../services/appointment-api.service';
import {
  APPOINTMENT_STATUSES,
  AppointmentCreatePayload,
  AppointmentUpdatePayload,
} from '../models/appointment.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import { datetimeLocalToApi, apiToDatetimeLocal } from '../../shared/datetime-local';
import { optionalPositiveInteger, parsePositiveInt, requiredPositiveInteger } from '../../shared/form-validators';

export interface AppointmentFormDialogData {
  mode: 'create' | 'edit';
  appointmentId?: number;
}

function rangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startAt')?.value as string;
  const end = group.get('endAt')?.value as string;
  if (!start || !end) {
    return null;
  }
  const a = new Date(datetimeLocalToApi(start)).getTime();
  const b = new Date(datetimeLocalToApi(end)).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return null;
  }
  return b > a ? null : { range: true };
}

@Component({
  selector: 'app-appointment-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './appointment-form-dialog.component.html',
  styleUrl: './appointment-form-dialog.component.scss',
})
export class AppointmentFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AppointmentApiService);
  private readonly dialogRef = inject(MatDialogRef<AppointmentFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<AppointmentFormDialogData>(MAT_DIALOG_DATA);

  readonly statuses = [...APPOINTMENT_STATUSES];
  loading = false;
  saving = false;

  readonly form = this.fb.group(
    {
      patientId: ['', [requiredPositiveInteger()]],
      doctorId: ['', [requiredPositiveInteger()]],
      specialtyId: ['', [optionalPositiveInteger()]],
      startAt: ['', [Validators.required]],
      endAt: ['', [Validators.required]],
      reason: ['', [Validators.maxLength(250)]],
      status: ['PROGRAMADA', [Validators.required]],
      notifyEmail: [false],
      notifySms: [false],
      notifyWhatsapp: [false],
      createdByUserId: ['', [optionalPositiveInteger()]],
    },
    { validators: [rangeValidator] },
  );

  ngOnInit(): void {
    if (this.dialogData.mode === 'edit' && this.dialogData.appointmentId != null) {
      this.loading = true;
      this.api.getById(this.dialogData.appointmentId).subscribe({
        next: (a) => {
          this.loading = false;
          this.form.patchValue({
            patientId: String(a.patientId),
            doctorId: String(a.doctorId),
            specialtyId: a.specialtyId != null ? String(a.specialtyId) : '',
            startAt: apiToDatetimeLocal(a.startAt),
            endAt: apiToDatetimeLocal(a.endAt),
            reason: a.reason ?? '',
            status: a.status,
            notifyEmail: a.notifyEmail,
            notifySms: a.notifySms,
            notifyWhatsapp: a.notifyWhatsapp,
            createdByUserId: a.createdByUserId != null ? String(a.createdByUserId) : '',
          });
        },
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la cita.'), 'Cerrar', { duration: 6000 });
          this.dialogRef.close(false);
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados: hay datos inválidos o incompletos.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const patientId = parsePositiveInt(v.patientId);
    const doctorId = parsePositiveInt(v.doctorId);
    if (patientId == null || doctorId == null) {
      this.snackBar.open('IDs de paciente y médico deben ser enteros positivos.', 'Cerrar', { duration: 6000 });
      return;
    }
    const startAt = datetimeLocalToApi(v.startAt as string);
    const endAt = datetimeLocalToApi(v.endAt as string);
    const now = Date.now();
    if (new Date(startAt).getTime() <= now || new Date(endAt).getTime() <= now) {
      this.snackBar.open('Las fechas de inicio y fin deben ser futuras (validación del backend).', 'Cerrar', {
        duration: 6000,
      });
      return;
    }
    this.saving = true;
    const specialtyId = parsePositiveInt(v.specialtyId);
    const createdByUserId = parsePositiveInt(v.createdByUserId);
    const common = {
      patientId,
      doctorId,
      specialtyId,
      startAt,
      endAt,
      reason: v.reason?.trim() ? v.reason.trim() : null,
      status: v.status as string,
      notifyEmail: !!v.notifyEmail,
      notifySms: !!v.notifySms,
      notifyWhatsapp: !!v.notifyWhatsapp,
      createdByUserId,
    };
    if (this.dialogData.mode === 'create') {
      const body: AppointmentCreatePayload = { ...common };
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.appointmentId != null) {
      const body: AppointmentUpdatePayload = { ...common };
      this.api.update(this.dialogData.appointmentId, body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else {
      this.saving = false;
      this.snackBar.open('No se pudo guardar: falta el identificador de la cita.', 'Cerrar', { duration: 6000 });
    }
  }

  private ok(): void {
    this.saving = false;
    this.snackBar.open('Cita guardada correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar la cita.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
