import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  forwardRef,
  inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { EntityPickerOption } from './entity-picker.models';
import { parsePositiveInt } from './form-validators';

@Component({
  selector: 'app-entity-autocomplete',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
  ],
  templateUrl: './entity-autocomplete.component.html',
  styleUrl: './entity-autocomplete.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EntityAutocompleteComponent),
      multi: true,
    },
  ],
})
export class EntityAutocompleteComponent implements ControlValueAccessor, OnChanges {
  @Input({ required: true }) label = 'Seleccionar';
  @Input() hint = '';
  @Input() placeholder = 'Escriba para buscar…';
  @Input() options: EntityPickerOption[] = [];
  @Input() loading = false;
  @Input() loadError: string | null = null;
  @Input() emptyMessage = 'No hay registros disponibles.';
  @Input() noResultsMessage = 'Sin resultados. Pruebe otro término.';
  @Input() showClear = true;

  readonly inputControl = new FormControl<string>('', { nonNullable: true });
  filteredOptions: EntityPickerOption[] = [];

  /** ID seleccionado (string para el formulario reactivo). */
  storedId = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  disabled = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.applyFilter(this.inputControl.value);
      this.syncInputFromStoredId();
    }
  }

  writeValue(value: string | null | undefined): void {
    this.storedId = value != null ? String(value).trim() : '';
    this.syncInputFromStoredId();
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
      this.inputControl.disable({ emitEvent: false });
    } else {
      this.inputControl.enable({ emitEvent: false });
    }
  }

  onInput(value: string): void {
    this.applyFilter(value);
    const match = this.matchOptionByLabel(value);
    if (match) {
      this.selectOption(match, false);
    } else if (!value.trim()) {
      this.storedId = '';
      this.onChange('');
    } else {
      const id = parsePositiveInt(value.trim());
      if (id != null && this.options.some((o) => o.id === id)) {
        this.storedId = String(id);
        this.onChange(this.storedId);
      } else {
        this.storedId = '';
        this.onChange('');
      }
    }
  }

  onOptionPicked(option: EntityPickerOption): void {
    this.selectOption(option, true);
  }

  onBlur(): void {
    this.onTouched();
    const text = this.inputControl.value.trim();
    if (!text) {
      this.clear(false);
      return;
    }
    const match = this.matchOptionByLabel(text);
    if (match) {
      this.selectOption(match, false);
    } else {
      this.syncInputFromStoredId();
    }
  }

  clear(markTouched = true): void {
    this.storedId = '';
    this.inputControl.setValue('', { emitEvent: false });
    this.onChange('');
    this.applyFilter('');
    if (markTouched) {
      this.onTouched();
    }
  }

  displayFn = (): string => this.inputControl.value;

  private selectOption(option: EntityPickerOption, markTouched: boolean): void {
    this.storedId = String(option.id);
    this.inputControl.setValue(option.label, { emitEvent: false });
    this.onChange(this.storedId);
    if (markTouched) {
      this.onTouched();
    }
  }

  private syncInputFromStoredId(): void {
    const id = parsePositiveInt(this.storedId);
    if (id == null) {
      if (!this.inputControl.value) {
        return;
      }
      if (!this.options.length) {
        this.inputControl.setValue('', { emitEvent: false });
      }
      return;
    }
    const opt = this.options.find((o) => o.id === id);
    this.inputControl.setValue(opt?.label ?? `#${id}`, { emitEvent: false });
  }

  private applyFilter(raw: string): void {
    const q = raw.trim().toLowerCase();
    if (!q) {
      this.filteredOptions = [...this.options].slice(0, 50);
      return;
    }
    this.filteredOptions = this.options
      .filter((o) => o.searchText.includes(q) || o.label.toLowerCase().includes(q))
      .slice(0, 50);
  }

  private matchOptionByLabel(text: string): EntityPickerOption | undefined {
    const t = text.trim().toLowerCase();
    return this.options.find((o) => o.label.toLowerCase() === t);
  }
}
