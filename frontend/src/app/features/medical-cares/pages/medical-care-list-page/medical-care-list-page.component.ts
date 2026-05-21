import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { MedicalCareApiService } from '../../services/medical-care-api.service';
import { MedicalCareResponse, MedicalCareView } from '../../models/medical-care.models';
import {
  MedicalCareFormDialogComponent,
  MedicalCareFormDialogData,
} from '../../components/medical-care-form-dialog.component';
import { MedicalCareDetailDialogComponent } from '../../components/medical-care-detail-dialog.component';
import { PatientApiService } from '../../../patients/services/patient-api.service';
import { PatientResponse } from '../../../patients/models/patient.models';
import { StaffApiService } from '../../../staff/services/staff-api.service';
import { StaffResponse } from '../../../staff/models/staff.models';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_MEDICAL_CARE, ROLES_RRHH_SPECIALTIES } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-medical-care-list-page',
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
    FormsModule,
    DatePipe,
  ],
  templateUrl: './medical-care-list-page.component.html',
  styleUrl: './medical-care-list-page.component.scss',
})
export class MedicalCareListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(MedicalCareApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly staffApi = inject(StaffApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_MEDICAL_CARE);
  private readonly canResolveStaff = this.auth.hasAnyRole(ROLES_RRHH_SPECIALTIES);

  filterPatientId = '';
  displayedColumns = ['id', 'careDate', 'patientLabel', 'doctorLabel', 'diagnosis', 'requiresHospitalization', 'actions'];
  dataSource = new MatTableDataSource<MedicalCareView>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: MedicalCareView, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'diagnosis':
          return (data.diagnosis ?? '').toLowerCase();
        case 'patientLabel':
          return data.patientLabel.toLowerCase();
        case 'doctorLabel':
          return data.doctorLabel.toLowerCase();
        default: {
          const v = (data as unknown as Record<string, unknown>)[sortHeaderId];
          if (typeof v === 'string') {
            return v.toLowerCase();
          }
          if (typeof v === 'boolean') {
            return v ? 1 : 0;
          }
          if (typeof v === 'number') {
            return v;
          }
          return v == null ? '' : String(v);
        }
      }
    };
    this.dataSource.filterPredicate = (data, filter) => {
      const f = filter.trim().toLowerCase();
      const blob = [
        String(data.id),
        data.patientLabel,
        data.doctorLabel,
        String(data.patientId),
        data.diagnosis,
        data.consultationReason,
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(f);
    };
    this.reload();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyPatientFilter(): void {
    this.reload();
  }

  clearPatientFilter(): void {
    this.filterPatientId = '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    const pid = Number(this.filterPatientId);
    const patientId = Number.isFinite(pid) && pid > 0 ? pid : undefined;

    const cares$ = this.api.list(patientId);
    const patients$ = this.patientApi.list();

    if (this.canResolveStaff) {
      forkJoin({ cares: cares$, patients: patients$, staff: this.staffApi.list() }).subscribe({
        next: ({ cares, patients, staff }) => {
          this.loading = false;
          this.applyRows(cares, patients, staff as StaffResponse[]);
        },
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar atenciones médicas.'), 'Cerrar', {
            duration: 7000,
          });
        },
      });
    } else {
      forkJoin({ cares: cares$, patients: patients$ }).subscribe({
        next: ({ cares, patients }) => {
          this.loading = false;
          this.applyRows(cares, patients, []);
        },
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar atenciones médicas.'), 'Cerrar', {
            duration: 7000,
          });
        },
      });
    }
  }

  private applyRows(cares: MedicalCareResponse[], patients: PatientResponse[], staff: StaffResponse[]): void {
    const pmap = new Map(patients.map((p) => [p.id, p] as const));
    const smap = new Map(staff.map((s) => [s.id, s] as const));
    this.dataSource.data = cares.map((c) => ({
      ...c,
      patientLabel: labelPatient(pmap.get(c.patientId), c.patientId),
      doctorLabel: labelStaff(smap.get(c.doctorId), c.doctorId),
    }));
  }

  applyTextFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clip(s: string, max: number): string {
    if (!s) {
      return '—';
    }
    return s.length <= max ? s : `${s.slice(0, max)}…`;
  }

  openCreate(): void {
    this.dialog
      .open<MedicalCareFormDialogComponent, MedicalCareFormDialogData, boolean>(MedicalCareFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: MedicalCareView): void {
    this.dialog
      .open<MedicalCareFormDialogComponent, MedicalCareFormDialogData, boolean>(MedicalCareFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'edit', medicalCareId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: MedicalCareView): void {
    this.dialog.open(MedicalCareDetailDialogComponent, { width: '560px', maxWidth: '95vw', data: row });
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
