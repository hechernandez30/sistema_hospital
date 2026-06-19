import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportExportColumn<T> {
  header: string;
  cell: (row: T) => string;
}

export function exportReportCsv(fileName: string, columns: ReportExportColumn<unknown>[], rows: readonly unknown[]): void {
  const headers = columns.map((c) => c.header);
  const lines = [
    headers.join(','),
    ...rows.map((row) => columns.map((c) => csvEscape(c.cell(row))).join(',')),
  ];
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), `${fileName}.csv`);
}

export function exportReportPdf(
  title: string,
  fileName: string,
  columns: ReportExportColumn<unknown>[],
  rows: readonly unknown[],
): void {
  const headers = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((c) => c.cell(row)));
  const orientation = headers.length > 5 ? 'landscape' : 'portrait';

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generado: ${formatGeneratedAt()}`, 14, 22);
  doc.setTextColor(0);

  autoTable(doc, {
    head: [headers],
    body,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [21, 101, 192], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${fileName}.pdf`);
}

export function formatReportDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatReportDecimal(value: number): string {
  return value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatGeneratedAt(): string {
  return new Date().toLocaleString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
