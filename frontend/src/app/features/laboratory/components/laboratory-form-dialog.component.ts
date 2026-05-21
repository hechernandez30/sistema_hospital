import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LaboratoryApiService } from '../services/laboratory-api.service';
import {
  LAB_REQUESTER_LABELS,
  LAB_REQUEST_TYPE_LABELS,
  LABORATORY_STATUSES,
  laboratoryStatusLabel,
  LaboratoryCreatePayload,
  LaboratoryResponse,
  LaboratoryUpdatePayload,
} from '../models/laboratory.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import { optionalPositiveInteger, parsePositiveInt, requiredPositiveInteger } from '../../shared/form-validators';
import { apiToDatetimeLocal, datetimeLocalToApi } from '../../shared/datetime-local';
import { MedicalOrderApiService } from '../../medical-orders/services/medical-order-api.service';
import { MedicalCareApiService } from '../../medical-cares/services/medical-care-api.service';
import { PatientApiService } from '../../patients/services/patient-api.service';
import { EntityPickerOption } from '../../shared/entity-picker.models';
import { buildMedicalOrderOptions, patientsToMap } from '../../shared/entity-picker.utils';
import { EntityAutocompleteComponent } from '../../shared/entity-autocomplete.component';
import { MedicalCareResponse } from '../../medical-cares/models/medical-care.models';

export interface LaboratoryFormDialogData {
  mode: 'create' | 'edit';
  laboratoryId?: number;
}

