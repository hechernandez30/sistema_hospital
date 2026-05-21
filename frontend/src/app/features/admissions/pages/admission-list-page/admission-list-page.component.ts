import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
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
import { AdmissionApiService } from '../../services/admission-api.service';
import {
  ADMISSION_STATUS_LABELS,
  ADMISSION_TYPE_LABELS,
  AdmissionDetailData,
  AdmissionResponse,
} from '../../models/admission.models';
import { admissionStatusChipClass as resolveAdmissionStatusChip } from '../../admission-chip-class';
import { PatientApiService } from '../../../patients/services/patient-api.service';
import { PatientResponse } from '../../../patients/models/patient.models';
import { AdmissionFormDialogComponent, AdmissionFormDialogData } from '../../components/admission-form-dialog.component';
import { AdmissionDetailDialogComponent } from '../../components/admission-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

export interface AdmissionRow extends AdmissionResponse {
  patientLabel: string;
}

@Component({
  selector: 'app-admission-list-page',
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
    NgClass,
  ],
  templateUrl: './admission-list-page.component.html',
  styleUrl: './admission-list-page.component.scss',
})
export class AdmissionListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(AdmissionApiService);
  private readonly patientsApi = inject(PatientApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  displayedColumns = [
    'id',
    'patientLabel',
    'admissionType',
    'status',
    'financeBrief',
    'admissionDate',
    'actions',
  ];
  dataSource = new MatTableDataSource<AdmissionRow>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: AdmissionRow, sortHeaderId: string) => {
      if (sortHeaderId === 'admissionDate') {
        const t = data.admissionDate ? new Date(data.admissionDate).getTime() : NaN;
        return Number.isNaN(t) ? '' : t;
      }
      if (sortHeaderId === 'financeBrief') {
        return financeBrief(data).toLowerCase();
      }
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
      const blob = [
        String(data.id),
        data.patientLabel,
        data.patientId,
        String(data.appointmentId ?? ''),
        typeDisplay(data.admissionType),
        data.admissionType,
        data.status,
        statusDisplay(data.status),
        financeBrief(data),
        data.validationSource ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return blob.includes(f);
    };
    this.reload();
  }

  admissionStatusChipClass(status: string): string {
    return resolveAdmissionStatusChip(status);
  }

  admissionTypeDisplay(code: string): string {
    return typeDisplay(code);
  }

  statusDisplay(code: string): string {
    return statusDisplay(code);
  }

  financeBriefRow(row: AdmissionRow): string {
    return financeBrief(row);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  reload(): void {
    this.loading = true;
    forkJoin({ admissions: this.api.list(), patients: this.patientsApi.list() }).subscribe({
      next: ({ admissions, patients }) => {
        this.loading = false;
        const pmap = new Map(patients.map((p) => [p.id, p] as const));
        this.dataSource.data = admissions.map((a) => ({
          ...a,
          patientLabel: labelPatient(pmap.get(a.patientId), a.patientId),
        }));
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar admisiones.'), 'Cerrar', { duration: 7000 });
      },
    });
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreate(): void {
    this.dialog
      .open<AdmissionFormDialogComponent, AdmissionFormDialogData, boolean>(AdmissionFormDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: AdmissionRow): void {
    this.dialog
      .open<AdmissionFormDialogComponent, AdmissionFormDialogData, boolean>(AdmissionFormDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: { mode: 'edit', admissionId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: AdmissionRow): void {
    const data: AdmissionDetailData = row;
    this.dialog.open(AdmissionDetailDialogComponent, { width: '520px', maxWidth: '95vw', data });
  }

  confirmDelete(row: AdmissionRow): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Anular admisión',
          message: `¿Anular la admisión #${row.id}?\n\n${row.patientLabel}\nTipo: ${row.admissionType} · Estado: ${row.status}\n\nEl registro permanecerá en el sistema para auditoría e historial. No podrá usarse para nuevos flujos asistenciales.`,
          confirmLabel: 'Anular',
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
            this.snackBar.open('Admisión anulada.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo anular la admisión.'), 'Cerrar', { duration: 7000 });
          },
        });
      });
  }
}

function labelPatient(p: PatientResponse | undefined, patientId?: number): string {
  if (!p && patientId != null) {
    return `Paciente #${patientId}`;
  }
  if (!p) {
    return '—';
  }
  return `${p.firstName} ${p.lastName} (#${p.id})`;
}

function statusDisplay(code: string): string {
  return ADMISSION_STATUS_LABELS[code as keyof typeof ADMISSION_STATUS_LABELS] ?? code;
}

function typeDisplay(code: string): string {
  return ADMISSION_TYPE_LABELS[code as keyof typeof ADMISSION_TYPE_LABELS] ?? code;
}

function financeBrief(row: AdmissionResponse): string {
  if (row.status === 'RECHAZADO') {
    return 'Rechazado';
  }
  if (!row.financialValidationOk) {
    return 'Sin validar';
  }
  if (row.validationSource === 'SEGURO') {
    return 'Seguro';
  }
  if (row.validationSource === 'PAGO_SITIO') {
    return 'Pago sitio';
  }
  return '—';
}
