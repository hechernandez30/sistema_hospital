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
import { AuditLogApiService } from '../../services/audit-log-api.service';
import { AuditLogResponse, AuditLogView } from '../../models/audit-log.models';
import { AuditLogDetailDialogComponent } from '../../components/audit-log-detail-dialog.component';
import { UserApiService } from '../../../users/services/user-api.service';
import { UserResponse } from '../../../users/models/user.models';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_ADMIN_ONLY } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-audit-log-list-page',
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
  templateUrl: './audit-log-list-page.component.html',
  styleUrl: './audit-log-list-page.component.scss',
})
export class AuditLogListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(AuditLogApiService);
  private readonly userApi = inject(UserApiService);
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly canResolveUsers = this.auth.hasAnyRole(ROLES_ADMIN_ONLY);

  filterModule = '';
  filterUserId = '';
  displayedColumns = ['id', 'occurredAt', 'userLabel', 'module', 'entityType', 'action', 'recordId', 'actions'];
  dataSource = new MatTableDataSource<AuditLogView>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: AuditLogView, sortHeaderId: string) => {
      if (sortHeaderId === 'userLabel') {
        return data.userLabel.toLowerCase();
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
        data.userLabel,
        data.module,
        data.entityType,
        data.action,
        data.recordId,
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

  applyFilters(): void {
    const uidRaw = this.filterUserId.trim();
    if (uidRaw && !/^[1-9][0-9]*$/.test(uidRaw)) {
      this.snackBar.open('El filtro por ID usuario debe ser un entero positivo (solo dígitos).', 'Cerrar', {
        duration: 6000,
      });
      return;
    }
    this.reload();
  }

  clearFilters(): void {
    this.filterModule = '';
    this.filterUserId = '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    const uidRaw = this.filterUserId.trim();
    const userId =
      uidRaw && /^[1-9][0-9]*$/.test(uidRaw) ? Number(uidRaw) : undefined;
    const module = this.filterModule.trim() || undefined;
    const req$ =
      module && userId != null
        ? this.api.list({ module })
        : this.api.list({ module, userId });

    req$.subscribe({
      next: (rows) => {
        let data = rows;
        if (module && userId != null) {
          data = rows.filter((r) => r.userId === userId);
        }
        if (this.canResolveUsers) {
          this.userApi.list().subscribe({
            next: (users) => {
              this.loading = false;
              this.dataSource.data = this.withUserLabels(data, users);
            },
            error: (err: unknown) => {
              this.loading = false;
              this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar usuarios para la bitácora.'), 'Cerrar', {
                duration: 7000,
              });
              this.dataSource.data = this.withUserLabels(data, []);
            },
          });
        } else {
          this.loading = false;
          this.dataSource.data = this.withUserLabels(data, []);
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la bitácora.'), 'Cerrar', { duration: 7000 });
      },
    });
  }

  private withUserLabels(rows: AuditLogResponse[], users: UserResponse[]): AuditLogView[] {
    const umap = new Map(users.map((u) => [u.id, u] as const));
    return rows.map((r) => ({
      ...r,
      userLabel: labelUser(umap.get(r.userId ?? -1), r.userId),
    }));
  }

  applyTextFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openDetail(row: AuditLogView): void {
    this.dialog.open(AuditLogDetailDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      data: row,
    });
  }
}

function labelUser(u: UserResponse | undefined, userId: number | null): string {
  if (userId == null) {
    return '—';
  }
  if (!u) {
    return `Usuario #${userId}`;
  }
  return `${u.username} (#${u.id})`;
}
