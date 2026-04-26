import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SpecialtyApiService } from '../services/specialty-api.service';
import { SpecialtyPayload } from '../models/specialty.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';

export interface SpecialtyFormDialogData {
  mode: 'create' | 'edit';
  specialtyId?: number;
}

function durationMinutesValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = String(control.value ?? '').trim();
    if (!s) {
      return { required: true };
    }
    if (!/^[0-9]+$/.test(s)) {
      return { integer: true };
    }
    const n = parseInt(s, 10);
    if (!Number.isFinite(n) || n < 20 || n > 60) {
      return { range: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-specialty-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './specialty-form-dialog.component.html',
  styleUrl: './specialty-form-dialog.component.scss',
})
export class SpecialtyFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(SpecialtyApiService);
  private readonly dialogRef = inject(MatDialogRef<SpecialtyFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<SpecialtyFormDialogData>(MAT_DIALOG_DATA);

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    durationMinutes: ['', [durationMinutesValidator()]],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'edit' && this.dialogData.specialtyId != null) {
      this.loading = true;
      this.api.getById(this.dialogData.specialtyId).subscribe({
        next: (s) => {
          this.loading = false;
          this.form.patchValue({
            name: s.name,
            durationMinutes: String(s.durationMinutes),
          });
        },
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la especialidad.'), 'Cerrar', {
            duration: 6000,
          });
          this.dialogRef.close(false);
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados (duración entre 20 y 60 minutos).', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const body: SpecialtyPayload = {
      name: (v.name ?? '').trim(),
      durationMinutes: parseInt(String(v.durationMinutes).trim(), 10),
    };
    this.saving = true;
    if (this.dialogData.mode === 'create') {
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.specialtyId != null) {
      this.api.update(this.dialogData.specialtyId, body).subscribe({
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
    this.snackBar.open('Especialidad guardada correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar la especialidad.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