@Component({
  selector: 'app-laboratory-form-dialog',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    EntityAutocompleteComponent,
  ],
  templateUrl: './laboratory-form-dialog.component.html',
  styleUrl: './laboratory-form-dialog.component.scss',
})
export class LaboratoryFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LaboratoryApiService);
  private readonly medicalOrderApi = inject(MedicalOrderApiService);
  private readonly medicalCareApi = inject(MedicalCareApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly dialogRef = inject(MatDialogRef<LaboratoryFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<LaboratoryFormDialogData>(MAT_DIALOG_DATA);

  readonly statuses = [...LABORATORY_STATUSES];
  readonly requesterLabels = LAB_REQUESTER_LABELS;
  readonly requestTypeLabels = LAB_REQUEST_TYPE_LABELS;
  readonly sampleValidOptions = [
    { value: '', label: 'Sin indicar' },
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' },
  ];

  medicalOrderOptions: EntityPickerOption[] = [];
  catalogError: string | null = null;
  private careById = new Map<number, MedicalCareResponse>();

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    medicalOrderId: ['', [requiredPositiveInteger()]],
    requesterType: ['' as string],
    requestType: ['' as string],
    recordNumber: ['', [Validators.maxLength(40)]],
    sampleDescription: [''],
    sampleReceived: [false],
    sampleValidChoice: ['' as string],
    incident: [''],
    result: [''],
    attachment: [''],
    status: ['PENDIENTE', [Validators.required]],
    receptionAt: [''],
    resultAt: [''],
    responsibleStaffId: ['', [optionalPositiveInteger()]],
  });

  ngOnInit(): void {
    this.form.controls.sampleDescription.addValidators([Validators.maxLength(8000)]);
    if (this.dialogData.mode === 'create') {
      this.form.controls.sampleDescription.addValidators([Validators.required]);
    }
    this.form.controls.sampleDescription.updateValueAndValidity({ emitEvent: false });

    if (this.dialogData.mode === 'edit') {
      this.form.controls.medicalOrderId.clearValidators();
      this.form.controls.medicalOrderId.updateValueAndValidity({ emitEvent: false });
      if (this.dialogData.laboratoryId != null) {
        this.loading = true;
        this.api.getById(this.dialogData.laboratoryId).subscribe({
          next: (r) => this.patchFrom(r),
          error: (err: unknown) => {
            this.loading = false;
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el registro.'), 'Cerrar', { duration: 6000 });
            this.dialogRef.close(false);
          },
        });
      }
      return;
    }

    this.loading = true;
    forkJoin({
      orders: this.medicalOrderApi.list(),
      cares: this.medicalCareApi.list(),
      patients: this.patientApi.list(),
    }).subscribe({
      next: ({ orders, cares, patients }) => {
        this.careById = new Map(cares.map((c) => [c.id, c] as const));
        this.medicalOrderOptions = buildMedicalOrderOptions(orders, patientsToMap(patients), this.careById, {
          orderType: 'LABORATORIO',
          excludeAnulled: true,
        });
        this.catalogError = null;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.catalogError = 'No se pudieron cargar órdenes de laboratorio.';
        this.snackBar.open(getHttpErrorMessage(err, this.catalogError), 'Cerrar', { duration: 7000 });
        this.dialogRef.close(false);
      },
    });
  }

  private patchFrom(r: LaboratoryResponse): void {
    this.loading = false;
    let svc = '';
    if (r.sampleValid === true) {
      svc = 'true';
    }
    if (r.sampleValid === false) {
      svc = 'false';
    }
    this.form.patchValue({
      medicalOrderId: '',
      requesterType: (r.requesterType ?? '') as '' | 'INTERNO' | 'EXTERNO',
      requestType: (r.requestType ?? '') as '' | 'MUESTRA_MEDICA' | 'LABORATORIO',
      recordNumber: r.recordNumber ?? '',
      sampleDescription: r.sampleDescription ?? '',
      sampleReceived: r.sampleReceived,
      sampleValidChoice: svc,
      incident: r.incident ?? '',
      result: r.result ?? '',
      attachment: r.attachment ?? '',
      status: r.status as (typeof LABORATORY_STATUSES)[number],
      receptionAt: apiToDatetimeLocal(r.receptionAt),
      resultAt: apiToDatetimeLocal(r.resultAt),
      responsibleStaffId: r.responsibleStaffId != null ? String(r.responsibleStaffId) : '',
    });
  }

  private parseSampleValid(choice: string): boolean | null {
    if (choice === 'true') {
      return true;
    }
    if (choice === 'false') {
      return false;
    }
    return null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.sampleDescription.invalid) {
        this.snackBar.open('La descripción de la muestra es obligatoria al crear el registro (CU06/CU07).', 'Cerrar', {
          duration: 8000,
        });
      } else {
        this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      }
      return;
    }
    const v = this.form.getRawValue();
    if (this.dialogData.mode === 'create') {
      const medicalOrderId = parsePositiveInt(v.medicalOrderId);
      if (medicalOrderId == null) {
        this.snackBar.open('Indique un ID de orden médica válido (entero positivo).', 'Cerrar', { duration: 6000 });
        return;
      }
      this.saving = true;
      const body: LaboratoryCreatePayload = {
        medicalOrderId,
        requesterType: this.emptyToNull(v.requesterType),
        requestType: this.emptyToNull(v.requestType),
        recordNumber: this.emptyToNull(v.recordNumber),
        sampleDescription: this.emptyToNull(v.sampleDescription),
        sampleReceived: v.sampleReceived ? true : false,
        sampleValid: this.parseSampleValid(String(v.sampleValidChoice ?? '')),
        incident: this.emptyToNull(v.incident),
        result: this.emptyToNull(v.result),
        attachment: this.emptyToNull(v.attachment),
        status: v.status as string,
        responsibleStaffId: parsePositiveInt(v.responsibleStaffId),
      };
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.laboratoryId != null) {
      this.saving = true;
      const recRaw = v.receptionAt?.trim() ? datetimeLocalToApi(v.receptionAt.trim()) : '';
      const resRaw = v.resultAt?.trim() ? datetimeLocalToApi(v.resultAt.trim()) : '';
      const body: LaboratoryUpdatePayload = {
        requesterType: this.emptyToNull(v.requesterType),
        requestType: this.emptyToNull(v.requestType),
        recordNumber: this.emptyToNull(v.recordNumber),
        sampleDescription: this.emptyToNull(v.sampleDescription),
        sampleReceived: !!v.sampleReceived,
        sampleValid: this.parseSampleValid(String(v.sampleValidChoice ?? '')),
        incident: this.emptyToNull(v.incident),
        result: this.emptyToNull(v.result),
        attachment: this.emptyToNull(v.attachment),
        status: v.status as string,
        receptionAt: recRaw || null,
        resultAt: resRaw || null,
        responsibleStaffId: parsePositiveInt(v.responsibleStaffId),
      };
      this.api.update(this.dialogData.laboratoryId, body).subscribe({
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
    this.snackBar.open('Laboratorio guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el registro de laboratorio.'), 'Cerrar', {
      duration: 7000,
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';

  labStatusCaption(s: string): string {
    return laboratoryStatusLabel(s);
  }

  private emptyToNull(s: string | null | undefined): string | null {
    const t = s?.trim();
    return t ? t : null;
  }
}

