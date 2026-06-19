import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  LAB_REQUESTER_LABELS,
  LAB_REQUEST_TYPE_LABELS,
  LaboratoryResponse,
  laboratoryStatusLabel,
} from '../models/laboratory.models';
import { LaboratoryApiService } from '../services/laboratory-api.service';
import { formatAttachmentSize, triggerBlobDownload } from '../utils/laboratory-attachment.utils';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';

@Component({
  selector: 'app-laboratory-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, DatePipe],
  templateUrl: './laboratory-detail-dialog.component.html',
  styleUrl: './laboratory-detail-dialog.component.scss',
})
export class LaboratoryDetailDialogComponent {
  private readonly api = inject(LaboratoryApiService);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogRef = inject(MatDialogRef<LaboratoryDetailDialogComponent>);
  readonly data = inject<LaboratoryResponse>(MAT_DIALOG_DATA);
  readonly laboratoryStatusLabel = laboratoryStatusLabel;

  downloading = false;

  requesterDisplay(code: string | null): string {
    if (!code) {
      return '—';
    }
    const extra = LAB_REQUESTER_LABELS[code as keyof typeof LAB_REQUESTER_LABELS];
    return extra ? `${code} — ${extra}` : code;
  }

  requestTypeDisplay(code: string | null): string {
    if (!code) {
      return '—';
    }
    const extra = LAB_REQUEST_TYPE_LABELS[code as keyof typeof LAB_REQUEST_TYPE_LABELS];
    return extra ? `${code} — ${extra}` : code;
  }

  formatSize(bytes: number): string {
    return formatAttachmentSize(bytes);
  }

  downloadAttachment(): void {
    if (!this.data.attachment) {
      return;
    }
    const fileName = this.data.attachment.originalFileName;
    this.downloading = true;
    this.api.downloadAttachment(this.data.id).subscribe({
      next: (blob) => {
        this.downloading = false;
        triggerBlobDownload(blob, fileName);
      },
      error: (err: unknown) => {
        this.downloading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo descargar el adjunto.'), 'Cerrar', { duration: 7000 });
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
