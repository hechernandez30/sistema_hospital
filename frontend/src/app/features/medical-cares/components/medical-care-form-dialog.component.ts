import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MedicalCareApiService } from '../services/medical-care-api.service';
import {
  MedicalCareCreatePayload,
  MedicalCareResponse,
  MedicalCareUpdatePayload,
} from '../models/medical-care.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import {
  optionalPositiveInteger,
  parsePositiveInt,
  requiredPositiveInteger,
} from '../../shared/form-validators';

export interface MedicalCareFormDialogData {
  mode: 'create' | 'edit';
  medicalCareId?: number;
}

@Component({
  selector: 'app-medical-care-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './medical-care-form-dialog.component.html',
  styleUrl: './medical-care-form-dialog.component.scss',
})
export class MedicalCareFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MedicalCareApiService);
  private readonly dialogRef = inject(MatDialogRef<MedicalCareFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<MedicalCareFormDialogData>(MAT_DIALOG_DATA);

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    patientId: ['', [requiredPositiveInteger()]],
    admissionId: ['', [optionalPositiveInteger()]],
    appointmentId: ['', [optionalPositiveInteger()]],
    doctorId: ['', [requiredPositiveInteger()]],
    consultationReason: ['', [Validators.required, Validators.maxLength(4000)]],
    clinicalEvaluation: ['', [Validators.required, Validators.maxLength(8000)]],
    diagnosis: ['', [Validators.required, Validators.maxLength(4000)]],
    treatmentPlan: ['', [Validators.maxLength(8000)]],
    requiresHospitalization: [false],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'edit' && this.dialogData.medicalCareId != null) {
      this.loading = true;
      this.api.getById(this.dialogData.medicalCareId).subscribe({
        next: (c) => this.patchFrom(c),
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la atención.'), 'Cerrar', { duration: 6000 });
          this.dialogRef.close(false);
        },
      });
    }
  }

  private patchFrom(c: MedicalCareResponse): void {
    this.loading = false;
    this.form.patchValue({
      patientId: String(c.patientId),
      admissionId: c.admissionId != null ? String(c.admissionId) : '',
      appointmentId: c.appointmentId != null ? String(c.appointmentId) : '',
      doctorId: String(c.doctorId),
      consultationReason: c.consultationReason,
      clinicalEvaluation: c.clinicalEvaluation,
      diagnosis: c.diagnosis,
      treatmentPlan: c.treatmentPlan ?? '',
      requiresHospitalization: c.requiresHospitalization,
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
    const doctorId = parsePositiveInt(v.doctorId);
    if (patientId == null || doctorId == null) {
      this.snackBar.open('Paciente y médico son obligatorios (IDs válidos).', 'Cerrar', { duration: 5000 });
      return;
    }
    const admissionId = parsePositiveInt(v.admissionId);
    const appointmentId = parsePositiveInt(v.appointmentId);
    const treatmentPlan = v.treatmentPlan?.trim() ? v.treatmentPlan.trim() : null;
    this.saving = true;
    if (this.dialogData.mode === 'create') {
      const body: MedicalCareCreatePayload = {
        patientId,
        admissionId,
        appointmentId,
        doctorId,
        consultationReason: (v.consultationReason ?? '').trim(),
        clinicalEvaluation: (v.clinicalEvaluation ?? '').trim(),
        diagnosis: (v.diagnosis ?? '').trim(),
        treatmentPlan,
        requiresHospitalization: v.requiresHospitalization ? true : false,
      };
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.medicalCareId != null) {
      const body: MedicalCareUpdatePayload = {
        patientId,
        admissionId,
        appointmentId,
        doctorId,
        consultationReason: (v.consultationReason ?? '').trim(),
        clinicalEvaluation: (v.clinicalEvaluation ?? '').trim(),
        diagnosis: (v.diagnosis ?? '').trim(),
        treatmentPlan,
        requiresHospitalization: !!v.requiresHospitalization,
      };
      this.api.update(this.dialogData.medicalCareId, body).subscribe({
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
    this.snackBar.open('Atención guardada correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar la atención.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
