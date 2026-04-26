import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { StaffApiService } from '../services/staff-api.service';
import { ATTENDANCE_TYPES, STAFF_TYPES, StaffCreatePayload, StaffResponse, StaffUpdatePayload } from '../models/staff.models';
import { SpecialtyApiService } from '../../specialties/services/specialty-api.service';
import { SpecialtyResponse } from '../../specialties/models/specialty.models';
import { UserApiService } from '../../users/services/user-api.service';
import { UserResponse } from '../../users/models/user.models';
import { AuthService } from '../../../core/services/auth.service';
import { ROLE_ADMIN } from '../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';

export interface StaffFormDialogData {
  mode: 'create' | 'edit';
  staffId?: number;
}

function optionalPositiveInt(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = String(control.value ?? '').trim();
    if (!s) {
      return null;
    }
    if (!/^[1-9][0-9]*$/.test(s)) {
      return { userId: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-staff-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './staff-form-dialog.component.html',
  styleUrl: './staff-form-dialog.component.scss',
})
export class StaffFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StaffApiService);
  private readonly specialtyApi = inject(SpecialtyApiService);
  private readonly userApi = inject(UserApiService);
  private readonly auth = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<StaffFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<StaffFormDialogData>(MAT_DIALOG_DATA);

  readonly isAdmin = this.auth.hasAnyRole([ROLE_ADMIN]);
  readonly staffTypes = [...STAFF_TYPES];
  readonly attendanceTypes = [...ATTENDANCE_TYPES];

  loading = false;
  saving = false;
  specialties: SpecialtyResponse[] = [];
  users: UserResponse[] = [];

  readonly form = this.fb.group({
    staffType: ['', Validators.required],
    employeeCode: ['', [Validators.required, Validators.maxLength(30)]],
    licenseNumber: ['', [Validators.maxLength(50)]],
    schedule: ['', [Validators.maxLength(100)]],
    attendance: [''],
    active: [true],
    hireDate: [''],
    specialtyId: [null as number | null],
    userIdAdmin: [null as number | null],
    userIdRrhh: ['', [optionalPositiveInt()]],
  });

  ngOnInit(): void {
    this.loading = true;
    const spec$ = this.specialtyApi.list();
    const lists$ = this.isAdmin
      ? forkJoin({ specialties: spec$, users: this.userApi.list() })
      : spec$.pipe(map((specialties) => ({ specialties, users: [] as UserResponse[] })));

    lists$.subscribe({
      next: ({ specialties, users }) => {
        this.specialties = specialties;
        this.users = users;
        if (this.dialogData.mode === 'edit' && this.dialogData.staffId != null) {
          this.api.getById(this.dialogData.staffId).subscribe({
            next: (s) => this.patchStaff(s),
            error: (err: unknown) => {
              this.loading = false;
              this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el registro de personal.'), 'Cerrar', {
                duration: 6000,
              });
              this.dialogRef.close(false);
            },
          });
        } else {
          this.loading = false;
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar catálogos.'), 'Cerrar', { duration: 6000 });
        this.dialogRef.close(false);
      },
    });
  }

  private patchStaff(s: StaffResponse): void {
    this.loading = false;
    this.form.patchValue({
      staffType: s.staffType,
      employeeCode: s.employeeCode,
      licenseNumber: s.licenseNumber ?? '',
      schedule: s.schedule ?? '',
      attendance: s.attendance ?? '',
      active: s.active,
      hireDate: s.hireDate ?? '',
      specialtyId: s.specialtyId,
      userIdAdmin: s.userId,
      userIdRrhh: s.userId != null ? String(s.userId) : '',
    });
  }

  private resolveUserId(): number | null {
    if (this.isAdmin) {
      const v = this.form.getRawValue().userIdAdmin;
      return v == null ? null : Number(v);
    }
    const t = String(this.form.getRawValue().userIdRrhh ?? '').trim();
    if (!t) {
      return null;
    }
    return parseInt(t, 10);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const userId = this.resolveUserId();
    const specialtyRaw = v.specialtyId;
    const specialtyId = specialtyRaw == null ? null : Number(specialtyRaw);
    const lic = (v.licenseNumber ?? '').trim();
    const sch = (v.schedule ?? '').trim();
    const att = (v.attendance ?? '').trim();
    const hire = (v.hireDate ?? '').trim();
    const hireDate = hire ? hire : null;

    if (this.dialogData.mode === 'create') {
      const body: StaffCreatePayload = {
        userId,
        specialtyId,
        staffType: String(v.staffType ?? '').trim(),
        employeeCode: String(v.employeeCode ?? '').trim(),
        licenseNumber: lic ? lic : null,
        schedule: sch ? sch : null,
        attendance: att ? att : null,
        active: v.active ? true : false,
        hireDate,
      };
      this.saving = true;
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.staffId != null) {
      const body: StaffUpdatePayload = {
        userId,
        specialtyId,
        staffType: String(v.staffType ?? '').trim(),
        employeeCode: String(v.employeeCode ?? '').trim(),
        licenseNumber: lic ? lic : null,
        schedule: sch ? sch : null,
        attendance: att ? att : null,
        active: v.active ? true : false,
        hireDate,
      };
      this.saving = true;
      this.api.update(this.dialogData.staffId, body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else {
      this.snackBar.open('No se pudo guardar: falta el identificador.', 'Cerrar', { duration: 6000 });
    }
  }

  private ok(): void {
    this.saving = false;
    this.snackBar.open('Personal guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el personal.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
