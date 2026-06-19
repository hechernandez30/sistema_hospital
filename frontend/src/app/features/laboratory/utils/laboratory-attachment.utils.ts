/** Alineado con RN03 backend (10 MB). */
export const LAB_ATTACHMENT_MAX_BYTES = 10_485_760;

export const LAB_ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function validateLaboratoryAttachmentFile(file: File): string | null {
  if (!file || file.size === 0) {
    return 'Seleccione un archivo válido.';
  }
  if (file.size > LAB_ATTACHMENT_MAX_BYTES) {
    return 'El archivo supera el tamaño máximo permitido (10 MB).';
  }
  const ext = extensionOf(file.name);
  const mime = EXTENSION_MIME[ext];
  if (!mime || !ALLOWED_MIME.has(mime)) {
    return 'Tipo no permitido. Use PDF o imagen (JPEG, PNG, WebP).';
  }
  return null;
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot < 0) {
    return '';
  }
  return fileName.slice(dot + 1).toLowerCase();
}
