import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StaffResponse } from '../models/staff.models';

@Component({
  selector: 'app-staff-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './staff-detail-dialog.component.html',
  styleUrl: './staff-detail-dialog.component.scss',
})
export class StaffDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<StaffDetailDialogComponent>);
  readonly data = inject<StaffResponse>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
