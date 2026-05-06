import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../models/api-error-response.model';

/**
 * Traduce mensajes legacy en inglés del backend (Fase anterior) y normaliza algunos textos.
 * Los mensajes ya en español (Fase 1.1+) pasan sin cambio salvo coincidencias exactas abajo.
 */
function translateKnownMessage(raw: string): string {
  const msg = raw.trim();
  if (!msg) {
    return raw;
  }
  const lower = msg.toLowerCase();

  const exact: Record<string, string> = {
    'Validation failed': 'Los datos enviados no cumplen las validaciones. Revise los campos indicados.',
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

function shortFieldPath(fieldPath: string): string {
  const i = fieldPath.lastIndexOf('.');
  return i >= 0 ? fieldPath.slice(i + 1) : fieldPath;
}

const MAX_FIELDS_IN_SNACK = 8;

/** Concatena errores por campo para MatSnackBar (una sola línea legible). */
function formatFieldErrorsSnippet(fieldErrors: { field: string; message: string }[] | null | undefined): string {
  if (!fieldErrors?.length) {
    return '';
  }
  const parts = fieldErrors.slice(0, MAX_FIELDS_IN_SNACK).map((f) => {
    const label = shortFieldPath(f.field);
    return `${label}: ${f.message}`;
  });
  let s = parts.join(' · ');
  if (fieldErrors.length > MAX_FIELDS_IN_SNACK) {
    s += ` (+${fieldErrors.length - MAX_FIELDS_IN_SNACK} más)`;
  }
  return s;
}

function joinMainAndFields(main: string, fieldSnippet: string): string {
  const m = main.trim();
  if (!fieldSnippet) {
    return m;
  }
  return m ? `${m} · ${fieldSnippet}` : fieldSnippet;
}

function readApiError(err: HttpErrorResponse): {
  message?: string;
  fieldErrors?: { field: string; message: string }[] | null;
} {
  const body = err.error as ApiErrorResponse | string | null | undefined;
  if (body && typeof body === 'object' && 'message' in body) {
    const api = body as ApiErrorResponse;
    return {
      message: String(api.message ?? '').trim() || undefined,
      fieldErrors: api.fieldErrors,
    };
  }
  return {};
}

/** Mensaje legible para MatSnackBar a partir de errores HTTP del backend (incluye `fieldErrors` cuando existen). */
export function getHttpErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (err.status === 0) {
    return 'No hay conexión con el servidor. Verifique su red o que la API esté en ejecución.';
  }

  const { message: rawApiMsg, fieldErrors } = readApiError(err);
  const fromApi = rawApiMsg ? translateKnownMessage(rawApiMsg) : undefined;
  const fieldSnippet = formatFieldErrorsSnippet(fieldErrors ?? null);

  if (err.status === 401) {
    return joinMainAndFields(
      fromApi ?? 'Sesión no válida o caducada. Inicie sesión nuevamente.',
      fieldSnippet,
    );
  }
  if (err.status === 403) {
    return joinMainAndFields(fromApi ?? 'No tiene permiso para realizar esta acción.', fieldSnippet);
  }
  if (err.status === 404) {
    return joinMainAndFields(fromApi ?? 'No se encontró el recurso solicitado.', fieldSnippet);
  }
  if (err.status === 409) {
    return joinMainAndFields(
      fromApi ?? translateKnownMessage('Data integrity violation'),
      fieldSnippet,
    );
  }

  if (fromApi) {
    return joinMainAndFields(fromApi, fieldSnippet);
  }
  if (typeof err.error === 'string' && err.error.trim().length) {
    return joinMainAndFields(translateKnownMessage(err.error.trim()), fieldSnippet);
  }
  if (err.message) {
    return joinMainAndFields(translateKnownMessage(err.message), fieldSnippet);
  }
  return joinMainAndFields(fallback, fieldSnippet);
}

/** Devuelve el cuerpo tipado de error si la respuesta es JSON `ApiErrorResponse`. */
export function parseApiErrorResponse(err: unknown): ApiErrorResponse | null {
  if (!(err instanceof HttpErrorResponse)) {
    return null;
  }
  const body = err.error as ApiErrorResponse | null | undefined;
  if (body && typeof body === 'object' && 'message' in body && typeof (body as ApiErrorResponse).message === 'string') {
    return body as ApiErrorResponse;
  }
  return null;
}
