import { NgClass } from '@angular/common';
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
import { TriageApiService } from '../../services/triage-api.service';
import { triagePriorityLabel, TriageResponse } from '../../models/triage.models';
import { AdmissionApiService } from '../../../admissions/services/admission-api.service';
import { AdmissionResponse } from '../../../admissions/models/admission.models';
import { PatientApiService } from '../../../patients/services/patient-api.service';
import { PatientResponse } from '../../../patients/models/patient.models';
import { TriageFormDialogComponent, TriageFormDialogData } from '../../components/triage-form-dialog.component';
import { TriageDetailDialogComponent } from '../../components/triage-detail-dialog.component';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

export interface TriageRow extends TriageResponse {
  admissionLabel: string;
}

@Component({
  selector: 'app-triage-list-page',
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
    NgClass,
  ],
  templateUrl: './triage-list-page.component.html',
  styleUrl: './triage-list-page.component.scss',
})
export class TriageListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(TriageApiService);
  private readonly admissionsApi = inject(AdmissionApiService);
  private readonly patientsApi = inject(PatientApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  filterAdmissionId = '';
  displayedColumns = ['id', 'admissionLabel', 'priority', 'registeredAt', 'actions'];
  dataSource = new MatTableDataSource<TriageRow>([]);
  loading = false;

  /** Expuesto para plantilla — etiquetas de prioridad CU10 */
  readonly triagePriorityLabel = triagePriorityLabel;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data, filter) => {
      const f = filter.trim().toLowerCase();
      const priLabel = triagePriorityLabel(data.priority).toLowerCase();
      return (
        String(data.id).includes(f) ||
        data.admissionLabel.toLowerCase().includes(f) ||
        data.priority.toLowerCase().includes(f) ||
        priLabel.includes(f)
      );
    };
    this.reload();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = triageSortingAccessor;
  }

  priorityCssClass(code: string): string {
    switch (code) {
      case 'I_CRITICO':
        return 'prio-i';
      case 'II_URGENTE':
        return 'prio-ii';
      case 'III_PRIORITARIO':
        return 'prio-iii';
      case 'IV_NO_URGENTE':
        return 'prio-iv';
      default:
        return 'prio-unknown';
    }
  }

  applyAdmissionFilter(): void {
    this.reload();
  }

  clearAdmissionFilter(): void {
    this.filterAdmissionId = '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    const admId = Number(this.filterAdmissionId);
    const triage$ = Number.isFinite(admId) && admId > 0 ? this.api.list(admId) : this.api.list();
    forkJoin({ triages: triage$, admissions: this.admissionsApi.list(), patients: this.patientsApi.list() }).subscribe({
      next: ({ triages, admissions, patients }) => {
        this.loading = false;
        const amap = new Map(admissions.map((a) => [a.id, a] as const));
        const pmap = new Map(patients.map((p) => [p.id, p] as const));
        this.dataSource.data = triages.map((t) => ({
          ...t,
          admissionLabel: labelAdmission(amap.get(t.admissionId), pmap),
        }));
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar triage.'), 'Cerrar', { duration: 7000 });
      },
    });
  }

  applyTextFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreate(): void {
    this.dialog
      .open<TriageFormDialogComponent, TriageFormDialogData, boolean>(TriageFormDialogComponent, {
        width: '620px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: TriageRow): void {
    this.dialog
      .open<TriageFormDialogComponent, TriageFormDialogData, boolean>(TriageFormDialogComponent, {
        width: '620px',
        maxWidth: '95vw',
        data: { mode: 'edit', triageId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: TriageRow): void {
    this.dialog.open(TriageDetailDialogComponent, { width: '520px', maxWidth: '95vw', data: row });
  }

}

function labelAdmission(a: AdmissionResponse | undefined, pmap: Map<number, PatientResponse>): string {
  if (!a) {
    return '—';
  }
  const p = pmap.get(a.patientId);
  const pname = p ? `${p.firstName} ${p.lastName}` : `paciente #${a.patientId}`;
  return `Adm. #${a.id} · ${pname}`;
}

function triageSortingAccessor(data: TriageRow, sortHeaderId: string): string | number {
  switch (sortHeaderId) {
    case 'priority': {
      const order = ['I_CRITICO', 'II_URGENTE', 'III_PRIORITARIO', 'IV_NO_URGENTE'];
      const i = order.indexOf(data.priority);
      return i >= 0 ? i : 99;
    }
    case 'registeredAt': {
      if (!data.registeredAt) {
        return 0;
      }
      const t = Date.parse(data.registeredAt);
      return Number.isFinite(t) ? t : 0;
    }
    case 'id':
      return data.id;
    case 'admissionLabel':
      return data.admissionLabel ?? '';
    default:
      return '';
  }
}
