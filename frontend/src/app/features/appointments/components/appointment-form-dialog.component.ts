import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
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
import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AppointmentApiService } from '../services/appointment-api.service';
import {
  APPOINTMENT_STATUSES,
  AppointmentCreatePayload,
  AppointmentUpdatePayload,
} from '../models/appointment.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import {
  datetimeLocalToApi,
  apiToDatetimeLocal,
  addMinutesToDatetimeLocal,
} from '../../shared/datetime-local';
import { optionalPositiveInteger, parsePositiveInt, requiredPositiveInteger } from '../../shared/form-validators';
import { SpecialtyApiService } from '../../specialties/services/specialty-api.service';
import { SpecialtyResponse } from '../../specialties/models/specialty.models';
import { UserApiService } from '../../users/services/user-api.service';
import { UserResponse } from '../../users/models/user.models';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_ADMIN, ROLES_RRHH_SPECIALTIES } from '../../../core/constants/role-routes';
import { appointmentStatusChipClass } from '../appointment-status-chip';
import { PatientApiService } from '../../patients/services/patient-api.service';
import { PatientResponse } from '../../patients/models/patient.models';
import { StaffResponse } from '../../staff/models/staff.models';
import { StaffApiService } from '../../staff/services/staff-api.service';
import { EntityPickerOption } from '../../shared/entity-picker.models';
import {
  buildAppointmentDoctorOptions,
  buildAppointmentPatientOptions,
} from '../appointment-page.utils';
import { EntityAutocompleteComponent } from '../../shared/entity-autocomplete.component';
import { SessionUserFieldComponent } from '../../shared/session-user-field.component';
import { resolveActorUserIdForSubmit } from '../../shared/session-user.utils';
import { DatetimeLocalFieldComponent } from '../../shared/datetime-local-field.component';

export interface AppointmentFormPrefill {
  doctorId?: number;
  specialtyId?: number | null;
  startAt?: string;
  endAt?: string;
}

