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
import { AdmissionApiService } from '../../services/admission-api.service';
import { AdmissionResponse } from '../../models/admission.models';
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
  ],
  templateUrl: './admission-list-page.component.html',
  styleUrl: './admission-list-page.component.scss',
})
export class AdmissionListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(AdmissionApiService);
  private readonly patientsApi = inject(PatientApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  displayedColumns = ['id', 'patientLabel', 'admissionType', 'status', 'admissionDate', 'actions'];
  dataSource = new MatTableDataSource<AdmissionRow>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data, filter) => {
      const f = filter.trim().toLowerCase();
      return (
        String(data.id).includes(f) ||
        data.patientLabel.toLowerCase().includes(f) ||
        data.admissionType.toLowerCase().includes(f) ||
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
    forkJoin({ admissions: this.api.list(), patients: this.patientsApi.list() }).subscribe({
      next: ({ admissions, patients }) => {
        this.loading = false;
        const pmap = new Map(patients.map((p) => [p.id, p] as const));
        this.dataSource.data = admissions.map((a) => ({
          ...a,
          patientLabel: labelPatient(pmap.get(a.patientId)),
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
    this.dialog.open(AdmissionDetailDialogComponent, { width: '520px', maxWidth: '95vw', data: row });
  }

  confirmDelete(row: AdmissionRow): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Eliminar admisión',
          message: `¿Eliminar la admisión #${row.id}?\n\n${row.patientLabel}\nTipo: ${row.admissionType} · Estado: ${row.status}\n\nEsta acción no se puede deshacer.`,
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
            this.snackBar.open('Admisión eliminada.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo eliminar.'), 'Cerrar', { duration: 7000 });
          },
        });
      });
  }
}

function labelPatient(p: PatientResponse | undefined): string {
  if (!p) {
    return '—';
  }
  return `${p.firstName} ${p.lastName} (#${p.id})`;
}
