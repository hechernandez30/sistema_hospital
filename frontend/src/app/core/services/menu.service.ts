import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

/** Coincide con roles del JWT (`ROLE_*`) y autorización del backend. */
export interface AppMenuItem {
  path: string;
  label: string;
  icon: string;
  /** Al menos uno de estos roles puede ver la entrada */
  roles: readonly string[];
}

const ALL_STAFF = [
  'ROLE_ADMINISTRADOR',
  'ROLE_MEDICO',
  'ROLE_RECEPCIONISTA',
  'ROLE_CAJERO',
  'ROLE_FARMACIA',
  'ROLE_LABORATORIO',
  'ROLE_RRHH',
  'ROLE_AUDITOR',
] as const;

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly auth = inject(AuthService);

  /** Items del menú lateral (rutas bajo `/app`). */
  private readonly allItems: AppMenuItem[] = [
    { path: '/app/panel', label: 'Panel', icon: 'dashboard', roles: ALL_STAFF },
    { path: '/app/pacientes', label: 'Pacientes', icon: 'personal_injury', roles: ['ROLE_ADMINISTRADOR', 'ROLE_MEDICO', 'ROLE_RECEPCIONISTA', 'ROLE_CAJERO'] },
    { path: '/app/citas', label: 'Citas', icon: 'event', roles: ['ROLE_ADMINISTRADOR', 'ROLE_MEDICO', 'ROLE_RECEPCIONISTA'] },
    { path: '/app/admisiones', label: 'Admisiones', icon: 'local_hospital', roles: ['ROLE_ADMINISTRADOR', 'ROLE_RECEPCIONISTA'] },
    { path: '/app/triage', label: 'Triage', icon: 'emergency', roles: ['ROLE_ADMINISTRADOR', 'ROLE_RECEPCIONISTA'] },
    { path: '/app/atenciones', label: 'Atenciones médicas', icon: 'medical_services', roles: ['ROLE_ADMINISTRADOR', 'ROLE_MEDICO'] },
    { path: '/app/ordenes', label: 'Órdenes médicas', icon: 'assignment', roles: ['ROLE_ADMINISTRADOR', 'ROLE_MEDICO', 'ROLE_FARMACIA'] },
    { path: '/app/laboratorio', label: 'Laboratorio', icon: 'science', roles: ['ROLE_ADMINISTRADOR', 'ROLE_MEDICO', 'ROLE_LABORATORIO'] },
    { path: '/app/imagenes', label: 'Imágenes', icon: 'photo_camera', roles: ['ROLE_ADMINISTRADOR', 'ROLE_MEDICO'] },
    { path: '/app/medicamentos', label: 'Medicamentos', icon: 'medication', roles: ['ROLE_ADMINISTRADOR', 'ROLE_FARMACIA'] },
    { path: '/app/pagos', label: 'Pagos', icon: 'payments', roles: ['ROLE_ADMINISTRADOR', 'ROLE_CAJERO'] },
    { path: '/app/reportes', label: 'Reportes', icon: 'insights', roles: ['ROLE_ADMINISTRADOR', 'ROLE_AUDITOR'] },
    { path: '/app/bitacora', label: 'Bitácora', icon: 'history', roles: ['ROLE_ADMINISTRADOR', 'ROLE_AUDITOR'] },
    { path: '/app/usuarios', label: 'Usuarios', icon: 'group', roles: ['ROLE_ADMINISTRADOR'] },
    { path: '/app/roles', label: 'Roles', icon: 'admin_panel_settings', roles: ['ROLE_ADMINISTRADOR'] },
    { path: '/app/personal', label: 'Personal', icon: 'badge', roles: ['ROLE_ADMINISTRADOR', 'ROLE_RRHH'] },
    { path: '/app/especialidades', label: 'Especialidades (gestión)', icon: 'category', roles: ['ROLE_ADMINISTRADOR', 'ROLE_RRHH'] },
  ];

  visibleMenuItems(): AppMenuItem[] {
    return this.allItems.filter((item) => this.auth.hasAnyRole(item.roles));
  }
}
