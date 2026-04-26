import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoleApiService } from '../services/role-api.service';
import { RolePayload } from '../models/role.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';

export interface RoleFormDialogData {
  mode: 'create' | 'edit';
  roleId?: number;
}

@Component({
  selector: 'app-role-form-dialog',
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
  templateUrl: './role-form-dialog.component.html',
  styleUrl: './role-form-dialog.component.scss',
})
export class RoleFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RoleApiService);
  private readonly dialogRef = inject(MatDialogRef<RoleFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<RoleFormDialogData>(MAT_DIALOG_DATA);

  loading = false;
  saving = false;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    if (this.dialogData.mode === 'edit' && this.dialogData.roleId != null) {
      this.loading = true;
      this.api.getById(this.dialogData.roleId).subscribe({
        next: (r) => {
          this.loading = false;
          this.form.patchValue({
            name: r.name,
            description: r.description ?? '',
          });
        },
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el rol.'), 'Cerrar', { duration: 6000 });
          this.dialogRef.close(false);
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const desc = (v.description ?? '').trim();
    const body: RolePayload = {
      name: (v.name ?? '').trim(),
      description: desc ? desc : null,
    };
    this.saving = true;
    if (this.dialogData.mode === 'create') {
      this.api.create(body).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.roleId != null) {
      this.api.update(this.dialogData.roleId, body).subscribe({
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
    this.snackBar.open('Rol guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el rol.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
