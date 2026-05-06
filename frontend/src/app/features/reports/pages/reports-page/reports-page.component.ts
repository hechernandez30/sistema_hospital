import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';
import {
  AdmissionReportRow,
  AppointmentReportRow,
  LaboratoryReportRow,
  MedicationLowStockRow,
  PaymentReportRow,
} from '../../models/report.models';
import { ReportApiService } from '../../services/report-api.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.scss',
})
export class ReportsPageComponent {
  private readonly api = inject(ReportApiService);
  private readonly snackBar = inject(MatSnackBar);

  appointmentDateFrom = '';
  appointmentDateTo = '';
  appointmentStatus = '';
  appointmentsLoading = false;
  appointments: AppointmentReportRow[] = [];

  admissionDateFrom = '';
  admissionDateTo = '';
  admissionStatus = '';
  admissionsLoading = false;
  admissions: AdmissionReportRow[] = [];

  paymentDateFrom = '';
  paymentDateTo = '';
  paymentStatus = '';
  paymentsLoading = false;
  payments: PaymentReportRow[] = [];

  lowStockLoading = false;
  lowStock: MedicationLowStockRow[] = [];

  laboratoryStatus = '';
  laboratoryLoading = false;
  laboratory: LaboratoryReportRow[] = [];

  readonly appointmentStatuses = ['PROGRAMADA', 'CONFIRMADA', 'CANCELADA', 'EN_CURSO', 'COMPLETADA', 'NO_ASISTIO'];
  readonly admissionStatuses = ['ADMITIDO', 'EN_PROCESO', 'ALTA', 'ANULADO'];
  readonly paymentStatuses = ['PENDIENTE', 'PAGADO', 'ANULADO'];
  readonly laboratoryStatuses = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'RECHAZADO'];

  runAppointments(): void {
    if (!this.validateRange(this.appointmentDateFrom, this.appointmentDateTo)) {
      return;
    }
    this.appointmentsLoading = true;
    this.api.appointments(this.appointmentDateFrom, this.appointmentDateTo, this.appointmentStatus).subscribe({
      next: (rows) => {
        this.appointmentsLoading = false;
        this.appointments = rows;
      },
      error: (err: unknown) => this.reportError(err, () => (this.appointmentsLoading = false)),
    });
  }

  runAdmissions(): void {
    if (!this.validateRange(this.admissionDateFrom, this.admissionDateTo)) {
      return;
    }
    this.admissionsLoading = true;
    this.api.admissions(this.admissionDateFrom, this.admissionDateTo, this.admissionStatus).subscribe({
      next: (rows) => {
        this.admissionsLoading = false;
        this.admissions = rows;
      },
      error: (err: unknown) => this.reportError(err, () => (this.admissionsLoading = false)),
    });
  }

  runPayments(): void {
    if (!this.validateRange(this.paymentDateFrom, this.paymentDateTo)) {
      return;
    }
    this.paymentsLoading = true;
    this.api.payments(this.paymentDateFrom, this.paymentDateTo, this.paymentStatus).subscribe({
      next: (rows) => {
        this.paymentsLoading = false;
        this.payments = rows;
      },
      error: (err: unknown) => this.reportError(err, () => (this.paymentsLoading = false)),
    });
  }

  runLowStock(): void {
    this.lowStockLoading = true;
    this.api.lowStock().subscribe({
      next: (rows) => {
        this.lowStockLoading = false;
        this.lowStock = rows;
      },
      error: (err: unknown) => this.reportError(err, () => (this.lowStockLoading = false)),
    });
  }

  runLaboratory(): void {
    this.laboratoryLoading = true;
    this.api.laboratory(this.laboratoryStatus).subscribe({
      next: (rows) => {
        this.laboratoryLoading = false;
        this.laboratory = rows;
      },
      error: (err: unknown) => this.reportError(err, () => (this.laboratoryLoading = false)),
    });
  }

  exportCsv(name: string, rows: ReadonlyArray<object>): void {
    if (!rows.length) {
      this.snackBar.open('No hay datos para exportar.', 'Cerrar', { duration: 5000 });
      return;
    }
    const first = rows[0] as Record<string, unknown>;
    const headers = Object.keys(first);
    const csv = [
      headers.join(','),
      ...rows.map((r) => {
        const row = r as Record<string, unknown>;
        return headers.map((h) => csvEscape(row[h])).join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private validateRange(dateFrom: string, dateTo: string): boolean {
    if (!dateFrom || !dateTo) {
      this.snackBar.open('Debe seleccionar fecha inicio y fecha fin.', 'Cerrar', { duration: 5000 });
      return false;
    }
    if (dateFrom > dateTo) {
      this.snackBar.open('Rango inválido: fecha inicio no puede ser mayor que fecha fin.', 'Cerrar', { duration: 6000 });
      return false;
    }
    return true;
  }

  private reportError(err: unknown, onFinally: () => void): void {
    onFinally();
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo generar el reporte.'), 'Cerrar', { duration: 7000 });
  }
}

function csvEscape(value: unknown): string {
  if (value == null) {
    return '';
  }
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}
