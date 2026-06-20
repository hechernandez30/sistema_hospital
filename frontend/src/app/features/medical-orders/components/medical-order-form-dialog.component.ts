import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  PharmacyOrderLineItemPayload,
  PharmacyOrderLineResponse,
  medicalOrderStatusLabel,
  medicalOrderTypeLabel,
} from '../models/medical-order.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import { parsePositiveInt, requiredPositiveInteger } from '../../shared/form-validators';
import { MedicalCareApiService } from '../../medical-cares/services/medical-care-api.service';
import { PatientApiService } from '../../patients/services/patient-api.service';
import { EntityPickerOption } from '../../shared/entity-picker.models';
import { buildMedicalCareOptions, patientsToMap } from '../../shared/entity-picker.utils';
import { EntityAutocompleteComponent } from '../../shared/entity-autocomplete.component';
import { MedicationApiService } from '../../medications/services/medication-api.service';
import { MedicationResponse } from '../../medications/models/medication.models';

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
    EntityAutocompleteComponent,
  ],
  templateUrl: './medical-order-form-dialog.component.html',
  styleUrl: './medical-order-form-dialog.component.scss',
})
export class MedicalOrderFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MedicalOrderApiService);
  private readonly medicalCareApi = inject(MedicalCareApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly medicationApi = inject(MedicationApiService);
  private readonly dialogRef = inject(MatDialogRef<MedicalOrderFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly dialogData = inject<MedicalOrderFormDialogData>(MAT_DIALOG_DATA);

  readonly orderTypes = [...MEDICAL_ORDER_TYPES];
  readonly statuses = [...MEDICAL_ORDER_STATUSES];
  readonly priorityPresets = [...MEDICAL_ORDER_PRIORITY_PRESETS];
  extraPriorities: string[] = [];

  medicalCareOptions: EntityPickerOption[] = [];
  medications: MedicationResponse[] = [];
  medicationsLoading = false;
  catalogError: string | null = null;

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    medicalCareId: ['', [requiredPositiveInteger()]],
    orderType: ['LABORATORIO', [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(250)]],
    priority: ['NORMAL', [Validators.required, Validators.maxLength(120)]],
    status: ['PENDIENTE', [Validators.required]],
    observations: ['', [Validators.maxLength(2000)]],
    pharmacyLines: this.fb.array([]),
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'create') {
      this.extraPriorities = [];
    }
    this.loading = true;
    forkJoin({
      cares: this.medicalCareApi.list(),
      patients: this.patientApi.list(),
    }).subscribe({
      next: ({ cares, patients }) => {
        this.medicalCareOptions = buildMedicalCareOptions(cares, patientsToMap(patients));
        this.catalogError = null;
        if (this.dialogData.mode === 'edit' && this.dialogData.medicalOrderId != null) {
          this.api.getById(this.dialogData.medicalOrderId).subscribe({
            next: (o) => this.patchFrom(o),
            error: (err: unknown) => this.failLoad(err),
          });
        } else {
          this.loading = false;
        }
      },
      error: (err: unknown) => this.failLoad(err),
    });

    this.form.controls.orderType.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((orderType) => {
      if (orderType === 'FARMACIA') {
        this.ensureMedicationsLoaded();
      }
    });
  }

  private ensureMedicationsLoaded(): void {
    if (this.medications.length > 0 || this.medicationsLoading) {
      return;
    }
    this.medicationsLoading = true;
    this.medicationApi.list().subscribe({
      next: (medications) => {
        this.medicationsLoading = false;
        this.medications = medications.filter((m) => m.active);
      },
      error: (err: unknown) => {
        this.medicationsLoading = false;
        this.snackBar.open(
          getHttpErrorMessage(err, 'No se pudo cargar el catálogo de medicamentos.'),
          'Cerrar',
          { duration: 7000 },
        );
      },
    });
  }

  get pharmacyLines(): FormArray {
    return this.form.controls.pharmacyLines;
  }

  get isPharmacyOrder(): boolean {
    return this.form.controls.orderType.value === 'FARMACIA';
  }

  get pharmacyLinesLocked(): boolean {
    const st = this.form.controls.status.value ?? '';
    return st === 'COMPLETADO' || st === 'ANULADO';
  }

  addPharmacyLine(): void {
    if (this.pharmacyLinesLocked) {
      return;
    }
    this.pharmacyLines.push(this.createPharmacyLineGroup());
  }

  removePharmacyLine(index: number): void {
    if (this.pharmacyLinesLocked) {
      return;
    }
    this.pharmacyLines.removeAt(index);
  }

  private createPharmacyLineGroup(medicationId = '', quantity = 1) {
    return this.fb.group({
      medicationId: [medicationId, [requiredPositiveInteger()]],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
    });
  }

  private failLoad(err: unknown): void {
    this.loading = false;
    this.catalogError = 'No se pudieron cargar los catálogos.';
    this.snackBar.open(getHttpErrorMessage(err, this.catalogError), 'Cerrar', { duration: 7000 });
    this.dialogRef.close(false);
  }

  private patchFrom(o: MedicalOrderResponse): void {
    const finish = (): void => {
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
      if (o.orderType === 'FARMACIA') {
        this.ensureMedicationsLoaded();
      }
    };

    if (o.orderType === 'FARMACIA' && this.dialogData.medicalOrderId != null) {
      this.api.listPharmacyLines(this.dialogData.medicalOrderId).subscribe({
        next: (lines) => {
          this.setPharmacyLines(lines);
          finish();
        },
        error: (err: unknown) => {
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudieron cargar las líneas de farmacia.'), 'Cerrar', {
            duration: 7000,
          });
          finish();
        },
      });
    } else {
      finish();
    }
  }

  private setPharmacyLines(lines: PharmacyOrderLineResponse[]): void {
    this.pharmacyLines.clear();
    for (const line of lines) {
      this.pharmacyLines.push(this.createPharmacyLineGroup(String(line.medicationId), line.quantity));
    }
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
      this.api
        .create(body)
        .pipe(switchMap((created) => this.savePharmacyLinesIfNeeded(created.id, v.orderType as string)))
        .subscribe({
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
      const orderId = this.dialogData.medicalOrderId;
      this.api
        .update(orderId, body)
        .pipe(switchMap(() => this.savePharmacyLinesIfNeeded(orderId, v.orderType as string)))
        .subscribe({
          next: () => this.ok(),
          error: (e) => this.err(e),
        });
    } else {
      this.saving = false;
      this.snackBar.open('No se pudo guardar: falta el identificador.', 'Cerrar', { duration: 6000 });
    }
  }

  private savePharmacyLinesIfNeeded(orderId: number, orderType: string): Observable<void> {
    if (orderType !== 'FARMACIA' || this.pharmacyLinesLocked) {
      return of(undefined);
    }
    const lines: PharmacyOrderLineItemPayload[] = [];
    for (const row of this.pharmacyLines.controls) {
      const medicationId = parsePositiveInt(row.get('medicationId')?.value);
      const quantity = Number(row.get('quantity')?.value);
      if (medicationId == null || !Number.isFinite(quantity) || quantity < 1) {
        continue;
      }
      lines.push({ medicationId, quantity: Math.trunc(quantity) });
    }
    return this.api.replacePharmacyLines(orderId, { lines }).pipe(map(() => undefined));
  }

  medicationLabel(m: MedicationResponse): string {
    const unit = m.unit?.trim() ? ` ${m.unit.trim()}` : '';
    return `${m.name} — stock ${m.currentStock}${unit}`;
  }

  medicationOptionValue(id: number): string {
    return String(id);
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
