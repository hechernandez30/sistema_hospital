import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ImagingStudyResponse } from '../models/imaging.models';

@Component({
  selector: 'app-imaging-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './imaging-detail-dialog.component.html',
  styleUrl: './imaging-detail-dialog.component.scss',
})
export class ImagingDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ImagingDetailDialogComponent>);
  readonly data = inject<ImagingStudyResponse>(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
