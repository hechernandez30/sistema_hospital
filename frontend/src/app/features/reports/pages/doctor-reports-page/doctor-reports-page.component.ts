import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
import { forkJoin } from 'rxjs';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';
import { StaffResponse } from '../../../staff/models/staff.models';
import { StaffApiService } from '../../../staff/services/staff-api.service';
import { SpecialtyResponse } from '../../../specialties/models/specialty.models';
import { SpecialtyApiService } from '../../../specialties/services/specialty-api.service';
import {
  DOCTOR_ADMISSION_STATUSES,
  DOCTOR_ADMISSION_TYPES,
  DOCTOR_APPOINTMENT_STATUSES,
  DOCTOR_ATTENDANCE_TYPES,
  DOCTOR_LAB_IMAGING_STATUSES,
  DOCTOR_ORDER_STATUSES,
  DOCTOR_ORDER_TYPES,
  DOCTOR_REPORT_TYPES,
  DOCTOR_TRIAGE_PRIORITIES,
  DoctorReportRow,
  DoctorReportType,
} from '../../models/doctor-report.models';
import { DoctorReportApiService } from '../../services/doctor-report-api.service';
import {
  doctorReportColumns,
  doctorReportExportTitle,
  doctorReportFileName,
} from '../../utils/doctor-report-column-definitions';
import { exportReportCsv, exportReportPdf, ReportExportColumn } from '../../utils/report-export.utils';

@Component({
  selector: 'app-doctor-reports-page',
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
  ],
  templateUrl: './doctor-reports-page.component.html',
  styleUrl: './doctor-reports-page.component.scss',
})
export class DoctorReportsPageComponent implements OnInit {
  private readonly api = inject(DoctorReportApiService);
  private readonly staffApi = inject(StaffApiService);
  private readonly specialtyApi = inject(SpecialtyApiService);
  private readonly snackBar = inject(MatSnackBar);

  readonly reportTypes = DOCTOR_REPORT_TYPES;
  readonly appointmentStatuses = DOCTOR_APPOINTMENT_STATUSES;
  readonly admissionStatuses = DOCTOR_ADMISSION_STATUSES;
  readonly admissionTypes = DOCTOR_ADMISSION_TYPES;
  readonly orderTypes = DOCTOR_ORDER_TYPES;
  readonly orderStatuses = DOCTOR_ORDER_STATUSES;
  readonly labImagingStatuses = DOCTOR_LAB_IMAGING_STATUSES;
  readonly attendanceTypes = DOCTOR_ATTENDANCE_TYPES;
  readonly triagePriorities = DOCTOR_TRIAGE_PRIORITIES;

  selectedType: DoctorReportType = 'catalog';
  dateFrom = '';
  dateTo = '';
  doctorId = '';
  specialtyId = '';
  status = '';
  orderType = '';
  admissionType = '';
  activeFilter = '';
  attendance = '';
  requiresHospitalization = '';
  pendingOnly = '';
  pendingReassignmentOnly = '';
  priority = '';

  doctors: StaffResponse[] = [];
  specialties: SpecialtyResponse[] = [];
  catalogsLoading = false;

  loading = false;
  rows: DoctorReportRow[] = [];
  generated = false;

