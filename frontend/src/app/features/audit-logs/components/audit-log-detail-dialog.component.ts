import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuditLogView } from '../models/audit-log.models';

@Component({
  selector: 'app-audit-log-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './audit-log-detail-dialog.component.html',
  styleUrl: './audit-log-detail-dialog.component.scss',
})
export class AuditLogDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AuditLogDetailDialogComponent>);
  readonly data = inject<AuditLogView>(MAT_DIALOG_DATA);

  formatJson(value: Record<string, unknown> | null | undefined): string {
    if (value == null) {
      return '—';
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
