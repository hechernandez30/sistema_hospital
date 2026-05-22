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
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { UserApiService } from '../../services/user-api.service';
import { USER_STATES, UserResponse } from '../../models/user.models';
import { UserFormDialogComponent, UserFormDialogData } from '../../components/user-form-dialog.component';
import { UserDetailDialogComponent } from '../../components/user-detail-dialog.component';
import { RoleApiService } from '../../../roles/services/role-api.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_ADMIN_ONLY } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-user-list-page',
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
  ],
  templateUrl: './user-list-page.component.html',
  styleUrl: './user-list-page.component.scss',
})
export class UserListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(UserApiService);
  private readonly rolesApi = inject(RoleApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_ADMIN_ONLY);

  readonly userStateOptions = [...USER_STATES];
  private roleNameById = new Map<number, string>();
  private searchText = '';
  /** Vacío = todos los estados */
  stateFilter = '';

  private static readonly FILTER_SEP = '\u0001';

  displayedColumns = ['id', 'username', 'email', 'fullName', 'role', 'state', 'mfaEnabled', 'actions'];
  dataSource = new MatTableDataSource<UserResponse>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: UserResponse, sortHeaderId: string) => {
      if (sortHeaderId === 'fullName') {
        return `${data.firstName} ${data.lastName}`.toLowerCase();
      }
      if (sortHeaderId === 'role') {
        return (this.roleNameById.get(data.roleId) ?? '').toLowerCase();
      }
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
    this.dataSource.filterPredicate = (data, filterRaw) => {
      const sep = UserListPageComponent.FILTER_SEP;
      const i = filterRaw.indexOf(sep);
      const textPart = i >= 0 ? filterRaw.slice(0, i) : filterRaw;
      const statePart = i >= 0 ? filterRaw.slice(i + sep.length) : '';
      if (statePart && data.state !== statePart) {
        return false;
      }
      const f = textPart.trim().toLowerCase();
      if (!f) {
        return true;
      }
      const blob = [
        String(data.id),
        data.username,
        data.email,
        data.firstName,
        data.lastName,
        String(data.roleId),
        this.roleNameById.get(data.roleId) ?? '',
        data.state,
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

  roleLabel(roleId: number): string {
    return this.roleNameById.get(roleId) ?? `#${roleId}`;
  }

  reload(): void {
    this.loading = true;
    forkJoin([this.api.list(), this.rolesApi.list()]).subscribe({
      next: ([users, roles]) => {
        this.loading = false;
        this.roleNameById = new Map(roles.map((r) => [r.id, r.name]));
        this.dataSource.data = users;
        this.pushTableFilter();
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar usuarios o roles.'), 'Cerrar', {
          duration: 7000,
        });
      },
    });
  }

  applyFilter(value: string): void {
    this.searchText = value;
    this.pushTableFilter();
  }

  onStateFilterChange(value: string): void {
    this.stateFilter = value ?? '';
    this.pushTableFilter();
  }

  private pushTableFilter(): void {
    this.dataSource.filter = `${this.searchText}${UserListPageComponent.FILTER_SEP}${this.stateFilter}`;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreate(): void {
    this.dialog
      .open<UserFormDialogComponent, UserFormDialogData, boolean>(UserFormDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: UserResponse): void {
    this.dialog
      .open<UserFormDialogComponent, UserFormDialogData, boolean>(UserFormDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: { mode: 'edit', userId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: UserResponse): void {
    this.dialog.open(UserDetailDialogComponent, { width: '480px', maxWidth: '95vw', data: row });
  }

  confirmDelete(row: UserResponse): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Deshabilitar usuario',
          message: `¿Deshabilitar el usuario #${row.id}?\n\n${row.username} · ${row.email}\nEstado actual: ${row.state}`,
          confirmLabel: 'Deshabilitar',
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
            this.snackBar.open('Usuario deshabilitado.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo deshabilitar el usuario.'), 'Cerrar', {
              duration: 7000,
            });
          },
        });
      });
  }
}
