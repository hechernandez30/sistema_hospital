import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
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
import { PaymentApiService } from '../../services/payment-api.service';
import { PaymentView } from '../../models/payment.models';
import { PaymentFormDialogComponent, PaymentFormDialogData } from '../../components/payment-form-dialog.component';
import { PaymentDetailDialogComponent } from '../../components/payment-detail-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/confirm-dialog.component';
import { PatientApiService } from '../../../patients/services/patient-api.service';
import { PatientResponse } from '../../../patients/models/patient.models';
import { AuthService } from '../../../../core/services/auth.service';
import { ROLES_PAYMENTS } from '../../../../core/constants/role-routes';
import { getHttpErrorMessage } from '../../../../core/utils/http-error-message';

@Component({
  selector: 'app-payment-list-page',
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
    DecimalPipe,
  ],
  templateUrl: './payment-list-page.component.html',
  styleUrl: './payment-list-page.component.scss',
})
export class PaymentListPageComponent implements OnInit, AfterViewInit {
  private readonly api = inject(PaymentApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);

  readonly canMutate = this.auth.hasAnyRole(ROLES_PAYMENTS);

  filterPatientId = '';
  displayedColumns = [
    'id',
    'patientLabel',
    'concept',
    'totalToPay',
    'status',
    'paymentMethod',
    'paidAt',
    'actions',
  ];
  dataSource = new MatTableDataSource<PaymentView>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (data: PaymentView, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'concept':
          return (data.concept ?? '').toLowerCase();
        case 'patientLabel':
          return data.patientLabel.toLowerCase();
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
        data.patientLabel,
        String(data.patientId),
        data.concept,
        data.status,
        data.paymentMethod ?? '',
        String(data.totalToPay),
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

  applyPatientFilter(): void {
    this.reload();
  }

  clearPatientFilter(): void {
    this.filterPatientId = '';
    this.reload();
  }

  reload(): void {
    const pid = Number(this.filterPatientId);
    const patientId =
      Number.isFinite(pid) && pid > 0 && /^[1-9][0-9]*$/.test(this.filterPatientId.trim()) ? pid : undefined;
    if (this.filterPatientId.trim() && patientId == null) {
      this.snackBar.open('El filtro por ID paciente debe ser un entero positivo (solo dígitos).', 'Cerrar', {
        duration: 6000,
      });
      return;
    }
    this.loading = true;
    forkJoin({
      payments: this.api.list(patientId),
      patients: this.patientApi.list(),
    }).subscribe({
      next: ({ payments, patients }) => {
        this.loading = false;
        const pmap = new Map(patients.map((p) => [p.id, p] as const));
        this.dataSource.data = payments.map((p) => ({
          ...p,
          patientLabel: labelPatient(pmap.get(p.patientId), p.patientId),
        }));
      },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar la lista de pagos.'), 'Cerrar', {
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

  clip(s: string, max: number): string {
    if (!s) {
      return '—';
    }
    return s.length <= max ? s : `${s.slice(0, max)}…`;
  }

  openCreate(): void {
    this.dialog
      .open<PaymentFormDialogComponent, PaymentFormDialogData, boolean>(PaymentFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'create' },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openEdit(row: PaymentView): void {
    this.dialog
      .open<PaymentFormDialogComponent, PaymentFormDialogData, boolean>(PaymentFormDialogComponent, {
        width: '640px',
        maxWidth: '95vw',
        data: { mode: 'edit', paymentId: row.id },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.reload());
  }

  openDetail(row: PaymentView): void {
    this.dialog.open(PaymentDetailDialogComponent, { width: '520px', maxWidth: '95vw', data: row });
  }

  confirmDelete(row: PaymentView): void {
    const ctx = `${row.patientLabel} · ${this.clip(row.concept, 80)}`;
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '480px',
        data: {
          title: 'Eliminar pago',
          message: `¿Eliminar el pago #${row.id}?\n\n${ctx}\n\nEsta acción no se puede deshacer.`,
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
            this.snackBar.open('Pago eliminado.', 'Cerrar', { duration: 4000 });
          },
          error: (err: unknown) => {
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo eliminar el pago.'), 'Cerrar', { duration: 7000 });
          },
        });
      });
  }
}

function labelPatient(p: PatientResponse | undefined, id: number): string {
  if (!p) {
    return `Paciente #${id}`;
  }
  return `${p.firstName} ${p.lastName} (${p.patientCode})`;
}
