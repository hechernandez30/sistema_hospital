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
import { forkJoin } from 'rxjs';
import { StaffApiService } from '../../services/staff-api.service';
import { StaffResponse } from '../../models/staff.models';
import { StaffFormDialogComponent, StaffFormDialogData } from '../../components/staff-form-dialog.component';
import { StaffDetailDialogComponent } from '../../components/staff-detail-dialog.component';
import { SpecialtyApiService } from '../../../specialties/services/specialty-api.service';
import { SpecialtyResponse } from '../../../specialties/models/specialty.models';
import { UserApiService } from '../../../users/services/user-api.service';
import { UserResponse } from '../../../users/models/user.models';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLE_ADMIN, ROLES_RRHH_SPECIALTIES } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-staff-list-page',
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
  ],
  templateUrl: './staff-list-page.component.html',
  styleUrl: './staff-list-page.component.scss',
})
export class StaffListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(StaffApiService);
  private readonly specialtyApi = inject(SpecialtyApiService);
  private readonly userApi = inject(UserApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_RRHH_SPECIALTIES);
  private readonly isAdmin = this.auth.hasAnyRole([ROLE_ADMIN]);

  private specialtyNameById = new Map<number, string>();
  private userLabelById = new Map<number, string>();

  displayedColumns = ['id', 'employeeCode', 'staffType', 'user', 'specialty', 'active', 'actions'];
  dataSource = new MatTableDataSource<StaffResponse>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: StaffResponse, sortHeaderId: string) => {
      if (sortHeaderId === 'user') {
        const u = data.userId != null ? (this.userLabelById.get(data.userId) ?? String(data.userId)) : '';
        return u.toLowerCase();
      }
      if (sortHeaderId === 'specialty') {
        const s =
          data.specialtyId != null ? (this.specialtyNameById.get(data.specialtyId) ?? String(data.specialtyId)) : '';
        return s.toLowerCase();
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
    this.dataSource.filterPredicate = (data, filter) => {
      const f = filter.trim().toLowerCase();
      const blob = [
        String(data.id),
        data.employeeCode,
        data.staffType,
        data.userId != null ? String(data.userId) : '',
        data.userId != null ? (this.userLabelById.get(data.userId) ?? '') : '',
        data.specialtyId != null ? String(data.specialtyId) : '',
        data.specialtyId != null ? (this.specialtyNameById.get(data.specialtyId) ?? '') : '',
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

  userCell(row: StaffResponse): string {
    if (row.userId == null) {
      return '—';
    }
    return this.userLabelById.get(row.userId) ?? `#${row.userId}`;
  }

  specialtyCell(row: StaffResponse): string {
    if (row.specialtyId == null) {
      return '—';
    }
    return this.specialtyNameById.get(row.specialtyId) ?? `#${row.specialtyId}`;
  }

  reload(): void {
    this.loading = true;
    const apply = (staff: StaffResponse[], specs: SpecialtyResponse[], users: UserResponse[] | null) => {
      this.loading = false;
      this.specialtyNameById = new Map(specs.map((s) => [s.id, s.name]));
      if (users) {
        this.userLabelById = new Map(users.map((u) => [u.id, `${u.username} (#${u.id})`]));
      } else {
        this.userLabelById = new Map();
      }
      this.dataSource.data = staff;
    };

    if (this.isAdmin) {
      forkJoin({
        staff: this.api.list(),
        specialties: this.specialtyApi.list(),
        users: this.userApi.list(),
      }).subscribe({
        next: ({ staff, specialties, users }) => apply(staff, specialties, users),
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar personal.'), 'Cerrar', { duration: 7000 });
        },
      });
    } else {
      forkJoin({ staff: this.api.list(), specialties: this.specialtyApi.list() }).subscribe({
        next: ({ staff, specialties }) => apply(staff, specialties, null),
        error: (err: unknown) => {
          this.loading = false;
          this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar personal.'), 'Cerrar', { duration: 7000 });
        },
      });
    }
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openCreate(): void {
    this.dialog
      .open<StaffFormDialogComponent, StaffFormDialogData, boolean>(StaffFormDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: StaffResponse): void {
    this.dialog
      .open<StaffFormDialogComponent, StaffFormDialogData, boolean>(StaffFormDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: { mode: 'edit', staffId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: StaffResponse): void {
    this.dialog.open(StaffDetailDialogComponent, { width: '480px', maxWidth: '95vw', data: row });
  }

  confirmDelete(row: StaffResponse): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Eliminar personal',
          message: `¿Eliminar el registro #${row.id}?\n\nCódigo ${row.employeeCode} · ${row.staffType}\n\nEsta acción no se puede deshacer.`,
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
            this.snackBar.open('Registro eliminado.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo eliminar.'), 'Cerrar', { duration: 7000 });
          },
        });
      });
  }
}
