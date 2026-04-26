import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { roleGuard } from '../core/guards/role.guard';
import {
  ROLES_ADMIN_ONLY,
  ROLES_ADMISSIONS_TRIAGE,
  ROLES_APPOINTMENTS,
  ROLES_AUDIT,
  ROLES_IMAGING,
  ROLES_LAB,
  ROLES_MEDICAL_CARE,
  ROLES_MEDICAL_ORDERS,
  ROLES_MEDICATIONS,
  ROLES_PATIENTS,
  ROLES_PAYMENTS,
  ROLES_RRHH_SPECIALTIES,
} from '../core/constants/role-routes';

export const intranetRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
      {
        path: 'panel',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Panel — Hospital H&H',
      },
      {
        path: 'pacientes',
        canActivate: [roleGuard],
        data: { title: 'Pacientes', roles: [...ROLES_PATIENTS] },
        loadComponent: () =>
          import('../features/patients/pages/patient-list-page/patient-list-page.component').then(
            (m) => m.PatientListPageComponent,
          ),
      },
      {
        path: 'citas',
        canActivate: [roleGuard],
        data: { title: 'Citas', roles: [...ROLES_APPOINTMENTS] },
        loadComponent: () =>
          import('../features/appointments/pages/appointment-list-page/appointment-list-page.component').then(
            (m) => m.AppointmentListPageComponent,
          ),
      },
      {
        path: 'admisiones',
        canActivate: [roleGuard],
        data: { title: 'Admisiones', roles: [...ROLES_ADMISSIONS_TRIAGE] },
        loadComponent: () =>
          import('../features/admissions/pages/admission-list-page/admission-list-page.component').then(
            (m) => m.AdmissionListPageComponent,
          ),
      },
      {
        path: 'triage',
        canActivate: [roleGuard],
        data: { title: 'Triage', roles: [...ROLES_ADMISSIONS_TRIAGE] },
        loadComponent: () =>
          import('../features/triage/pages/triage-list-page/triage-list-page.component').then(
            (m) => m.TriageListPageComponent,
          ),
      },
      {
        path: 'atenciones',
        canActivate: [roleGuard],
        data: { title: 'Atenciones médicas', roles: [...ROLES_MEDICAL_CARE] },
        loadComponent: () =>
          import('../features/medical-cares/pages/medical-care-list-page/medical-care-list-page.component').then(
            (m) => m.MedicalCareListPageComponent,
          ),
      },
      {
        path: 'ordenes',
        canActivate: [roleGuard],
        data: { title: 'Órdenes médicas', roles: [...ROLES_MEDICAL_ORDERS] },
        loadComponent: () =>
          import('../features/medical-orders/pages/medical-order-list-page/medical-order-list-page.component').then(
            (m) => m.MedicalOrderListPageComponent,
          ),
      },
      {
        path: 'laboratorio',
        canActivate: [roleGuard],
        data: { title: 'Laboratorio', roles: [...ROLES_LAB] },
        loadComponent: () =>
          import('../features/laboratory/pages/laboratory-list-page/laboratory-list-page.component').then(
            (m) => m.LaboratoryListPageComponent,
          ),
      },
      {
        path: 'imagenes',
        canActivate: [roleGuard],
        data: { title: 'Imágenes médicas', roles: [...ROLES_IMAGING] },
        loadComponent: () =>
          import('../features/imaging/pages/imaging-list-page/imaging-list-page.component').then(
            (m) => m.ImagingListPageComponent,
          ),
      },
      {
        path: 'medicamentos',
        canActivate: [roleGuard],
        data: { title: 'Medicamentos', roles: [...ROLES_MEDICATIONS] },
        loadComponent: () =>
          import('../features/medications/pages/medication-list-page/medication-list-page.component').then(
            (m) => m.MedicationListPageComponent,
          ),
      },
      {
        path: 'pagos',
        canActivate: [roleGuard],
        data: { title: 'Pagos', roles: [...ROLES_PAYMENTS] },
        loadComponent: () =>
          import('../features/payments/pages/payment-list-page/payment-list-page.component').then(
            (m) => m.PaymentListPageComponent,
          ),
      },
      {
        path: 'bitacora',
        canActivate: [roleGuard],
        data: { title: 'Bitácora', roles: [...ROLES_AUDIT] },
        loadComponent: () =>
          import('../features/audit-logs/pages/audit-log-list-page/audit-log-list-page.component').then(
            (m) => m.AuditLogListPageComponent,
          ),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        data: { title: 'Usuarios', roles: [...ROLES_ADMIN_ONLY] },
        loadComponent: () =>
          import('../features/users/pages/user-list-page/user-list-page.component').then((m) => m.UserListPageComponent),
      },
      {
        path: 'roles',
        canActivate: [roleGuard],
        data: { title: 'Roles', roles: [...ROLES_ADMIN_ONLY] },
        loadComponent: () =>
          import('../features/roles/pages/role-list-page/role-list-page.component').then((m) => m.RoleListPageComponent),
      },
      {
        path: 'personal',
        canActivate: [roleGuard],
        data: { title: 'Personal (staff)', roles: [...ROLES_RRHH_SPECIALTIES] },
        loadComponent: () =>
          import('../features/staff/pages/staff-list-page/staff-list-page.component').then(
            (m) => m.StaffListPageComponent,
          ),
      },
      {
        path: 'especialidades',
        canActivate: [roleGuard],
        data: { title: 'Especialidades (gestión)', roles: [...ROLES_RRHH_SPECIALTIES] },
        loadComponent: () =>
          import('../features/specialties/pages/specialty-list-page/specialty-list-page.component').then(
            (m) => m.SpecialtyListPageComponent,
          ),
      },
    ],
  },
];
