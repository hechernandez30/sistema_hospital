/** Patrones funcionales PAC-0001 / EMP-0001 (solo dígitos tras el guion). */
const PAC_NUM = /^PAC-(\d+)$/i;
const EMP_NUM = /^EMP-(\d+)$/i;

function maxSuffixFromCodes(codes: readonly string[], pattern: RegExp): number {
  let max = 0;
  for (const raw of codes) {
    const m = pattern.exec(String(raw ?? '').trim());
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > max) {
        max = n;
      }
    }
  }
  return max;
}

function formatSequential(prefix: 'PAC' | 'EMP', n: number): string {
  const next = n + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

/** Siguiente código paciente a partir de códigos ya cargados en lista (PAC-nnnn). */
export function nextPatientCodeFromExistingCodes(codes: readonly string[]): string {
  const max = maxSuffixFromCodes(codes, PAC_NUM);
  return formatSequential('PAC', max);
}

/** Siguiente código de empleado a partir de códigos ya cargados en lista (EMP-nnnn). */
export function nextEmployeeCodeFromExistingCodes(codes: readonly string[]): string {
  const max = maxSuffixFromCodes(codes, EMP_NUM);
  return formatSequential('EMP', max);
}
