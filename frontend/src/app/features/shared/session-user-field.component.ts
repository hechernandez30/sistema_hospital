import { Component, Input, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';
import { formatSessionUserDisplay } from './session-user.utils';

@Component({
  selector: 'app-session-user-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="session-user-field full">
      <mat-label>{{ label }}</mat-label>
      <input matInput [value]="displayValue" readonly disabled tabindex="-1" />
      <mat-hint>Tomado de su sesión actual; no editable</mat-hint>
    </mat-form-field>
  `,
  styles: `
    .session-user-field.full {
      width: 100%;
    }
    .session-user-field input:disabled {
      color: var(--hh-text, #1e293b);
      -webkit-text-fill-color: var(--hh-text, #1e293b);
    }
  `,
})
export class SessionUserFieldComponent {
  private readonly auth = inject(AuthService);

  @Input({ required: true }) label!: string;

  get displayValue(): string {
    return formatSessionUserDisplay(this.auth);
  }
}
