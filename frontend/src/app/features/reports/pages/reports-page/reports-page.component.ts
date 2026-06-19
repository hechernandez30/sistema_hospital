import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import {
  ADMISSION_REPORT_COLUMNS,
  APPOINTMENT_REPORT_COLUMNS,
  LABORATORY_REPORT_COLUMNS,
  LOW_STOCK_REPORT_COLUMNS,
  PAYMENT_REPORT_COLUMNS,
} from '../../utils/report-column-definitions';
import { exportReportCsv, exportReportPdf, ReportExportColumn } from '../../utils/report-export.utils';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
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

  exportAppointmentsCsv(): void {
    this.exportCsv('reporte_citas', APPOINTMENT_REPORT_COLUMNS, this.appointments);
  }

  exportAppointmentsPdf(): void {
    this.exportPdf('Reporte de citas', 'reporte_citas', APPOINTMENT_REPORT_COLUMNS, this.appointments);
  }

  exportAdmissionsCsv(): void {
    this.exportCsv('reporte_admisiones', ADMISSION_REPORT_COLUMNS, this.admissions);
  }

  exportAdmissionsPdf(): void {
    this.exportPdf('Reporte de admisiones', 'reporte_admisiones', ADMISSION_REPORT_COLUMNS, this.admissions);
  }

  exportPaymentsCsv(): void {
    this.exportCsv('reporte_pagos', PAYMENT_REPORT_COLUMNS, this.payments);
  }

  exportPaymentsPdf(): void {
    this.exportPdf('Reporte de pagos', 'reporte_pagos', PAYMENT_REPORT_COLUMNS, this.payments);
  }

  exportLowStockCsv(): void {
    this.exportCsv('reporte_stock_bajo', LOW_STOCK_REPORT_COLUMNS, this.lowStock);
  }

  exportLowStockPdf(): void {
    this.exportPdf('Medicamentos con stock bajo', 'reporte_stock_bajo', LOW_STOCK_REPORT_COLUMNS, this.lowStock);
  }

  exportLaboratoryCsv(): void {
    this.exportCsv('reporte_laboratorio', LABORATORY_REPORT_COLUMNS, this.laboratory);
  }

  exportLaboratoryPdf(): void {
    this.exportPdf('Reporte de laboratorio', 'reporte_laboratorio', LABORATORY_REPORT_COLUMNS, this.laboratory);
  }

  private exportCsv<T>(fileName: string, columns: ReportExportColumn<T>[], rows: readonly T[]): void {
    if (!this.ensureExportable(rows)) {
      return;
    }
    exportReportCsv(fileName, columns as ReportExportColumn<unknown>[], rows);
  }

  private exportPdf<T>(title: string, fileName: string, columns: ReportExportColumn<T>[], rows: readonly T[]): void {
    if (!this.ensureExportable(rows)) {
      return;
    }
    exportReportPdf(title, fileName, columns as ReportExportColumn<unknown>[], rows);
  }

  private ensureExportable(rows: readonly unknown[]): boolean {
    if (!rows.length) {
      this.snackBar.open('No hay datos para exportar.', 'Cerrar', { duration: 5000 });
      return false;
    }
    return true;
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
