import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppointmentApiService } from '../../services/appointment-api.service';
import { AppointmentResponse, AppointmentView } from '../../models/appointment.models';
import { PatientApiService } from '../../../patients/services/patient-api.service';
import { PatientResponse } from '../../../patients/models/patient.models';
import { StaffApiService } from '../../../staff/services/staff-api.service';
import { StaffResponse } from '../../../staff/models/staff.models';
import { SpecialtyApiService } from '../../../specialties/services/specialty-api.service';
import { SpecialtyResponse } from '../../../specialties/models/specialty.models';
import { AppointmentFormDialogComponent, AppointmentFormDialogData } from '../../components/appointment-form-dialog.component';
import { AppointmentDetailDialogComponent } from '../../components/appointment-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_RRHH_SPECIALTIES } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-appointment-list-page',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    DatePipe,
  ],
  templateUrl: './appointment-list-page.component.html',
  styleUrl: './appointment-list-page.component.scss',
})
export class AppointmentListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(AppointmentApiService);
  private readonly patientsApi = inject(PatientApiService);
  private readonly staffApi = inject(StaffApiService);
  private readonly specialtyApi = inject(SpecialtyApiService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly canResolveStaffSpec = this.auth.hasAnyRole(ROLES_RRHH_SPECIALTIES);

  displayedColumns = ['id', 'patientLabel', 'doctorLabel', 'specialtyLabel', 'startAt', 'status', 'actions'];
  dataSource = new MatTableDataSource<AppointmentView>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: AppointmentView, sortHeaderId: string) => {
      const v = (data as unknown as Record<string, unknown>)[sortHeaderId];
      if (typeof v === 'string') {
        return v.toLowerCase();
      }
      if (typeof v === 'number') {
        return v;
      }
      return v == null ? '' : String(v);
    };
    this.dataSource.filterPredicate = (data, filter) => {
      const f = filter.trim().toLowerCase();
      return (
        String(data.id).includes(f) ||
        data.patientLabel.toLowerCase().includes(f) ||
        data.doctorLabel.toLowerCase().includes(f) ||
        data.specialtyLabel.toLowerCase().includes(f) ||
        data.status.toLowerCase().includes(f)
      );
    };
    this.reload();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  reload(): void {
    this.loading = true;
    const base = {
      appointments: this.api.list(),
      patients: this.patientsApi.list(),
    };
    if (this.canResolveStaffSpec) {
      forkJoin({
        ...base,
        staff: this.staffApi.list(),
        specialties: this.specialtyApi.list(),
      }).subscribe({
        next: ({ appointments, patients, staff, specialties }) => {
          this.loading = false;
          this.applyRows(appointments, patients, staff as StaffResponse[], specialties as SpecialtyResponse[]);
        },
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar citas o datos relacionados.'), 'Cerrar', {
            duration: 7000,
          });
        },
      });
    } else {
      forkJoin(base).subscribe({
        next: ({ appointments, patients }) => {
          this.loading = false;
          this.applyRows(appointments, patients, [], []);
        },
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar citas o pacientes.'), 'Cerrar', {
            duration: 7000,
          });
        },
      });
    }
  }

  private applyRows(
    appointments: AppointmentResponse[],
    patients: PatientResponse[],
    staff: StaffResponse[],
    specialties: SpecialtyResponse[],
  ): void {
    const pmap = new Map(patients.map((p) => [p.id, p] as const));
    const smap = new Map(staff.map((s) => [s.id, s] as const));
    const spmap = new Map(specialties.map((s) => [s.id, s] as const));
    this.dataSource.data = appointments.map((a) => ({
      ...a,
      patientLabel: labelPatient(pmap.get(a.patientId), a.patientId),
      doctorLabel: labelStaff(smap.get(a.doctorId), a.doctorId),
      specialtyLabel:
        a.specialtyId == null ? '—' : labelSpecialty(spmap.get(a.specialtyId), a.specialtyId),
    }));
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreate(): void {
    this.dialog
      .open<AppointmentFormDialogComponent, AppointmentFormDialogData, boolean>(AppointmentFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: AppointmentView): void {
    this.dialog
      .open<AppointmentFormDialogComponent, AppointmentFormDialogData, boolean>(AppointmentFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'edit', appointmentId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: AppointmentView): void {
    this.dialog.open(AppointmentDetailDialogComponent, { width: '520px', maxWidth: '95vw', data: row });
  }

  confirmDelete(row: AppointmentView): void {
    const ctx = `${row.patientLabel} · ${row.startAt ? new Date(row.startAt).toLocaleString() : 'cita #' + row.id}`;
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '460px',
        data: {
          title: 'Eliminar cita',
          message: `¿Eliminar la cita #${row.id}?\n\n${ctx}\n\nEsta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.api.delete(row.id).subscribe({
          next: () => {
            this.reload();
            this.snackBar.open('Cita eliminada.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo eliminar la cita.'), 'Cerrar', { duration: 7000 });
          },
        });
      });
  }
}

function labelPatient(p: PatientResponse | undefined, id: number): string {
  if (!p) {
    return `Paciente #${id}`;
  }
  return `${p.firstName} ${p.lastName} (${p.patientCode})`;
}

function labelStaff(s: StaffResponse | undefined, id: number): string {
  if (!s) {
    return `Personal #${id}`;
  }
  return `${s.employeeCode} — ${s.staffType}`;
}

function labelSpecialty(s: SpecialtyResponse | undefined, id: number): string {
  if (!s) {
    return `Especialidad #${id}`;
  }
  return s.name;
}
