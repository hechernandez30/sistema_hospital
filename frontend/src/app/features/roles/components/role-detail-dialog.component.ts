import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RoleResponse } from '../models/role.models';

@Component({
  selector: 'app-role-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './role-detail-dialog.component.html',
  styleUrl: './role-detail-dialog.component.scss',
})
export class RoleDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<RoleDetailDialogComponent>);
  readonly data = inject<RoleResponse>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
