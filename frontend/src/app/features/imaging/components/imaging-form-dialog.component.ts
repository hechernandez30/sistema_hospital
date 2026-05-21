import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ImagingApiService } from '../services/imaging-api.service';
import {
  IMAGING_STATUSES,
  ImagingStudyCreatePayload,
  ImagingStudyResponse,
  ImagingStudyUpdatePayload,
} from '../models/imaging.models';
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

export interface ImagingFormDialogData {
  mode: 'create' | 'edit';
  imagingId?: number;
}

@Component({
  selector: 'app-imaging-form-dialog',
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
  templateUrl: './imaging-form-dialog.component.html',
  styleUrl: './imaging-form-dialog.component.scss',
})
export class ImagingFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ImagingApiService);
  private readonly medicalOrderApi = inject(MedicalOrderApiService);
  private readonly medicalCareApi = inject(MedicalCareApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly dialogRef = inject(MatDialogRef<ImagingFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<ImagingFormDialogData>(MAT_DIALOG_DATA);

  readonly statuses = [...IMAGING_STATUSES];
  medicalOrderOptions: EntityPickerOption[] = [];
  catalogError: string | null = null;
  private careById = new Map<number, MedicalCareResponse>();

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    medicalOrderId: ['', [requiredPositiveInteger()]],
    studyType: ['', [Validators.required, Validators.maxLength(100)]],
    scheduledAt: [''],
    performedAt: [''],
    reportResult: [''],
    resultFile: [''],
    status: ['PENDIENTE', [Validators.required]],
    responsibleStaffId: ['', [optionalPositiveInteger()]],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'edit') {
      this.form.controls.medicalOrderId.clearValidators();
      this.form.controls.medicalOrderId.updateValueAndValidity({ emitEvent: false });
      if (this.dialogData.imagingId != null) {
        this.loading = true;
        this.api.getById(this.dialogData.imagingId).subscribe({
          next: (r) => this.patchFrom(r),
          error: (err: unknown) => {
            this.loading = false;
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el estudio.'), 'Cerrar', { duration: 6000 });
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
          orderType: 'IMAGEN',
          excludeAnulled: true,
        });
        this.catalogError = null;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.catalogError = 'No se pudieron cargar órdenes de imagen.';
        this.snackBar.open(getHttpErrorMessage(err, this.catalogError), 'Cerrar', { duration: 7000 });
        this.dialogRef.close(false);
      },
    });
  }

  private patchFrom(r: ImagingStudyResponse): void {
    this.loading = false;
    this.form.patchValue({
      medicalOrderId: '',
      studyType: r.studyType,
      scheduledAt: apiToDatetimeLocal(r.scheduledAt),
      performedAt: apiToDatetimeLocal(r.performedAt),
      reportResult: r.reportResult ?? '',
      resultFile: r.resultFile ?? '',
      status: r.status as (typeof IMAGING_STATUSES)[number],
      responsibleStaffId: r.responsibleStaffId != null ? String(r.responsibleStaffId) : '',
    });
  }

  private emptyToNull(s: string | null | undefined): string | null {
    const t = s?.trim();
    return t ? t : null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    if (this.dialogData.mode === 'create') {
      const medicalOrderId = parsePositiveInt(v.medicalOrderId);
      if (medicalOrderId == null) {
        this.snackBar.open('Indique un ID de orden médica válido (entero positivo).', 'Cerrar', { duration: 6000 });
        return;
      }
      const sch = v.scheduledAt?.trim() ? datetimeLocalToApi(v.scheduledAt.trim()) : '';
      const perf = v.performedAt?.trim() ? datetimeLocalToApi(v.performedAt.trim()) : '';
      this.saving = true;
      const body: ImagingStudyCreatePayload = {
        medicalOrderId,
        studyType: (v.studyType ?? '').trim(),
        scheduledAt: sch || null,
        performedAt: perf || null,
        reportResult: this.emptyToNull(v.reportResult),
        resultFile: this.emptyToNull(v.resultFile),
        status: v.status as string,
        responsibleStaffId: parsePositiveInt(v.responsibleStaffId),
      };
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.imagingId != null) {
      const sch = v.scheduledAt?.trim() ? datetimeLocalToApi(v.scheduledAt.trim()) : '';
      const perf = v.performedAt?.trim() ? datetimeLocalToApi(v.performedAt.trim()) : '';
      this.saving = true;
      const body: ImagingStudyUpdatePayload = {
        studyType: (v.studyType ?? '').trim(),
        scheduledAt: sch || null,
        performedAt: perf || null,
        reportResult: this.emptyToNull(v.reportResult),
        resultFile: this.emptyToNull(v.resultFile),
        status: v.status as string,
        responsibleStaffId: parsePositiveInt(v.responsibleStaffId),
      };
      this.api.update(this.dialogData.imagingId, body).subscribe({
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
    this.snackBar.open('Estudio guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el estudio de imagen.'), 'Cerrar', {
      duration: 7000,
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
