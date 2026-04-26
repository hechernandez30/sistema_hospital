/** Convierte valor de input `datetime-local` a ISO compatible con `LocalDateTime` del backend. */
export function datetimeLocalToApi(value: string): string {
  const v = value?.trim();
  if (!v) {
    return '';
  }
  if (v.length === 16) {
    return `${v}:00`;
  }
  return v;
}

/** Recorta respuesta API a formato `datetime-local`. */
export function apiToDatetimeLocal(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.length >= 16 ? value.slice(0, 16) : value;
}
