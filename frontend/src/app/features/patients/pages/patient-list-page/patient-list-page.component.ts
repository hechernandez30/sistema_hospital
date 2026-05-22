import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PatientApiService } from '../../services/patient-api.service';
import { PatientResponse } from '../../models/patient.models';
import { PatientFormDialogComponent, PatientFormDialogData } from '../../components/patient-form-dialog.component';
import { PatientDetailDialogComponent } from '../../components/patient-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_PATIENTS_MUTATE } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-patient-list-page',
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
    MatCheckboxModule,
    DatePipe,
  ],
  templateUrl: './patient-list-page.component.html',
  styleUrl: './patient-list-page.component.scss',
})
export class PatientListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(PatientApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_PATIENTS_MUTATE);

  displayedColumns = ['patientCode', 'fullName', 'dpiNit', 'birthDate', 'phone', 'active', 'actions'];
  dataSource = new MatTableDataSource<PatientResponse>([]);
  loading = false;
  includeInactive = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: PatientResponse, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'fullName':
          return `${data.firstName} ${data.lastName}`.toLowerCase();
        case 'birthDate':
          return data.birthDate ?? '';
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
      const name = `${data.firstName} ${data.lastName}`.toLowerCase();
      return (
        data.patientCode.toLowerCase().includes(f) ||
        name.includes(f) ||
        data.dpiNit.toLowerCase().includes(f)
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
    this.api.list(this.includeInactive).subscribe({
      next: (rows) => {
        this.loading = false;
        this.dataSource.data = rows;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la lista de pacientes.'), 'Cerrar', {
          duration: 7000,
        });
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
      .open<PatientFormDialogComponent, PatientFormDialogData, boolean>(PatientFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: {
          mode: 'create',
          existingPatientCodes: this.dataSource.data.map((p) => p.patientCode),
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.reload();
        }
      });
  }

  openEdit(row: PatientResponse): void {
    this.dialog
      .open<PatientFormDialogComponent, PatientFormDialogData, boolean>(PatientFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'edit', patientId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.reload();
        }
      });
  }

  openDetail(row: PatientResponse): void {
    this.dialog.open(PatientDetailDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: row,
    });
  }

  setIncludeInactive(checked: boolean): void {
    this.includeInactive = checked;
    this.reload();
  }

  confirmDelete(row: PatientResponse): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Dar de baja paciente',
          message: `¿Dar de baja el expediente #${row.id}?\n\n${row.firstName} ${row.lastName}\nCódigo: ${row.patientCode} · DPI/NIT: ${row.dpiNit}`,
          confirmLabel: 'Dar de baja',
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
            this.snackBar.open('Paciente dado de baja.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo dar de baja el paciente.'), 'Cerrar', {
              duration: 7000,
            });
          },
        });
      });
  }
}
