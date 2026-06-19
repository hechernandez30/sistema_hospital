import { jsPDF } from 'jspdf';
import { PaymentView, paymentMethodLabel } from '../models/payment.models';
import { formatReportDateTime, formatReportDecimal } from '../../reports/utils/report-export.utils';

const MARGIN_X = 18;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

function sanitizeFileName(value: string): string {
  return value.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(0, 60);
}

function drawLabelValue(doc: jsPDF, y: number, label: string, value: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(label, MARGIN_X, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  const lines = doc.splitTextToSize(value, CONTENT_WIDTH - 52);
  doc.text(lines, MARGIN_X + 52, y);
  return y + Math.max(5.5, lines.length * 4.5);
}

/** Genera y descarga el comprobante PDF de un pago en estado PAGADO con Nº recibo. */
export function exportPaymentReceiptPdf(payment: PaymentView): void {
  const receiptNumber = payment.receiptNumber?.trim();
  if (!receiptNumber) {
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(21, 101, 192);
  doc.text('Hospital H&H', MARGIN_X, y);

  y += 8;
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text('Comprobante de pago', MARGIN_X, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Nº recibo: ${receiptNumber}`, MARGIN_X, y);

  y += 4;
  doc.setDrawColor(207, 216, 227);
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 8;

  y = drawLabelValue(doc, y, 'Fecha / hora', formatReportDateTime(payment.paidAt));
  y = drawLabelValue(doc, y, 'Paciente', payment.patientLabel);
  y = drawLabelValue(
    doc,
    y,
    'Admisión',
    payment.admissionId != null ? `#${payment.admissionId}` : '—',
  );
  y = drawLabelValue(
    doc,
    y,
    'Orden médica',
    payment.medicalOrderId != null ? `#${payment.medicalOrderId}` : '—',
  );
  y = drawLabelValue(doc, y, 'Concepto', payment.concept);

  y += 3;
  doc.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
  y += 8;

  y = drawLabelValue(doc, y, 'Subtotal', `Q ${formatReportDecimal(payment.subtotal)}`);
  y = drawLabelValue(doc, y, '% seguro', `${formatReportDecimal(payment.insurancePercent)} %`);
  y = drawLabelValue(doc, y, 'Descuento seguro', `Q ${formatReportDecimal(payment.insuranceDiscount)}`);
  y = drawLabelValue(doc, y, 'Copago', `Q ${formatReportDecimal(payment.copay)}`);

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 71, 161);
  doc.text('Total a pagar', MARGIN_X, y);
  doc.text(`Q ${formatReportDecimal(payment.totalToPay)}`, MARGIN_X + 52, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0);
  y = drawLabelValue(
    doc,
    y,
    'Método de pago',
    payment.paymentMethod
      ? `${paymentMethodLabel(payment.paymentMethod)} (${payment.paymentMethod})`
      : '—',
  );
  y = drawLabelValue(
    doc,
    y,
    'Usuario registro',
    payment.registeredByUserId != null ? `#${payment.registeredByUserId}` : '—',
  );

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Documento generado: ${new Date().toLocaleString('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })} · Pago #${payment.id}`,
    MARGIN_X,
    y,
  );

  doc.save(`comprobante-${sanitizeFileName(receiptNumber)}.pdf`);
}
