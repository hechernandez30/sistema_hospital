/** Clases CSS para chip de estado (CU04); misma nomenclatura que el backend. */
export function appointmentStatusChipClass(status: string): string {
  const map: Record<string, string> = {
    PROGRAMADA: 'apt-st-programada',
    REPROGRAMADA: 'apt-st-reprogramada',
    CANCELADA: 'apt-st-cancelada',
    ATENDIDA: 'apt-st-atendida',
    NO_ASISTIO: 'apt-st-no-asistio',
  };
  return map[status] ?? 'apt-st-unknown';
}
