import { DatePipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentView } from '../models/appointment.models';
import { appointmentStatusChipClass } from '../appointment-status-chip';

export type AppointmentDetailDialogResult = 'edit' | 'cancel';

export interface AppointmentDetailDialogData extends AppointmentView {
  showActions?: boolean;
}

@Component({
  selector: 'app-appointment-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatDividerModule, MatIconModule, DatePipe, NgClass],
  templateUrl: './appointment-detail-dialog.component.html',
  styleUrl: './appointment-detail-dialog.component.scss',
})
export class AppointmentDetailDialogComponent {
  readonly data = inject<AppointmentDetailDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AppointmentDetailDialogComponent, AppointmentDetailDialogResult | undefined>);

  statusChipClass(status: string): string {
    return appointmentStatusChipClass(status);
  }

  edit(): void {
    this.dialogRef.close('edit');
  }

  cancelAppointment(): void {
    this.dialogRef.close('cancel');
  }
}
