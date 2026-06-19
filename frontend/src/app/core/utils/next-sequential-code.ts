/** Patrones funcionales PAC-0001 / EMP-0001 (solo dígitos tras el guion). */
const PAC_NUM = /^PAC-(\d+)$/i;
const EMP_NUM = /^EMP-(\d+)$/i;
const FACT_RECEIPT_NUM = /^Fact-(\d+)$/i;

/** CU06 RN03: AAAA-MM-DD-CC-NNNNNNN (7 a 10 dígitos finales; sugerencia con 7). */
const LAB_RECORD_NUM = /^(\d{4})-(\d{2})-(\d{2})-([A-Za-z]{2})-(\d{7,10})$/;

export type LabRecordRequestType = '' | 'MUESTRA_MEDICA' | 'LABORATORIO';

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

/** Siguiente Nº recibo de pago (Fact-00001) a partir de recibos ya registrados con ese patrón. */
export function nextReceiptNumberFromExisting(codes: readonly string[]): string {
  const max = maxSuffixFromCodes(codes, FACT_RECEIPT_NUM);
  return `Fact-${String(max + 1).padStart(5, '0')}`;
}

/** CC del expediente de muestra según CU06 RN02 (MM / LQ). */
export function labRecordCcFromRequestType(requestType: LabRecordRequestType): string {
  if (requestType === 'MUESTRA_MEDICA') {
    return 'MM';
  }
  return 'LQ';
}

/** Siguiente Nº expediente laboratorio (AAAA-MM-DD-CC-NNNNNNN) para la fecha y tipo dados. */
export function nextLabRecordNumberFromExisting(
  codes: readonly string[],
  options?: { requestType?: LabRecordRequestType; date?: Date },
): string {
  const date = options?.date ?? new Date();
  const cc = labRecordCcFromRequestType(options?.requestType ?? '');
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `${y}-${mo}-${day}-${cc}-`;

  let max = 0;
  for (const raw of codes) {
    const m = LAB_RECORD_NUM.exec(String(raw ?? '').trim());
    if (!m) {
      continue;
    }
    const recordPrefix = `${m[1]}-${m[2]}-${m[3]}-${m[4].toUpperCase()}-`;
    if (recordPrefix !== prefix) {
      continue;
    }
    const n = parseInt(m[5], 10);
    if (!Number.isNaN(n) && n > max) {
      max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(7, '0')}`;
}
