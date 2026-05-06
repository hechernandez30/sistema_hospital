import { DatePipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AppointmentView } from '../models/appointment.models';
import { appointmentStatusChipClass } from '../appointment-status-chip';

@Component({
  selector: 'app-appointment-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatDividerModule, MatIconModule, DatePipe, NgClass],
  templateUrl: './appointment-detail-dialog.component.html',
  styleUrl: './appointment-detail-dialog.component.scss',
})
export class AppointmentDetailDialogComponent {
  readonly data = inject<AppointmentView>(MAT_DIALOG_DATA);

  statusChipClass(status: string): string {
    return appointmentStatusChipClass(status);
  }
}
