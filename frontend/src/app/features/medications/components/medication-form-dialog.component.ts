import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MedicationApiService } from '../services/medication-api.service';
import { MedicationPayload, MedicationResponse } from '../models/medication.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';

export interface MedicationFormDialogData {
  mode: 'create' | 'edit';
  medicationId?: number;
}

function nonNegativeIntRequired(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = String(control.value ?? '').trim();
    if (!s) {
      return { required: true };
    }
    if (!/^[0-9]+$/.test(s)) {
      return { integer: true };
    }
    const n = parseInt(s, 10);
    if (!Number.isFinite(n) || n < 0) {
      return { min: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-medication-form-dialog',
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
  templateUrl: './medication-form-dialog.component.html',
  styleUrl: './medication-form-dialog.component.scss',
})
export class MedicationFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MedicationApiService);
  private readonly dialogRef = inject(MatDialogRef<MedicationFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<MedicationFormDialogData>(MAT_DIALOG_DATA);

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    presentation: ['', [Validators.maxLength(100)]],
    unit: ['', [Validators.maxLength(30)]],
    currentStock: ['', [nonNegativeIntRequired()]],
    minimumStock: ['', [nonNegativeIntRequired()]],
    active: [true],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'edit' && this.dialogData.medicationId != null) {
      this.loading = true;
      this.api.getById(this.dialogData.medicationId).subscribe({
        next: (m) => this.patchFrom(m),
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el medicamento.'), 'Cerrar', { duration: 6000 });
          this.dialogRef.close(false);
        },
      });
    }
  }

  private patchFrom(m: MedicationResponse): void {
    this.loading = false;
    this.form.patchValue({
      name: m.name,
      presentation: m.presentation ?? '',
      unit: m.unit ?? '',
      currentStock: String(m.currentStock),
      minimumStock: String(m.minimumStock),
      active: m.active,
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const currentStock = parseInt(String(v.currentStock).trim(), 10);
    const minimumStock = parseInt(String(v.minimumStock).trim(), 10);
    const presentation = v.presentation?.trim() ? v.presentation.trim() : null;
    const unit = v.unit?.trim() ? v.unit.trim() : null;
    const body: MedicationPayload = {
      name: (v.name ?? '').trim(),
      presentation,
      unit,
      currentStock,
      minimumStock,
      active: v.active ? true : false,
    };
    this.saving = true;
    if (this.dialogData.mode === 'create') {
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.medicationId != null) {
      this.api.update(this.dialogData.medicationId, body).subscribe({
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
    this.snackBar.open('Medicamento guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el medicamento.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
