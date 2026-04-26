import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SpecialtyResponse } from '../models/specialty.models';

@Component({
  selector: 'app-specialty-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './specialty-detail-dialog.component.html',
  styleUrl: './specialty-detail-dialog.component.scss',
})
export class SpecialtyDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<SpecialtyDetailDialogComponent>);
  readonly data = inject<SpecialtyResponse>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
