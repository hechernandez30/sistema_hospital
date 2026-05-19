import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import {
  ROLES_ADMISSIONS_TRIAGE,
  ROLES_APPOINTMENTS,
  ROLES_AUDIT,
  ROLES_MEDICATIONS,
  ROLES_PATIENTS,
  ROLES_PAYMENTS,
} from '../../../core/constants/role-routes';
import { PatientApiService } from '../../../features/patients/services/patient-api.service';
import { AppointmentApiService } from '../../../features/appointments/services/appointment-api.service';
import { AdmissionApiService } from '../../../features/admissions/services/admission-api.service';
import { PaymentApiService } from '../../../features/payments/services/payment-api.service';
import { MedicationApiService } from '../../../features/medications/services/medication-api.service';
import { AuditLogApiService } from '../../../features/audit-logs/services/audit-log-api.service';
import { AuditLogResponse } from '../../../features/audit-logs/models/audit-log.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';

export interface DashboardStatCard {
  id: string;
  title: string;
  value: string;
  hint?: string;
  icon: string;
  link: string;
  linkLabel: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
    DatePipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly patientApi = inject(PatientApiService);
  private readonly appointmentApi = inject(AppointmentApiService);
  private readonly admissionApi = inject(AdmissionApiService);
  private readonly paymentApi = inject(PaymentApiService);
  private readonly medicationApi = inject(MedicationApiService);
  private readonly auditApi = inject(AuditLogApiService);

  readonly user = this.auth.getUsername();

  loading = true;
  loadError: string | null = null;
  statCards: DashboardStatCard[] = [];
  recentAudit: AuditLogResponse[] = [];

  ngOnInit(): void {
    const q: Record<string, Observable<unknown>> = {};
    if (this.auth.hasAnyRole(ROLES_PATIENTS)) {
      q['patients'] = this.patientApi.list();
    }
    if (this.auth.hasAnyRole(ROLES_APPOINTMENTS)) {
      q['appointments'] = this.appointmentApi.list();
    }
    if (this.auth.hasAnyRole(ROLES_ADMISSIONS_TRIAGE)) {
      q['admissions'] = this.admissionApi.list();
    }
    if (this.auth.hasAnyRole(ROLES_PAYMENTS)) {
      q['payments'] = this.paymentApi.list();
    }
    if (this.auth.hasAnyRole(ROLES_MEDICATIONS)) {
      q['medications'] = this.medicationApi.list();
    }
    if (this.auth.hasAnyRole(ROLES_AUDIT)) {
      q['auditLogs'] = this.auditApi.list();
    }

    const keys = Object.keys(q);
    if (keys.length === 0) {
      this.loading = false;
      return;
    }

    forkJoin(q).subscribe({
      next: (res) => {
        this.loading = false;
        this.loadError = null;
        const cards: DashboardStatCard[] = [];

        const patients = res['patients'] as unknown[] | undefined;
        if (patients) {
          cards.push({
            id: 'patients',
            title: 'Pacientes',
            value: String(patients.length),
            hint: 'Registros en el catálogo',
            icon: 'personal_injury',
            link: '/app/pacientes',
            linkLabel: 'Ir a pacientes',
          });
        }

        const appointments = res['appointments'] as unknown[] | undefined;
        if (appointments) {
          cards.push({
            id: 'appointments',
            title: 'Citas',
            value: String(appointments.length),
            hint: 'Total en agenda',
            icon: 'event',
            link: '/app/citas',
            linkLabel: 'Ir a citas',
          });
        }

        const admissions = res['admissions'] as unknown[] | undefined;
        if (admissions) {
          cards.push({
            id: 'admissions',
            title: 'Admisiones',
            value: String(admissions.length),
            hint: 'Registros de admisión',
            icon: 'local_hospital',
            link: '/app/admisiones',
            linkLabel: 'Ir a admisiones',
          });
        }

        const payments = res['payments'] as unknown[] | undefined;
        if (payments) {
          cards.push({
            id: 'payments',
            title: 'Pagos',
            value: String(payments.length),
            hint: 'Registros de pagos',
            icon: 'payments',
            link: '/app/pagos',
            linkLabel: 'Ir a pagos',
          });
        }

        const medications = res['medications'] as { currentStock: number; minimumStock: number }[] | undefined;
        if (medications) {
          const low = medications.filter((m) => m.currentStock <= m.minimumStock).length;
          cards.push({
            id: 'medications',
            title: 'Medicamentos',
            value: String(medications.length),
            hint: `Con stock bajo o igual al mínimo: ${low}`,
            icon: 'medication',
            link: '/app/medicamentos',
            linkLabel: 'Ir a medicamentos',
          });
        }

        const auditLogs = res['auditLogs'] as AuditLogResponse[] | undefined;
        if (auditLogs) {
          this.recentAudit = auditLogs.slice(0, 5);
        }

        this.statCards = cards;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.loadError = getHttpErrorMessage(err, 'No se pudieron cargar los datos del panel.');
      },
    });
  }
}
