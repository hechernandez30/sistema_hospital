import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../models/api-error-response.model';

/** Mensajes del backend en inglés → español (sin modificar el servidor). */
function translateKnownMessage(raw: string): string {
  const msg = raw.trim();
  if (!msg) {
    return raw;
  }
  const lower = msg.toLowerCase();

  const exact: Record<string, string> = {
    'Validation failed': 'Los datos enviados no cumplen las validaciones. Revise los campos marcados.',
    'Data integrity violation': 'No se puede completar la operación por restricciones de datos (por ejemplo, registros vinculados).',
    Unauthorized: 'No autorizado. Inicie sesión nuevamente.',
    Forbidden: 'No tiene permiso para realizar esta acción.',
    'Unexpected error': 'Error inesperado en el servidor. Intente más tarde.',
    'Patient code already exists': 'Ese código de paciente ya está registrado. Modifique el código e intente de nuevo.',
  };
  if (exact[msg]) {
    return exact[msg];
  }

  if (lower === 'not found' || lower.endsWith(' not found') || lower.includes('not found:')) {
    return 'No se encontró el recurso solicitado.';
  }

  if (lower.includes('already exists')) {
    if (lower.includes('username')) {
      return 'Ese nombre de usuario ya está registrado.';
    }
    if (lower.includes('email')) {
      return 'Ese correo electrónico ya está registrado.';
    }
    if (lower.includes('employee') && lower.includes('code')) {
      return 'Ese código de empleado ya está registrado. Modifique el código e intente de nuevo.';
    }
    if (lower.includes('patient') && lower.includes('code')) {
      return 'Ese código de paciente ya está registrado. Modifique el código e intente de nuevo.';
    }
    return 'Ya existe un registro con esos datos.';
  }

  if (lower.includes('not found')) {
    return 'No se encontró el recurso solicitado.';
  }

  return raw;
}

/** Mensaje legible para MatSnackBar a partir de errores HTTP del backend. */
export function getHttpErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'No hay conexión con el servidor. Verifique su red o que la API esté en ejecución.';
    }
    if (err.status === 401) {
      return 'Sesión no válida o caducada. Inicie sesión nuevamente.';
    }
    if (err.status === 403) {
      return 'No tiene permiso para realizar esta acción.';
    }
    if (err.status === 404) {
      return 'No se encontró el recurso solicitado.';
    }
    if (err.status === 409) {
      return translateKnownMessage('Data integrity violation');
    }

    const body = err.error as ApiErrorResponse | string | null | undefined;
    if (body && typeof body === 'object' && 'message' in body) {
      const api = body as ApiErrorResponse;
      const msg = String(api.message ?? '').trim();
      if (msg.length) {
        return translateKnownMessage(msg);
      }
    }
    if (typeof body === 'string' && body.trim().length) {
      return translateKnownMessage(body);
    }
    if (err.message) {
      return translateKnownMessage(err.message);
    }
  }
  return fallback;
}
