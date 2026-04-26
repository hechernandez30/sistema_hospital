import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserResponse } from '../models/user.models';

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './user-detail-dialog.component.html',
  styleUrl: './user-detail-dialog.component.scss',
})
export class UserDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserDetailDialogComponent>);
  readonly data = inject<UserResponse>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
