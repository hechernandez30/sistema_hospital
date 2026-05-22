import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { ImagingApiService } from '../../services/imaging-api.service';
import { ImagingStudyResponse } from '../../models/imaging.models';
import { ImagingFormDialogComponent, ImagingFormDialogData } from '../../components/imaging-form-dialog.component';
import { ImagingDetailDialogComponent } from '../../components/imaging-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_IMAGING } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-imaging-list-page',
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
  templateUrl: './imaging-list-page.component.html',
  styleUrl: './imaging-list-page.component.scss',
})
export class ImagingListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(ImagingApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_IMAGING);

  filterOrderId = '';
  displayedColumns = ['id', 'medicalOrderId', 'studyType', 'status', 'scheduledAt', 'performedAt', 'actions'];
  dataSource = new MatTableDataSource<ImagingStudyResponse>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: ImagingStudyResponse, sortHeaderId: string) => {
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
      const blob = [String(data.id), String(data.medicalOrderId), data.studyType, data.status].join(' ').toLowerCase();
      return blob.includes(f);
    };
    this.reload();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyOrderFilter(): void {
    const raw = this.filterOrderId.trim();
    if (raw && !/^[1-9][0-9]*$/.test(raw)) {
      this.snackBar.open('El ID de orden médica debe ser un entero positivo (solo dígitos).', 'Cerrar', {
        duration: 6000,
      });
      return;
    }
    this.reload();
  }

  clearOrderFilter(): void {
    this.filterOrderId = '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    const n = Number(this.filterOrderId);
    const medicalOrderId =
      this.filterOrderId.trim() && Number.isFinite(n) && n > 0 && /^[1-9][0-9]*$/.test(this.filterOrderId.trim())
        ? n
        : undefined;
    this.api.list(medicalOrderId).subscribe({
      next: (rows) => {
        this.loading = false;
        this.dataSource.data = rows;
        if (medicalOrderId != null && rows.length === 0) {
          this.snackBar.open(
            'No hay estudio de imagen para esa orden médica. Verifique el ID o cree un estudio vinculado a una orden existente.',
            'Cerrar',
            { duration: 9000 },
          );
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar imágenes.'), 'Cerrar', { duration: 7000 });
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
      .open<ImagingFormDialogComponent, ImagingFormDialogData, boolean>(ImagingFormDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: ImagingStudyResponse): void {
    this.dialog
      .open<ImagingFormDialogComponent, ImagingFormDialogData, boolean>(ImagingFormDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: { mode: 'edit', imagingId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: ImagingStudyResponse): void {
    this.dialog.open(ImagingDetailDialogComponent, { width: '520px', maxWidth: '95vw', data: row });
  }

  confirmDelete(row: ImagingStudyResponse): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Anular estudio de imagen',
          message: `¿Anular el estudio #${row.id}?\n\n${row.studyType} · Orden médica #${row.medicalOrderId} · Estado: ${row.status}\n\nLa orden médica no se elimina.`,
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
            this.snackBar.open('Estudio de imagen anulado.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo anular el estudio.'), 'Cerrar', { duration: 7000 });
          },
        });
      });
  }
}
