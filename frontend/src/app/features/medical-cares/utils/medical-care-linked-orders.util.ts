import { ImagingStudyResponse } from '../../imaging/models/imaging.models';
import { LaboratoryResponse, laboratoryStatusLabel } from '../../laboratory/models/laboratory.models';
import { MedicalOrderResponse } from '../../medical-orders/models/medical-order.models';

export type FulfillmentTone = 'pending' | 'in-progress' | 'done' | 'closed';

export interface MedicalCareExamListItem {
  kind: 'LABORATORIO' | 'IMAGEN';
  id: number;
  medicalOrderId: number;
  label: string;
  status: string;
  statusLabel: string;
  tone: FulfillmentTone;
  lab?: LaboratoryResponse;
  imaging?: ImagingStudyResponse;
}

export function fulfillmentStatusTone(status: string): FulfillmentTone {
  const s = (status ?? '').trim().toUpperCase();
  if (s === 'COMPLETADO') {
    return 'done';
  }
  if (s === 'ANULADO' || s === 'RECHAZADO') {
    return 'closed';
  }
  if (s === 'EN_PROCESO' || s === 'PARCIAL') {
    return 'in-progress';
  }
  return 'pending';
}

export function fulfillmentToneClass(tone: FulfillmentTone): string {
  return `tone-${tone}`;
}

export function examListKey(item: MedicalCareExamListItem): string {
  return `${item.kind}-${item.id}`;
}

export function buildExamsForOrders(
  orders: readonly MedicalOrderResponse[],
  labs: readonly LaboratoryResponse[],
  imagingStudies: readonly ImagingStudyResponse[],
): MedicalCareExamListItem[] {
  const orderIds = new Set(orders.map((o) => o.id));
  const items: MedicalCareExamListItem[] = [];

  for (const lab of labs) {
    if (!orderIds.has(lab.medicalOrderId)) {
      continue;
    }
    items.push({
      kind: 'LABORATORIO',
      id: lab.id,
      medicalOrderId: lab.medicalOrderId,
      label: `Laboratorio #${lab.id}`,
      status: lab.status,
      statusLabel: laboratoryStatusLabel(lab.status),
      tone: fulfillmentStatusTone(lab.status),
      lab,
    });
  }

  for (const study of imagingStudies) {
    if (!orderIds.has(study.medicalOrderId)) {
      continue;
    }
    items.push({
      kind: 'IMAGEN',
      id: study.id,
      medicalOrderId: study.medicalOrderId,
      label: `Imagen — ${study.studyType?.trim() || 'Estudio'}`,
      status: study.status,
      statusLabel: laboratoryStatusLabel(study.status),
      tone: fulfillmentStatusTone(study.status),
      imaging: study,
    });
  }

  return items.sort((a, b) => b.id - a.id);
}
