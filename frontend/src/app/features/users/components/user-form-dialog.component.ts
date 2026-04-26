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
import { UserApiService } from '../services/user-api.service';
import { UserCreatePayload, UserUpdatePayload, USER_STATES } from '../models/user.models';
import { RoleApiService } from '../../roles/services/role-api.service';
import { RoleResponse } from '../../roles/models/role.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';

export interface UserFormDialogData {
  mode: 'create' | 'edit';
  userId?: number;
}

function optionalPasswordEdit(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = String(control.value ?? '').trim();
    if (!s) {
      return null;
    }
    if (s.length < 8 || s.length > 255) {
      return { passwordLength: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-user-form-dialog',
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
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
})
export class UserFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UserApiService);
  private readonly rolesApi = inject(RoleApiService);
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<UserFormDialogData>(MAT_DIALOG_DATA);

  readonly userStates = [...USER_STATES];

  loading = false;
  saving = false;
  roles: RoleResponse[] = [];
  /** Solo lectura en edición */
  viewUsername = '';

  readonly form = this.fb.group({
    roleId: [null as number | null, Validators.required],
    username: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: [''],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    mfaEnabled: [false],
    state: ['ACTIVO'],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'create') {
      this.form.controls.username.setValidators([Validators.required, Validators.maxLength(100)]);
      this.form.controls.password.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(255),
      ]);
      this.form.controls.state.clearValidators();
      this.form.controls.state.updateValueAndValidity({ emitEvent: false });
    } else {
      this.form.controls.username.clearValidators();
      this.form.controls.password.setValidators([optionalPasswordEdit()]);
      this.form.controls.state.setValidators([Validators.required]);
      this.form.controls.mfaEnabled.clearValidators();
    }

    this.loading = true;
    this.rolesApi.list().subscribe({
      next: (roles) => {
        this.roles = roles;
        if (this.dialogData.mode === 'edit' && this.dialogData.userId != null) {
          this.api.getById(this.dialogData.userId).subscribe({
            next: (u) => {
              this.loading = false;
              this.viewUsername = u.username;
              this.form.patchValue({
                roleId: u.roleId,
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                state: u.state,
                password: '',
              });
            },
            error: (err: unknown) => {
              this.loading = false;
              this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el usuario.'), 'Cerrar', {
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
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la lista de roles.'), 'Cerrar', {
          duration: 6000,
        });
        this.dialogRef.close(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const roleId = v.roleId as number;
    if (this.dialogData.mode === 'create') {
      const body: UserCreatePayload = {
        roleId,
        username: (v.username ?? '').trim(),
        email: (v.email ?? '').trim(),
        password: String(v.password ?? '').trim(),
        firstName: (v.firstName ?? '').trim(),
        lastName: (v.lastName ?? '').trim(),
        mfaEnabled: v.mfaEnabled ? true : false,
      };
      this.saving = true;
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.userId != null) {
      const pwd = String(v.password ?? '').trim();
      const body: UserUpdatePayload = {
        roleId,
        email: (v.email ?? '').trim(),
        firstName: (v.firstName ?? '').trim(),
        lastName: (v.lastName ?? '').trim(),
        state: String(v.state ?? '').trim(),
      };
      if (pwd) {
        body.password = pwd;
      }
      this.saving = true;
      this.api.update(this.dialogData.userId, body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else {
      this.snackBar.open('No se pudo guardar: falta el identificador.', 'Cerrar', { duration: 6000 });
    }
  }

  private ok(): void {
    this.saving = false;
    this.snackBar.open('Usuario guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el usuario.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
