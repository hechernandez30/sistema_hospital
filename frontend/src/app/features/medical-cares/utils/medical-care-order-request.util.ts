import {
  MEDICAL_ORDER_TYPES,
  MedicalOrderCreatePayload,
  MedicalOrderResponse,
  MedicalOrderType,
  medicalOrderTypeLabel,
} from '../../medical-orders/models/medical-order.models';

/** Órdenes que ya cubren el tipo; no se vuelven a crear al guardar. */
const TERMINAL_ORDER_STATUSES = new Set(['ANULADO', 'COMPLETADO', 'RECHAZADO']);

export const MEDICAL_CARE_ORDER_REQUESTS: ReadonlyArray<{
  orderType: MedicalOrderType;
  formControlName: 'orderLaboratorio' | 'orderImagen' | 'orderFarmacia' | 'orderHospitalizacion';
  label: string;
}> = [
  { orderType: 'LABORATORIO', formControlName: 'orderLaboratorio', label: 'Laboratorio' },
  { orderType: 'IMAGEN', formControlName: 'orderImagen', label: 'Imagenología' },
  { orderType: 'FARMACIA', formControlName: 'orderFarmacia', label: 'Farmacia' },
  { orderType: 'HOSPITALIZACION', formControlName: 'orderHospitalizacion', label: 'Hospitalización' },
];

const DESCRIPTION_PREFIX: Record<MedicalOrderType, string> = {
  LABORATORIO: 'Solicitud de laboratorio',
  IMAGEN: 'Solicitud de imagenología',
  FARMACIA: 'Solicitud de farmacia',
  HOSPITALIZACION: 'Solicitud de hospitalización',
};

function clipText(value: string, max: number): string {
  const t = value.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1)}…`;
}

/** Descripción breve para la orden generada desde la atención (CU12). */
export function buildMedicalOrderDescription(orderType: MedicalOrderType, diagnosis: string): string {
  const prefix = DESCRIPTION_PREFIX[orderType];
  const dx = diagnosis.trim();
  if (!dx) {
    return prefix;
  }
  return `${prefix} — ${clipText(dx, 120)}`;
}

export function activeOrderTypesFromList(orders: readonly MedicalOrderResponse[]): Set<MedicalOrderType> {
  const types = new Set<MedicalOrderType>();
  for (const order of orders) {
    if (TERMINAL_ORDER_STATUSES.has(order.status)) {
      continue;
    }
    if (MEDICAL_ORDER_TYPES.includes(order.orderType as MedicalOrderType)) {
      types.add(order.orderType as MedicalOrderType);
    }
  }
  return types;
}

export function buildMedicalOrderCreatePayload(
  medicalCareId: number,
  orderType: MedicalOrderType,
  diagnosis: string,
): MedicalOrderCreatePayload {
  return {
    medicalCareId,
    orderType,
    description: buildMedicalOrderDescription(orderType, diagnosis),
    priority: 'NORMAL',
    status: 'PENDIENTE',
    observations: null,
  };
}

export function orderTypeCheckboxLabel(orderType: MedicalOrderType): string {
  return medicalOrderTypeLabel(orderType);
}

export interface MedicalCareOrderCheckboxValues {
  orderLaboratorio: boolean;
  orderImagen: boolean;
  orderFarmacia: boolean;
  orderHospitalizacion: boolean;
}

export function selectedOrderTypesFromForm(values: MedicalCareOrderCheckboxValues): MedicalOrderType[] {
  const selected: MedicalOrderType[] = [];
  for (const item of MEDICAL_CARE_ORDER_REQUESTS) {
    if (values[item.formControlName]) {
      selected.push(item.orderType);
    }
  }
  return selected;
}

export function orderTypesToCreate(
  selected: readonly MedicalOrderType[],
  existingActive: ReadonlySet<MedicalOrderType>,
): MedicalOrderType[] {
  return selected.filter((t) => !existingActive.has(t));
}

export function checkboxPatchFromCareAndOrders(
  requiresHospitalization: boolean,
  existingActive: ReadonlySet<MedicalOrderType>,
): MedicalCareOrderCheckboxValues {
  return {
    orderLaboratorio: existingActive.has('LABORATORIO'),
    orderImagen: existingActive.has('IMAGEN'),
    orderFarmacia: existingActive.has('FARMACIA'),
    orderHospitalizacion: existingActive.has('HOSPITALIZACION') || requiresHospitalization,
  };
}
