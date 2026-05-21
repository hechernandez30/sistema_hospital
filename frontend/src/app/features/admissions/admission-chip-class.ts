import { ADMISSION_STATUSES } from './models/admission.models';

/** Clase CSS chip para estado CU11 */
export function admissionStatusChipClass(status: string): string {
  const m: Record<(typeof ADMISSION_STATUSES)[number], string> = {
    PENDIENTE: 'adm-status-pendiente',
    ADMITIDO: 'adm-status-admitido',
    ALTA: 'adm-status-alta',
    TRANSFERIDO: 'adm-status-transferido',
    RECHAZADO: 'adm-status-rechazado',
    ANULADO: 'adm-status-anulado',
  };
  return m[status as (typeof ADMISSION_STATUSES)[number]] ?? 'adm-status-rechazado';
}
