import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
import { AdmissionApiService } from '../services/admission-api.service';
import {
  ADMISSION_STATUS_LABELS,
  ADMISSION_STATUSES,
  ADMISSION_TYPES,
  ADMISSION_TYPE_LABELS,
  AdmissionCreatePayload,
  AdmissionUpdatePayload,
  VALIDATION_SOURCES,
  VALIDATION_SOURCE_LABELS,
} from '../models/admission.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import { datetimeLocalToApi } from '../../shared/datetime-local';
import { optionalPositiveInteger, parsePositiveInt, requiredPositiveInteger } from '../../shared/form-validators';
import { PatientApiService } from '../../patients/services/patient-api.service';
import { AppointmentApiService } from '../../appointments/services/appointment-api.service';
import { EntityPickerOption } from '../../shared/entity-picker.models';
import {
  buildAppointmentOptions,
  buildPatientOptions,
  patientsToMap,
  staffToMap,
} from '../../shared/entity-picker.utils';
import { EntityAutocompleteComponent } from '../../shared/entity-autocomplete.component';
import { StaffApiService } from '../../staff/services/staff-api.service';

export interface AdmissionFormDialogData {
  mode: 'create' | 'edit';
  admissionId?: number;
}

@Component({
  selector: 'app-admission-form-dialog',
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
    EntityAutocompleteComponent,
  ],
  templateUrl: './admission-form-dialog.component.html',
  styleUrl: './admission-form-dialog.component.scss',
})
export class AdmissionFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdmissionApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly appointmentApi = inject(AppointmentApiService);
  private readonly staffApi = inject(StaffApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<AdmissionFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<AdmissionFormDialogData>(MAT_DIALOG_DATA);

  readonly types = [...ADMISSION_TYPES];
  readonly statuses = [...ADMISSION_STATUSES];
  readonly validationSources = [...VALIDATION_SOURCES];

  readonly typeLabel = ADMISSION_TYPE_LABELS;
  readonly statusLabel = ADMISSION_STATUS_LABELS;
  readonly validationLabel = VALIDATION_SOURCE_LABELS;

  patientOptions: EntityPickerOption[] = [];
  appointmentOptions: EntityPickerOption[] = [];
  catalogError: string | null = null;
  private allAppointments: import('../../appointments/models/appointment.models').AppointmentResponse[] = [];
  private patientMap = new Map<number, import('../../patients/models/patient.models').PatientResponse>();
  private staffMap = new Map<number, import('../../staff/models/staff.models').StaffResponse>();

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    patientId: ['', [requiredPositiveInteger()]],
    appointmentId: ['', [optionalPositiveInteger()]],
    admissionType: ['CONSULTA', [Validators.required]],
    status: ['' as string],
    currentArea: ['', [Validators.maxLength(100)]],
    room: ['', [Validators.maxLength(30)]],
    financialValidationOk: [false],
    validationSource: ['' as string],
    observations: [''],
    dischargeDate: [''],
    transferredArea: ['', [Validators.maxLength(100)]],
    admittedByUserId: ['', [optionalPositiveInteger()]],
  });

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      patients: this.patientApi.list(),
      appointments: this.appointmentApi.list(),
      staff: this.staffApi.list(),
    }).subscribe({
      next: ({ patients, appointments, staff }) => {
        this.patientMap = patientsToMap(patients);
        this.staffMap = staffToMap(staff);
        this.allAppointments = appointments;
        this.patientOptions = buildPatientOptions(patients);
        this.refreshAppointmentOptions(this.form.controls.patientId.value);
        this.catalogError = null;
        if (this.dialogData.mode === 'edit' && this.dialogData.admissionId != null) {
          this.loadAdmission(this.dialogData.admissionId);
        } else {
          this.form.controls.status.clearValidators();
          this.form.controls.status.updateValueAndValidity();
          this.loading = false;
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.catalogError = 'No se pudieron cargar catálogos.';
        this.snackBar.open(getHttpErrorMessage(err, this.catalogError), 'Cerrar', { duration: 7000 });
        this.dialogRef.close(false);
      },
    });

    this.form.controls.patientId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pid) => {
      this.refreshAppointmentOptions(pid);
      const apt = parsePositiveInt(this.form.controls.appointmentId.value);
      if (apt != null) {
        const patientId = parsePositiveInt(pid);
        const row = this.allAppointments.find((a) => a.id === apt);
        if (patientId == null || !row || row.patientId !== patientId) {
          this.form.controls.appointmentId.setValue('');
        }
      }
    });
  }

  private loadAdmission(id: number): void {
    this.api.getById(id).subscribe({
      next: (a) => {
        this.loading = false;
        this.refreshAppointmentOptions(String(a.patientId));
        this.form.patchValue({
            patientId: String(a.patientId),
            appointmentId: a.appointmentId != null ? String(a.appointmentId) : '',
            admissionType: a.admissionType,
            status: a.status,
            currentArea: a.currentArea ?? '',
            room: a.room ?? '',
            financialValidationOk: a.financialValidationOk,
            validationSource: a.validationSource ?? '',
            observations: a.observations ?? '',
            dischargeDate: a.dischargeDate ? a.dischargeDate.slice(0, 16) : '',
            transferredArea: a.transferredArea ?? '',
            admittedByUserId: a.admittedByUserId != null ? String(a.admittedByUserId) : '',
          });
          this.form.controls.status.setValidators([Validators.required]);
          this.form.controls.status.updateValueAndValidity();
        },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la admisión.'), 'Cerrar', { duration: 6000 });
        this.dialogRef.close(false);
      },
    });
  }

  private refreshAppointmentOptions(patientIdRaw: unknown): void {
    const patientId = parsePositiveInt(patientIdRaw);
    this.appointmentOptions = buildAppointmentOptions(this.allAppointments, this.patientMap, this.staffMap, {
      patientId: patientId ?? undefined,
      activeOnly: true,
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
    if (patientId == null) {
      this.snackBar.open('ID de paciente no válido.', 'Cerrar', { duration: 5000 });
      return;
    }

    const effectiveStatusCreate = ((v.status ?? '').trim() || 'ADMITIDO').toUpperCase();
    const editStatus = (v.status ?? '').trim().toUpperCase();
    const checkFin =
      this.dialogData.mode === 'create' ? effectiveStatusCreate !== 'RECHAZADO' : editStatus !== 'RECHAZADO';
    if (checkFin) {
      if (!v.financialValidationOk) {
        this.snackBar.open(
          'Cuando el estado no es RECHAZADO, marque «Validación financiera OK» (seguro vigente o pago en sitio).',
          'Cerrar',
          { duration: 8000 },
        );
        return;
      }
      const vsTrim = v.validationSource?.trim();
      if (!vsTrim) {
        this.snackBar.open('Seleccione el origen: SEGURO o PAGO_SITIO.', 'Cerrar', { duration: 7000 });
        return;
      }
    }

    this.saving = true;
    const appointmentId = parsePositiveInt(v.appointmentId);
    const admittedByUserId = parsePositiveInt(v.admittedByUserId);
    const discharge = v.dischargeDate?.trim() ? datetimeLocalToApi(v.dischargeDate.trim()) : null;
    const vs = v.validationSource?.trim();
    const validationSource = vs ? vs : null;
    if (this.dialogData.mode === 'create') {
      const body: AdmissionCreatePayload = {
        patientId,
        appointmentId,
        admissionType: v.admissionType as string,
        status: v.status?.trim() ? v.status.trim() : null,
        currentArea: v.currentArea?.trim() || null,
        room: v.room?.trim() || null,
        financialValidationOk: v.financialValidationOk ?? null,
        validationSource,
        observations: v.observations?.trim() || null,
        dischargeDate: discharge,
        transferredArea: v.transferredArea?.trim() || null,
        admittedByUserId,
      };
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.admissionId != null) {
      const body: AdmissionUpdatePayload = {
        patientId,
        appointmentId,
        admissionType: v.admissionType as string,
        status: (v.status ?? '').trim(),
        currentArea: v.currentArea?.trim() || null,
        room: v.room?.trim() || null,
        financialValidationOk: !!v.financialValidationOk,
        validationSource: validationSource ?? '',
        observations: v.observations?.trim() || null,
        dischargeDate: discharge,
        transferredArea: v.transferredArea?.trim() || null,
        admittedByUserId,
      };
      this.api.update(this.dialogData.admissionId, body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else {
      this.saving = false;
      this.snackBar.open('No se pudo guardar: falta el identificador de la admisión.', 'Cerrar', { duration: 6000 });
    }
  }

  private ok(): void {
    this.saving = false;
    this.snackBar.open('Admisión guardada correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar la admisión.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
