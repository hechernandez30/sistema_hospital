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
import { RoleApiService } from '../../services/role-api.service';
import { RoleResponse } from '../../models/role.models';
import { RoleFormDialogComponent, RoleFormDialogData } from '../../components/role-form-dialog.component';
import { RoleDetailDialogComponent } from '../../components/role-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_ADMIN_ONLY } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-role-list-page',
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
  templateUrl: './role-list-page.component.html',
  styleUrl: './role-list-page.component.scss',
})
export class RoleListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(RoleApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_ADMIN_ONLY);

  displayedColumns = ['id', 'name', 'description', 'active', 'actions'];
  dataSource = new MatTableDataSource<RoleResponse>([]);
  loading = false;
  includeInactive = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: RoleResponse, sortHeaderId: string) => {
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
      const blob = [String(data.id), data.name, data.description ?? ''].join(' ').toLowerCase();
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
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar roles.'), 'Cerrar', { duration: 7000 });
      },
    });
  }

  setIncludeInactive(checked: boolean): void {
    this.includeInactive = checked;
    this.reload();
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreate(): void {
    this.dialog
      .open<RoleFormDialogComponent, RoleFormDialogData, boolean>(RoleFormDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: RoleResponse): void {
    this.dialog
      .open<RoleFormDialogComponent, RoleFormDialogData, boolean>(RoleFormDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: { mode: 'edit', roleId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: RoleResponse): void {
    this.dialog.open(RoleDetailDialogComponent, { width: '440px', maxWidth: '95vw', data: row });
  }

  confirmDelete(row: RoleResponse): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Desactivar rol',
          message: `¿Desactivar el rol "${row.name}" (#${row.id})?\n\nEl registro permanecerá en el sistema para auditoría e historial.`,
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
            this.snackBar.open('Rol desactivado.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(
              getHttpErrorMessage(err, 'No se pudo desactivar el rol.'),
              'Cerrar',
              { duration: 12000 },
            );
          },
        });
      });
  }
}
