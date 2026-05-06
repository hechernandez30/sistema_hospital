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
import { MedicalOrderApiService } from '../services/medical-order-api.service';
import {
  MEDICAL_ORDER_PRIORITY_PRESETS,
  MEDICAL_ORDER_STATUSES,
  MEDICAL_ORDER_TYPES,
  MedicalOrderCreatePayload,
  MedicalOrderResponse,
  MedicalOrderUpdatePayload,
  medicalOrderStatusLabel,
  medicalOrderTypeLabel,
} from '../models/medical-order.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import { parsePositiveInt, requiredPositiveInteger } from '../../shared/form-validators';

export interface MedicalOrderFormDialogData {
  mode: 'create' | 'edit';
  medicalOrderId?: number;
}

@Component({
  selector: 'app-medical-order-form-dialog',
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
  templateUrl: './medical-order-form-dialog.component.html',
  styleUrl: './medical-order-form-dialog.component.scss',
})
export class MedicalOrderFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MedicalOrderApiService);
  private readonly dialogRef = inject(MatDialogRef<MedicalOrderFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<MedicalOrderFormDialogData>(MAT_DIALOG_DATA);

  readonly orderTypes = [...MEDICAL_ORDER_TYPES];
  readonly statuses = [...MEDICAL_ORDER_STATUSES];
  readonly priorityPresets = [...MEDICAL_ORDER_PRIORITY_PRESETS];
  /** Prioridades fuera del catálogo (datos legacy) para poder editar sin perder valor. */
  extraPriorities: string[] = [];

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    medicalCareId: ['', [requiredPositiveInteger()]],
    orderType: ['LABORATORIO', [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(250)]],
    priority: ['NORMAL', [Validators.required, Validators.maxLength(120)]],
    status: ['PENDIENTE', [Validators.required]],
    observations: ['', [Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'create') {
      this.extraPriorities = [];
    }
    if (this.dialogData.mode === 'edit' && this.dialogData.medicalOrderId != null) {
      this.loading = true;
      this.api.getById(this.dialogData.medicalOrderId).subscribe({
        next: (o) => this.patchFrom(o),
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la orden.'), 'Cerrar', { duration: 6000 });
          this.dialogRef.close(false);
        },
      });
    }
  }

  private patchFrom(o: MedicalOrderResponse): void {
    this.loading = false;
    const pri = (o.priority ?? 'NORMAL').trim() || 'NORMAL';
    const presetSet = new Set(this.priorityPresets as readonly string[]);
    if (!presetSet.has(pri) && !this.extraPriorities.includes(pri)) {
      this.extraPriorities = [...this.extraPriorities, pri];
    }
    this.form.patchValue({
      medicalCareId: String(o.medicalCareId),
      orderType: o.orderType as (typeof MEDICAL_ORDER_TYPES)[number],
      description: o.description,
      priority: pri,
      status: o.status as (typeof MEDICAL_ORDER_STATUSES)[number],
      observations: o.observations ?? '',
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const medicalCareId = parsePositiveInt(v.medicalCareId);
    if (medicalCareId == null) {
      this.snackBar.open('ID de atención médica no válido.', 'Cerrar', { duration: 5000 });
      return;
    }
    const observations = v.observations?.trim() ? v.observations.trim() : null;
    this.saving = true;
    if (this.dialogData.mode === 'create') {
      const priorityTrim = (v.priority ?? '').trim() || 'NORMAL';
      const body: MedicalOrderCreatePayload = {
        medicalCareId,
        orderType: v.orderType as string,
        description: (v.description ?? '').trim(),
        priority: priorityTrim,
        status: v.status as string,
        observations,
      };
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.medicalOrderId != null) {
      const body: MedicalOrderUpdatePayload = {
        medicalCareId,
        orderType: v.orderType as string,
        description: (v.description ?? '').trim(),
        priority: (v.priority ?? '').trim(),
        status: v.status as string,
        observations,
      };
      this.api.update(this.dialogData.medicalOrderId, body).subscribe({
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
    this.snackBar.open('Orden guardada correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar la orden.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';

  readonly orderTypeLabel = medicalOrderTypeLabel;
  readonly statusLabel = medicalOrderStatusLabel;
}
