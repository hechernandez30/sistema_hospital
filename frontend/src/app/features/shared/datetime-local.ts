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

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** `Date` local → valor para `input[type=datetime-local]`. */
export function dateToDatetimeLocal(d: Date): string {
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(
    d.getMinutes(),
  )}`;
}

/** Suma minutos al valor actual de datetime-local y devuelve el nuevo string para el input. */
export function addMinutesToDatetimeLocal(startValue: string, minutes: number): string {
  const iso = datetimeLocalToApi(startValue);
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || minutes < 1) {
    return '';
  }
  d.setMinutes(d.getMinutes() + minutes);
  return dateToDatetimeLocal(d);
}