export interface AppointmentFormDialogData {
  mode: 'create' | 'edit';
  appointmentId?: number;
  prefill?: AppointmentFormPrefill;
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
    NgClass,
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
    SessionUserFieldComponent,
    DatetimeLocalFieldComponent,
  ],
  templateUrl: './appointment-form-dialog.component.html',
  styleUrl: './appointment-form-dialog.component.scss',
})
export class AppointmentFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AppointmentApiService);
  private readonly specialtyApi = inject(SpecialtyApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly staffApi = inject(StaffApiService);
  private readonly userApi = inject(UserApiService);
  private readonly auth = inject(AuthService);
  private readonly isAdmin = this.auth.hasAnyRole([ROLE_ADMIN]);
  private readonly dialogRef = inject(MatDialogRef<AppointmentFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<AppointmentFormDialogData>(MAT_DIALOG_DATA);

  readonly canPickSpecialtyCatalog = this.auth.hasAnyRole(ROLES_RRHH_SPECIALTIES);
  readonly statuses = [...APPOINTMENT_STATUSES];
  specialties: SpecialtyResponse[] = [];
  patientOptions: EntityPickerOption[] = [];
  doctorOptions: EntityPickerOption[] = [];
  catalogError: string | null = null;

  loading = false;
  saving = false;
  /** En edición: conserva el usuario que registró originalmente la cita. */
  private preservedActorUserId: number | null = null;

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
    },
    { validators: [rangeValidator] },
  );

  ngOnInit(): void {
    const specs$ = this.canPickSpecialtyCatalog ? this.specialtyApi.list() : of([]);
    const catalog$ = forkJoin({
      patients: this.patientApi.list(),
      staff: this.staffApi.list(),
      specialties: specs$,
      users: this.isAdmin ? this.userApi.list() : of([] as UserResponse[]),
    });
    if (this.dialogData.mode === 'edit' && this.dialogData.appointmentId != null) {
      this.loading = true;
      forkJoin({
        catalog: catalog$,
        apt: this.api.getById(this.dialogData.appointmentId),
      })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
        next: ({ catalog, apt }) => {
          this.applyCatalog(catalog.patients, catalog.staff, catalog.specialties, catalog.users, apt.doctorId);
          this.form.patchValue({
              patientId: String(apt.patientId),
              doctorId: String(apt.doctorId),
              specialtyId: apt.specialtyId != null ? String(apt.specialtyId) : '',
              startAt: apiToDatetimeLocal(apt.startAt),
              endAt: apiToDatetimeLocal(apt.endAt),
              reason: apt.reason ?? '',
              status: apt.status,
              notifyEmail: apt.notifyEmail,
              notifySms: apt.notifySms,
              notifyWhatsapp: apt.notifyWhatsapp,
            });
            this.preservedActorUserId = apt.createdByUserId;
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la cita o especialidades.'), 'Cerrar', {
              duration: 7000,
            });
            this.dialogRef.close(false);
          },
        });
    } else {
      this.loading = true;
      catalog$
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: ({ patients, staff, specialties, users }) => {
            this.applyCatalog(patients, staff, specialties, users);
            this.applyCreatePrefill();
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudieron cargar pacientes o personal.'), 'Cerrar', {
              duration: 7000,
            });
            this.dialogRef.close(false);
          },
        });
    }
  }

  private applyCatalog(
    patients: PatientResponse[],
    staff: StaffResponse[],
    specialties: SpecialtyResponse[],
    users: UserResponse[] = [],
    includeDoctorId?: number | null,
  ): void {
    this.specialties = specialties;
    this.catalogError = null;
    const userById = new Map(users.map((u) => [u.id, u] as const));
    this.patientOptions = buildAppointmentPatientOptions(patients);
    this.doctorOptions = buildAppointmentDoctorOptions(
      staff,
      specialties,
      true,
      userById,
      includeDoctorId ?? null,
    );
  }

  private applyCreatePrefill(): void {
    const pre = this.dialogData.prefill;
    if (this.dialogData.mode !== 'create' || !pre) {
      return;
    }
    const patch: Record<string, string> = {};
    if (pre.doctorId != null) {
      patch['doctorId'] = String(pre.doctorId);
    }
    if (pre.specialtyId != null) {
      patch['specialtyId'] = String(pre.specialtyId);
    }
    if (pre.startAt) {
      patch['startAt'] = pre.startAt;
    }
    if (pre.endAt) {
      patch['endAt'] = pre.endAt;
    } else if (pre.startAt) {
      const suggested = addMinutesToDatetimeLocal(pre.startAt, 30);
      if (suggested) {
        patch['endAt'] = suggested;
      }
    }
    if (Object.keys(patch).length) {
      this.form.patchValue(patch);
    }
  }

  statusChip(status: string): string {
    return appointmentStatusChipClass(status);
  }

  /** Sugerencia opcional usando `durationMinutes` del catálogo (sin nuevo contrato). Solo tras confirmación explícita. */
  suggestEndFromSpecialtyDuration(): void {
    const specId = parsePositiveInt(this.form.controls.specialtyId.value);
    const startRaw = this.form.controls.startAt.value?.trim();
    if (!specId || !startRaw) {
      this.snackBar.open('Seleccione especialidad con duración conocida y hora de inicio.', 'Cerrar', { duration: 5000 });
      return;
    }
    const row = this.specialties.find((x) => x.id === specId);
    const mins = row?.durationMinutes;
    if (mins == null || mins < 1) {
      this.snackBar.open('Esta especialidad no tiene duración en minutos en el sistema.', 'Cerrar', { duration: 5000 });
      return;
    }
    const nextEnd = addMinutesToDatetimeLocal(startRaw, mins);
    if (!nextEnd) {
      this.snackBar.open('Revise que la fecha/hora de inicio sea válida.', 'Cerrar', { duration: 5000 });
      return;
    }
    this.form.patchValue({ endAt: nextEnd });
    this.form.markAllAsTouched();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open(
        'Revise los campos: la hora de fin debe ser estrictamente posterior a la de inicio.',
        'Cerrar',
        { duration: 6500 },
      );
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
    const t0 = new Date(startAt).getTime();
    const t1 = new Date(endAt).getTime();
    if (Number.isNaN(t0) || Number.isNaN(t1) || t1 <= t0) {
      this.snackBar.open('La fecha/hora de fin debe ser mayor que la de inicio.', 'Cerrar', { duration: 6000 });
      return;
    }
    const now = Date.now();
    if (t0 <= now || t1 <= now) {
      this.snackBar.open('Las fechas de inicio y fin deben ser futuras.', 'Cerrar', {
        duration: 6000,
      });
      return;
    }
    this.saving = true;
    const specialtyId = parsePositiveInt(v.specialtyId);
    const createdByUserId = resolveActorUserIdForSubmit(
      this.auth,
      this.dialogData.mode,
      this.preservedActorUserId,
    );
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
