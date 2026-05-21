import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ROLES_PATIENTS_MUTATE } from '../../../core/constants/role-routes';
import { AuthService } from '../../../core/services/auth.service';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog.component';
import { InsuranceResponse } from '../models/patient-insurance.models';
import { PatientResponse } from '../models/patient.models';
import { PatientApiService } from '../services/patient-api.service';
import {
  PatientInsuranceFormDialogComponent,
  PatientInsuranceFormDialogData,
} from './patient-insurance-form-dialog.component';

@Component({
  selector: 'app-patient-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
  ],
  templateUrl: './patient-detail-dialog.component.html',
  styleUrl: './patient-detail-dialog.component.scss',
})
export class PatientDetailDialogComponent implements OnInit {
  readonly data = inject<PatientResponse>(MAT_DIALOG_DATA);
  private readonly api = inject(PatientApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutatePatients = this.auth.hasAnyRole(ROLES_PATIENTS_MUTATE);

  insurances: InsuranceResponse[] = [];
  insuranceLoading = false;
  insuranceError: string | null = null;
  includeInactiveInsurances = false;

  private static readonly AUDIT_RETAIN =
    'El registro permanecerá en el sistema para auditoría e historial.';

  ngOnInit(): void {
    this.loadInsurances();
  }

  loadInsurances(): void {
    this.insuranceLoading = true;
    this.insuranceError = null;
    this.api.listInsurances(this.data.id, this.includeInactiveInsurances).subscribe({
      next: (rows) => {
        this.insuranceLoading = false;
        this.insurances = rows;
      },
      error: (err: unknown) => {
        this.insuranceLoading = false;
        this.insuranceError = getHttpErrorMessage(err, 'No se pudieron cargar los seguros.');
      },
    });
  }

  coverageDisplay(row: InsuranceResponse): number {
    return typeof row.coveragePercent === 'number'
      ? row.coveragePercent
      : Number(String(row.coveragePercent ?? '').replace(',', '.'));
  }

  datesLabel(row: InsuranceResponse): string {
    const a = row.startDate?.substring(0, 10) ?? '—';
    const b = row.endDate?.substring(0, 10) ?? '—';
    return `${a} → ${b}`;
  }

  openInsuranceCreate(): void {
    this.dialog
      .open<PatientInsuranceFormDialogComponent, PatientInsuranceFormDialogData, boolean>(
        PatientInsuranceFormDialogComponent,
        { width: '480px', maxWidth: '95vw', data: { patientId: this.data.id, mode: 'create' } },
      )
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.loadInsurances();
        }
      });
  }

  openInsuranceEdit(row: InsuranceResponse): void {
    this.dialog
      .open<PatientInsuranceFormDialogComponent, PatientInsuranceFormDialogData, boolean>(
        PatientInsuranceFormDialogComponent,
        {
          width: '480px',
          maxWidth: '95vw',
          data: { patientId: this.data.id, mode: 'edit', insurance: row },
        },
      )
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.loadInsurances();
        }
      });
  }

  setIncludeInactiveInsurances(checked: boolean): void {
    this.includeInactiveInsurances = checked;
    this.loadInsurances();
  }

  confirmDeleteInsurance(row: InsuranceResponse): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Desactivar seguro',
          message: `¿Desactivar el seguro de «${row.insurerName}» (póliza ${row.policyNumber})?\n\n${PatientDetailDialogComponent.AUDIT_RETAIN}`,
          confirmLabel: 'Desactivar',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.api.deleteInsurance(this.data.id, row.id).subscribe({
          next: () => {
            this.snackBar.open('Seguro desactivado.', 'Cerrar', { duration: 4000 });
            this.loadInsurances();
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo desactivar el seguro.'), 'Cerrar', {
              duration: 7000,
            });
          },
        });
      });
  }
}
