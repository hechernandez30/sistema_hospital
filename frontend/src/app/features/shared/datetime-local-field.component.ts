import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subscription, merge } from 'rxjs';
import { joinDatetimeLocal, splitDatetimeLocal } from './datetime-local';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Normaliza valor de `input[type=time]` a HH:mm. */
function normalizeTimeValue(raw: string): string {
  const v = raw?.trim();
  if (!v) {
    return '';
  }
  const parts = v.split(':');
  if (parts.length < 2) {
    return '';
  }
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return '';
  }
  return `${pad2(h)}:${pad2(m)}`;
}

@Component({
  selector: 'app-datetime-local-field',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatetimeLocalFieldComponent),
      multi: true,
    },
  ],
  templateUrl: './datetime-local-field.component.html',
  styleUrl: './datetime-local-field.component.scss',
})
export class DatetimeLocalFieldComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input({ required: true }) label!: string;

  @ViewChild('timeInput') private timeInputRef?: ElementRef<HTMLInputElement>;

  readonly dateCtrl = new FormControl<Date | null>(null);
  readonly timeCtrl = new FormControl<string>('', { nonNullable: true });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private subs = new Subscription();
  private syncing = false;
  disabled = false;

  ngOnInit(): void {
    this.subs.add(
      merge(this.dateCtrl.valueChanges, this.timeCtrl.valueChanges).subscribe(() => {
        if (this.syncing) {
          return;
        }
        this.emitValue();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  writeValue(value: string | null | undefined): void {
    this.syncing = true;
    const { date, time } = splitDatetimeLocal(value != null ? String(value) : '');
    this.dateCtrl.setValue(date, { emitEvent: false });
    this.timeCtrl.setValue(normalizeTimeValue(time), { emitEvent: false });
    this.syncing = false;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.dateCtrl.disable({ emitEvent: false });
      this.timeCtrl.disable({ emitEvent: false });
    } else {
      this.dateCtrl.enable({ emitEvent: false });
      this.timeCtrl.enable({ emitEvent: false });
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  /** Abre el selector nativo de hora (Chrome/Edge); el icono de Material suele ocultarlo. */
  openTimePicker(): void {
    const el = this.timeInputRef?.nativeElement;
    if (!el || this.disabled) {
      return;
    }
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
        return;
      } catch {
        // showPicker puede fallar fuera de gesto de usuario; continuar con focus/click
      }
    }
    el.focus();
    el.click();
  }

  private emitValue(): void {
    const time = normalizeTimeValue(this.timeCtrl.value);
    if (time !== this.timeCtrl.value) {
      this.syncing = true;
      this.timeCtrl.setValue(time, { emitEvent: false });
      this.syncing = false;
    }
    this.onChange(joinDatetimeLocal(this.dateCtrl.value, time));
  }
}
