import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
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
import { MedicationApiService } from '../../services/medication-api.service';
import { MedicationResponse } from '../../models/medication.models';
import { MedicationFormDialogComponent, MedicationFormDialogData } from '../../components/medication-form-dialog.component';
import { MedicationDetailDialogComponent } from '../../components/medication-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_MEDICATIONS } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-medication-list-page',
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
  ],
  templateUrl: './medication-list-page.component.html',
  styleUrl: './medication-list-page.component.scss',
})
export class MedicationListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(MedicationApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_MEDICATIONS);

  displayedColumns = ['id', 'name', 'presentation', 'unit', 'currentStock', 'minimumStock', 'active', 'actions'];
  dataSource = new MatTableDataSource<MedicationResponse>([]);
  loading = false;
  includeInactive = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: MedicationResponse, sortHeaderId: string) => {
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
    };
    this.dataSource.filterPredicate = (data, filter) => {
      const f = filter.trim().toLowerCase();
      const blob = [
        String(data.id),
        data.name,
        data.presentation ?? '',
        data.unit ?? '',
        String(data.currentStock),
        String(data.minimumStock),
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

  reload(): void {
    this.loading = true;
    this.api.list(this.includeInactive).subscribe({
      next: (rows) => {
        this.loading = false;
        this.dataSource.data = rows;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar medicamentos.'), 'Cerrar', { duration: 7000 });
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
      .open<MedicationFormDialogComponent, MedicationFormDialogData, boolean>(MedicationFormDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: MedicationResponse): void {
    this.dialog
      .open<MedicationFormDialogComponent, MedicationFormDialogData, boolean>(MedicationFormDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: { mode: 'edit', medicationId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: MedicationResponse): void {
    this.dialog.open(MedicationDetailDialogComponent, { width: '440px', maxWidth: '95vw', data: row });
  }

  /** Stock actual en o por debajo del umbral mínimo (alerta de inventario). */
  lowStock(row: MedicationResponse): boolean {
    return row.currentStock <= row.minimumStock;
  }

  setIncludeInactive(checked: boolean): void {
    this.includeInactive = checked;
    this.reload();
  }

  confirmDelete(row: MedicationResponse): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Desactivar medicamento',
          message: `¿Desactivar "${row.name}" del catálogo?\n\nPresentación: ${row.presentation ?? '—'} · Stock actual: ${row.currentStock}`,
          confirmLabel: 'Desactivar',
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
            this.snackBar.open('Medicamento desactivado.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo desactivar.'), 'Cerrar', { duration: 7000 });
          },
        });
      });
  }
}
