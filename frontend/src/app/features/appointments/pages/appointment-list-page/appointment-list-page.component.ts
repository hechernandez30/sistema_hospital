import { AfterViewInit, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
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
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AppointmentApiService } from '../../services/appointment-api.service';
import { APPOINTMENT_STATUSES, AppointmentResponse, AppointmentView } from '../../models/appointment.models';
import { PatientApiService } from '../../../patients/services/patient-api.service';
import { PatientResponse } from '../../../patients/models/patient.models';
import { StaffApiService } from '../../../staff/services/staff-api.service';
import { StaffResponse } from '../../../staff/models/staff.models';
import { SpecialtyApiService } from '../../../specialties/services/specialty-api.service';
import { SpecialtyResponse } from '../../../specialties/models/specialty.models';
import {
  AppointmentFormDialogComponent,
  AppointmentFormDialogData,
  AppointmentFormPrefill,
} from '../../components/appointment-form-dialog.component';
import {
  AppointmentDetailDialogComponent,
  AppointmentDetailDialogData,
  AppointmentDetailDialogResult,
} from '../../components/appointment-detail-dialog.component';
import { AppointmentAgendaComponent } from '../../components/appointment-agenda.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_RRHH_SPECIALTIES } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';
import { appointmentStatusChipClass } from '../../appointment-status-chip';
import {
  AgendaRangeMode,
  PageViewMode,
  filterAppointments,
  getRangeForMode,
  slotClickDatetimeLocal,
  startOfDay,
  toDateInputValue,
} from '../../appointment-page.utils';
import { addMinutesToDatetimeLocal } from '../../../shared/datetime-local';

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
    MatSelectModule,
    MatButtonToggleModule,
    DatePipe,
    NgClass,
    AppointmentAgendaComponent,
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

  readonly statuses = [...APPOINTMENT_STATUSES];
  readonly pageView = signal<PageViewMode>('agenda');
  readonly agendaRange = signal<AgendaRangeMode>('day');
  readonly anchorDate = signal<Date>(startOfDay(new Date()));
  readonly filterDoctorId = signal<number | null>(null);
  readonly filterSpecialtyId = signal<number | null>(null);
  readonly filterStatus = signal<string>('');
  readonly filterDateInput = signal(toDateInputValue(new Date()));

  displayedColumns = ['id', 'patientLabel', 'doctorLabel', 'specialtyLabel', 'startAt', 'status', 'actions'];
  dataSource = new MatTableDataSource<AppointmentView>([]);
  loading = false;

  private allAppointments: AppointmentView[] = [];
  staffRows: StaffResponse[] = [];
  specialties: SpecialtyResponse[] = [];
  doctorLabels = new Map<number, string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly filteredForAgenda = computed(() => this.computeFiltered());

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: AppointmentView, sortHeaderId: string) => {
      const v = (data as unknown as Record<string, unknown>)[sortHeaderId];
      if (sortHeaderId === 'startAt') {
        return data.startAt ?? '';
      }
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

  statusChipClass(status: string): string {
    return appointmentStatusChipClass(status);
  }

  doctorFilterOptions(): { id: number | null; label: string }[] {
    const opts: { id: number | null; label: string }[] = [{ id: null, label: 'Todos los médicos' }];
    const seen = new Set<number>();
    for (const s of this.staffRows.filter((x) => x.staffType === 'MEDICO' && x.active)) {
      seen.add(s.id);
      opts.push({ id: s.id, label: this.doctorLabels.get(s.id) ?? `Médico #${s.id}` });
    }
    if (opts.length === 1) {
      for (const a of this.allAppointments) {
        if (!seen.has(a.doctorId)) {
          seen.add(a.doctorId);
          opts.push({ id: a.doctorId, label: a.doctorLabel });
        }
      }
    }
    return opts;
  }

  specialtyFilterOptions(): { id: number | null; label: string }[] {
    const opts: { id: number | null; label: string }[] = [{ id: null, label: 'Todas las especialidades' }];
    for (const s of this.specialties) {
      opts.push({ id: s.id, label: s.name });
    }
    return opts;
  }

  onPageViewChange(mode: PageViewMode): void {
    this.pageView.set(mode);
  }

  onAgendaRangeChange(mode: AgendaRangeMode): void {
    this.agendaRange.set(mode);
    this.syncListFromFilters();
  }

  onDoctorFilterChange(raw: string): void {
    this.filterDoctorId.set(raw === '' || raw === 'all' ? null : Number(raw));
    this.syncListFromFilters();
  }

  onSpecialtyFilterChange(raw: string): void {
    this.filterSpecialtyId.set(raw === '' || raw === 'all' ? null : Number(raw));
    this.syncListFromFilters();
  }

  onStatusFilterChange(value: string): void {
    this.filterStatus.set(value);
    this.syncListFromFilters();
  }

  onAnchorDateChange(d: Date): void {
    this.anchorDate.set(startOfDay(d));
    this.filterDateInput.set(toDateInputValue(d));
    this.syncListFromFilters();
  }

  onAgendaDayFromMonth(d: Date): void {
    this.anchorDate.set(startOfDay(d));
    this.filterDateInput.set(toDateInputValue(d));
    this.agendaRange.set('day');
    this.syncListFromFilters();
  }

  onFilterDateChange(value: string): void {
    this.filterDateInput.set(value);
    const d = value ? new Date(value + 'T12:00:00') : new Date();
    if (!Number.isNaN(d.getTime())) {
      this.anchorDate.set(startOfDay(d));
      this.syncListFromFilters();
    }
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
          this.staffRows = staff as StaffResponse[];
          this.specialties = specialties as SpecialtyResponse[];
          this.applyRows(appointments, patients, this.staffRows, this.specialties);
          this.syncListFromFilters();
        },
        error: (err: unknown) => this.onLoadError(err, 'No se pudo cargar citas o datos relacionados.'),
      });
    } else {
      forkJoin(base).subscribe({
        next: ({ appointments, patients }) => {
          this.loading = false;
          this.staffRows = [];
          this.specialties = [];
          this.applyRows(appointments, patients, [], []);
          this.syncListFromFilters();
        },
        error: (err: unknown) => this.onLoadError(err, 'No se pudo cargar citas o pacientes.'),
      });
    }
  }

  private onLoadError(err: unknown, msg: string): void {
    this.loading = false;
    this.snackBar.open(getHttpErrorMessage(err, msg), 'Cerrar', { duration: 7000 });
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
    this.doctorLabels = new Map(
      staff
        .filter((s) => s.staffType === 'MEDICO')
        .map((s) => [s.id, labelStaff(smap.get(s.id), s.id)] as const),
    );
    this.allAppointments = appointments.map((a) => ({
      ...a,
      patientLabel: labelPatient(pmap.get(a.patientId), a.patientId),
      doctorLabel: labelStaff(smap.get(a.doctorId), a.doctorId),
      specialtyLabel: a.specialtyId == null ? '—' : labelSpecialty(spmap.get(a.specialtyId), a.specialtyId),
    }));
    this.syncListFromFilters();
  }

  private computeFiltered(): AppointmentView[] {
    const { start, end } = getRangeForMode(this.anchorDate(), this.agendaRange());
    const staffById = new Map(this.staffRows.map((s) => [s.id, s] as const));
    return filterAppointments(this.allAppointments, {
      rangeStart: start,
      rangeEnd: end,
      doctorId: this.filterDoctorId(),
      specialtyId: this.filterSpecialtyId(),
      status: this.filterStatus(),
      staffById,
    });
  }

  private refreshListDataSource(): void {
    this.dataSource.data = this.computeFiltered();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /** Sincroniza tabla cuando cambian filtros de agenda. */
  syncListFromFilters(): void {
    this.refreshListDataSource();
  }

  openCreate(prefill?: AppointmentFormPrefill): void {
    this.dialog
      .open<AppointmentFormDialogComponent, AppointmentFormDialogData, boolean>(AppointmentFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'create', prefill },
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
    this.dialog
      .open<AppointmentDetailDialogComponent, AppointmentDetailDialogData, AppointmentDetailDialogResult | undefined>(
        AppointmentDetailDialogComponent,
        {
          width: '520px',
          maxWidth: '95vw',
          data: { ...row, showActions: true },
        },
      )
      .afterClosed()
      .subscribe((action) => {
        if (action === 'edit') {
          this.openEdit(row);
        } else if (action === 'cancel') {
          this.confirmDelete(row);
        }
      });
  }

  onEmptySlotClick(ev: { doctorId: number | null; day: Date; minutesFromMidnight: number }): void {
    const startAt = slotClickDatetimeLocal(ev.day, ev.minutesFromMidnight);
    const endAt = addMinutesToDatetimeLocal(startAt, 30) ?? '';
    const doc = ev.doctorId != null ? this.staffRows.find((s) => s.id === ev.doctorId) : undefined;
    this.openCreate({
      doctorId: ev.doctorId ?? undefined,
      specialtyId: doc?.specialtyId ?? null,
      startAt,
      endAt: endAt || undefined,
    });
  }

  confirmDelete(row: AppointmentView): void {
    const ctx = `${row.patientLabel} · ${row.startAt ? new Date(row.startAt).toLocaleString() : 'cita #' + row.id}`;
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '460px',
        data: {
          title: 'Cancelar cita',
          message: `¿Cancelar la cita #${row.id}?\n\n${ctx}`,
          confirmLabel: 'Cancelar cita',
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
            this.snackBar.open('Cita cancelada.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cancelar la cita.'), 'Cerrar', { duration: 7000 });
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