  ngOnInit(): void {
    this.catalogsLoading = true;
    forkJoin({
      staff: this.staffApi.list(true),
      specialties: this.specialtyApi.list(true),
    }).subscribe({
      next: ({ staff, specialties }) => {
        this.doctors = staff.filter((s) => s.staffType === 'MEDICO');
        this.specialties = specialties;
        this.catalogsLoading = false;
      },
      error: (err: unknown) => {
        this.catalogsLoading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudieron cargar médicos o especialidades.'), 'Cerrar', {
          duration: 7000,
        });
      },
    });
  }

  get selectedMeta() {
    return this.reportTypes.find((t) => t.id === this.selectedType)!;
  }

  get previewColumns(): ReportExportColumn<unknown>[] {
    return doctorReportColumns(this.selectedType);
  }

  onTypeChange(): void {
    this.rows = [];
    this.generated = false;
  }

  runReport(): void {
    if (this.selectedMeta.needsDateRange && !this.validateRange()) {
      return;
    }
    this.loading = true;
    this.generated = false;
    const doctor = this.parseOptionalId(this.doctorId);
    const specialty = this.parseOptionalId(this.specialtyId);

    const finish = (rows: DoctorReportRow[]): void => {
      this.loading = false;
      this.rows = rows;
      this.generated = true;
    };
    const fail = (err: unknown): void => {
      this.loading = false;
      this.snackBar.open(getHttpErrorMessage(err, 'No se pudo generar el reporte.'), 'Cerrar', { duration: 7000 });
    };

    switch (this.selectedType) {
      case 'catalog':
        this.api
          .catalog({
            specialtyId: specialty,
            active: this.parseActiveFilter(),
            attendance: this.attendance,
          })
          .subscribe({ next: finish, error: fail });
        break;
      case 'appointments':
        this.api
          .appointments(this.dateFrom, this.dateTo, {
            doctorId: doctor,
            specialtyId: specialty,
            status: this.status,
          })
          .subscribe({ next: finish, error: fail });
        break;
      case 'medical-cares':
        this.api
          .medicalCares(this.dateFrom, this.dateTo, {
            doctorId: doctor,
            specialtyId: specialty,
            requiresHospitalization: this.parseTriState(this.requiresHospitalization),
            pendingOnly: this.parseTriState(this.pendingOnly),
            pendingReassignmentOnly: this.parseTriState(this.pendingReassignmentOnly),
          })
          .subscribe({ next: finish, error: fail });
        break;
      case 'medical-orders':
        this.api
          .medicalOrders(this.dateFrom, this.dateTo, {
            doctorId: doctor,
            specialtyId: specialty,
            orderType: this.orderType,
            status: this.status,
          })
          .subscribe({ next: finish, error: fail });
        break;
      case 'admissions':
        this.api
          .admissions(this.dateFrom, this.dateTo, {
            doctorId: doctor,
            specialtyId: specialty,
            status: this.status,
            admissionType: this.admissionType,
          })
          .subscribe({ next: finish, error: fail });
        break;
      case 'productivity':
        this.api
          .productivity(this.dateFrom, this.dateTo, { doctorId: doctor, specialtyId: specialty })
          .subscribe({ next: finish, error: fail });
        break;
      case 'laboratory':
        this.api
          .laboratory(this.dateFrom, this.dateTo, {
            doctorId: doctor,
            specialtyId: specialty,
            status: this.status,
          })
          .subscribe({ next: finish, error: fail });
        break;
      case 'imaging':
        this.api
          .imaging(this.dateFrom, this.dateTo, {
            doctorId: doctor,
            specialtyId: specialty,
            status: this.status,
          })
          .subscribe({ next: finish, error: fail });
        break;
      case 'triage':
        this.api
          .triage(this.dateFrom, this.dateTo, {
            doctorId: doctor,
            specialtyId: specialty,
            priority: this.priority,
          })
          .subscribe({ next: finish, error: fail });
        break;
    }
  }

  exportCsv(): void {
    if (!this.ensureExportable()) {
      return;
    }
    exportReportCsv(doctorReportFileName(this.selectedType), this.previewColumns, this.rows);
  }

  exportPdf(): void {
    if (!this.ensureExportable()) {
      return;
    }
    exportReportPdf(
      doctorReportExportTitle(this.selectedType),
      doctorReportFileName(this.selectedType),
      this.previewColumns,
      this.rows,
    );
  }

  doctorLabel(staff: StaffResponse): string {
    const name = [staff.linkedUserFirstName, staff.linkedUserLastName]
      .filter((p) => p != null && String(p).trim())
      .join(' ')
      .trim();
    return name ? `${name} — ${staff.employeeCode}` : staff.employeeCode;
  }

  specialtyLabel(s: SpecialtyResponse): string {
    return s.name;
  }

  optionValue(id: number): string {
    return String(id);
  }

  cellValue(row: unknown, col: ReportExportColumn<unknown>): string {
    return col.cell(row);
  }

  showDoctorFilter(): boolean {
    return this.selectedType !== 'catalog';
  }

  showSpecialtyFilter(): boolean {
    return true;
  }

  showDateRange(): boolean {
    return this.selectedMeta.needsDateRange;
  }

  showStatusFilter(): boolean {
    return ['appointments', 'medical-orders', 'admissions', 'laboratory', 'imaging'].includes(this.selectedType);
  }

  statusOptions(): readonly string[] {
    switch (this.selectedType) {
      case 'appointments':
        return this.appointmentStatuses;
      case 'admissions':
        return this.admissionStatuses;
      case 'medical-orders':
        return this.orderStatuses;
      case 'laboratory':
      case 'imaging':
        return this.labImagingStatuses;
      default:
        return [];
    }
  }

  private parseOptionalId(raw: string): number | undefined {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }

  private parseActiveFilter(): boolean | null {
    if (this.activeFilter === 'true') {
      return true;
    }
    if (this.activeFilter === 'false') {
      return false;
    }
    return null;
  }

  private parseTriState(raw: string): boolean | null {
    if (raw === 'true') {
      return true;
    }
    if (raw === 'false') {
      return false;
    }
    return null;
  }

  private validateRange(): boolean {
    if (!this.dateFrom || !this.dateTo) {
      this.snackBar.open('Debe seleccionar fecha inicio y fecha fin.', 'Cerrar', { duration: 5000 });
      return false;
    }
    if (this.dateFrom > this.dateTo) {
      this.snackBar.open('Rango inválido: fecha inicio no puede ser mayor que fecha fin.', 'Cerrar', {
        duration: 6000,
      });
      return false;
    }
    return true;
  }

  private ensureExportable(): boolean {
    if (!this.rows.length) {
      this.snackBar.open('Genere el reporte y verifique que haya datos antes de exportar.', 'Cerrar', {
        duration: 5000,
      });
      return false;
    }
    return true;
  }
}
