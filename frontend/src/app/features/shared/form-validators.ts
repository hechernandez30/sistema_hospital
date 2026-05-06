import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/** CU03 — alineado a `UserCreateRequest` / `UserUpdateRequest` del backend */
export const PASSWORD_CU03_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,255}$/;

export function cu03PasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    PASSWORD_CU03_PATTERN.test(String(control.value ?? '')) ? null : { cu03Password: true };
}

/** En edición: vacío permite no cambiar contraseña. */
export function optionalCu03PasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = stringOrEmpty(control.value);
    if (!s) {
      return null;
    }
    return PASSWORD_CU03_PATTERN.test(s) ? null : { cu03Password: true };
  };
}

/**
 * CU02 — nombres de persona: entre 2 y 100 caracteres, solo letras Unicode y espacios, al menos una letra.
 * No permite guiones, apostrofes ni otros signos de puntuación.
 */
export const PATIENT_PERSON_NAME_CU02_PATTERN = /^(?=.*\p{L})[\p{L} ]{2,100}$/u;

export function patientPersonNameCu02Validator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = stringOrEmpty(control.value);
    if (!s) {
      return null;
    }
    return PATIENT_PERSON_NAME_CU02_PATTERN.test(s) ? null : { patientPersonNameCu02: true };
  };
}

/** Backend patient phone: optional + then 8–15 digits */
export const PHONE_BACKEND_PATTERN = /^\+?[0-9]{8,15}$/;

/** DPI/NIT: alfanumérico, guión o punto (sin espacios raros); max en control */
export const DPI_NIT_PATTERN = /^[A-Za-z0-9.\-]+$/;

export function optionalPhoneBackendPattern(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value as string | null | undefined)?.trim() ?? '';
    if (!v) {
      return null;
    }
    return PHONE_BACKEND_PATTERN.test(v) ? null : { phoneFormat: true };
  };
}

export function requiredPhoneBackendPattern(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = (control.value as string | null | undefined)?.trim() ?? '';
    if (!v) {
      return { required: true };
    }
    return PHONE_BACKEND_PATTERN.test(v) ? null : { phoneFormat: true };
  };
}

/** Entero > 0 (solo dígitos en texto); vacío inválido */
export function requiredPositiveInteger(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = stringOrEmpty(control.value);
    if (!s) {
      return { required: true };
    }
    if (!/^[1-9][0-9]{0,18}$/.test(s)) {
      return { positiveInteger: true };
    }
    return null;
  };
}

/** Vacío o entero ≥ 1 */
export function optionalPositiveInteger(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = stringOrEmpty(control.value);
    if (!s) {
      return null;
    }
    if (!/^[1-9][0-9]{0,18}$/.test(s)) {
      return { positiveInteger: true };
    }
    return null;
  };
}

/** Vacío o entero en [min, max] inclusive */
export function optionalIntRange(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = stringOrEmpty(control.value);
    if (!s) {
      return null;
    }
    if (!/^[0-9]+$/.test(s)) {
      return { integer: true };
    }
    const n = parseInt(s, 10);
    if (!Number.isFinite(n) || n < min || n > max) {
      return { range: { min, max } };
    }
    return null;
  };
}

/** Vacío o decimal (coma o punto) en rango inclusivo */
export function optionalDecimalRange(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = stringOrEmpty(control.value).replace(',', '.');
    if (!s) {
      return null;
    }
    if (!/^\d+(\.\d+)?$/.test(s)) {
      return { decimal: true };
    }
    const n = Number(s);
    if (!Number.isFinite(n) || n < min || n > max) {
      return { range: { min, max } };
    }
    return null;
  };
}

/** Fecha tipo input date (yyyy-MM-dd) debe ser anterior a hoy (alineado a @Past) */
/** Vacío o correo válido (alineado a @Email del backend) */
export function optionalEmail(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = stringOrEmpty(control.value);
    if (!v) {
      return null;
    }
    return Validators.email(new FormControl(v));
  };
}

export function birthDatePastValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const s = stringOrEmpty(control.value);
    if (!s) {
      return null;
    }
    const d = parseLocalDate(s);
    if (!d) {
      return { date: true };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() >= today.getTime()) {
      return { notPast: true };
    }
    return null;
  };
}

export function parsePositiveInt(raw: unknown): number | null {
  const s = stringOrEmpty(raw);
  if (!s) {
    return null;
  }
  const n = parseInt(s, 10);
  return Number.isFinite(n) && /^[1-9][0-9]*$/.test(s) ? n : null;
}

export function parseOptionalInt(raw: unknown): number | null {
  const s = stringOrEmpty(raw);
  if (!s) {
    return null;
  }
  if (!/^[0-9]+$/.test(s)) {
    return null;
  }
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export function parseOptionalDecimalString(raw: unknown): string | null {
  const s = stringOrEmpty(raw).replace(',', '.');
  if (!s) {
    return null;
  }
  return s;
}

function stringOrEmpty(v: unknown): string {
  if (v == null) {
    return '';
  }
  return String(v).trim();
}

function parseLocalDate(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt;
}
