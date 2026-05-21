import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
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
import { MedicalOrderApiService } from '../../services/medical-order-api.service';
import {
  MedicalOrderResponse,
  medicalOrderPriorityLabel,
  medicalOrderStatusLabel,
  medicalOrderTypeLabel,
} from '../../models/medical-order.models';
import {
  MedicalOrderFormDialogComponent,
  MedicalOrderFormDialogData,
} from '../../components/medical-order-form-dialog.component';
import { MedicalOrderDetailDialogComponent } from '../../components/medical-order-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_MEDICAL_ORDERS } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-medical-order-list-page',
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
  templateUrl: './medical-order-list-page.component.html',
  styleUrl: './medical-order-list-page.component.scss',
})
export class MedicalOrderListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(MedicalOrderApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_MEDICAL_ORDERS);

  readonly medicalOrderTypeLabel = medicalOrderTypeLabel;
  readonly medicalOrderStatusLabel = medicalOrderStatusLabel;
  readonly medicalOrderPriorityLabel = medicalOrderPriorityLabel;

  filterCareId = '';
  displayedColumns = ['id', 'orderDate', 'medicalCareId', 'orderType', 'status', 'priority', 'description', 'actions'];
  dataSource = new MatTableDataSource<MedicalOrderResponse>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: MedicalOrderResponse, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'orderType': {
          const ord = ['LABORATORIO', 'IMAGEN', 'FARMACIA', 'HOSPITALIZACION'];
          const i = ord.indexOf(data.orderType);
          return i >= 0 ? i : 99;
        }
        case 'status': {
          const ord = ['PENDIENTE', 'EN_PROCESO', 'PARCIAL', 'COMPLETADO', 'RECHAZADO', 'ANULADO'];
          const i = ord.indexOf(data.status);
          return i >= 0 ? i : 99;
        }
        case 'description':
          return (data.description ?? '').toLowerCase();
        default: {
          const v = (data as unknown as Record<string, unknown>)[sortHeaderId];
          if (typeof v === 'string') {
            return v.toLowerCase();
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
      const blob = [
        String(data.id),
        String(data.medicalCareId),
        data.orderType,
        medicalOrderTypeLabel(data.orderType),
        data.status,
        medicalOrderStatusLabel(data.status),
        medicalOrderPriorityLabel(data.priority),
        data.description,
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

  applyCareFilter(): void {
    const raw = this.filterCareId.trim();
    if (raw && !/^[1-9][0-9]*$/.test(raw)) {
      this.snackBar.open('El filtro por ID atención debe ser un entero positivo (solo dígitos).', 'Cerrar', {
        duration: 6000,
      });
      return;
    }
    this.reload();
  }

  clearCareFilter(): void {
    this.filterCareId = '';
    this.reload();
  }

  reload(): void {
    this.loading = true;
    const n = Number(this.filterCareId);
    const medicalCareId = Number.isFinite(n) && n > 0 && /^[1-9][0-9]*$/.test(this.filterCareId.trim()) ? n : undefined;
    this.api.list(medicalCareId).subscribe({
      next: (rows) => {
        this.loading = false;
        this.dataSource.data = rows;
        if (medicalCareId != null && rows.length === 0) {
          this.snackBar.open(
            'No hay órdenes médicas para el ID de atención indicado. Verifique el número o cree una orden desde la atención correspondiente.',
            'Cerrar',
            { duration: 8000 },
          );
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudieron cargar las órdenes médicas.'), 'Cerrar', {
          duration: 7000,
        });
      },
    });
  }

  applyTextFilter(value: string): void {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  orderStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETADO':
        return 'st-done';
      case 'RECHAZADO':
      case 'ANULADO':
        return 'st-bad';
      case 'EN_PROCESO':
        return 'st-wip';
      case 'PARCIAL':
        return 'st-partial';
      default:
        return 'st-pend';
    }
  }

  clip(s: string, max: number): string {
    if (!s) {
      return '—';
    }
    return s.length <= max ? s : `${s.slice(0, max)}…`;
  }

  openCreate(): void {
    this.dialog
      .open<MedicalOrderFormDialogComponent, MedicalOrderFormDialogData, boolean>(MedicalOrderFormDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: MedicalOrderResponse): void {
    this.dialog
      .open<MedicalOrderFormDialogComponent, MedicalOrderFormDialogData, boolean>(MedicalOrderFormDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        data: { mode: 'edit', medicalOrderId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: MedicalOrderResponse): void {
    this.dialog.open(MedicalOrderDetailDialogComponent, { width: '520px', maxWidth: '95vw', data: row });
  }

  private static readonly AUDIT_RETAIN =
    'El registro permanecerá en el sistema para auditoría e historial.';

  confirmDelete(row: MedicalOrderResponse): void {
    const desc = (row.description ?? '').trim();
    const descShort = desc.length > 120 ? `${desc.slice(0, 120)}…` : desc;
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Anular orden médica',
          message: `¿Anular la orden #${row.id}?\n\nAtención médica #${row.medicalCareId} · ${row.orderType}\n${descShort || '(Sin descripción)'}\n\n${MedicalOrderListPageComponent.AUDIT_RETAIN}`,
          confirmLabel: 'Anular orden',
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
            this.snackBar.open('Orden anulada.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo anular la orden.'), 'Cerrar', { duration: 7000 });
          },
        });
      });
  }
}
