import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, merge } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TriageApiService } from '../services/triage-api.service';
import { TRIAGE_PRIORITY_OPTIONS, TriageCreatePayload, TriageUpdatePayload, triagePriorityLabel } from '../models/triage.models';
import { computeTriagePriorityFromVitals } from '../utils/triage-priority.util';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import {
  optionalDecimalRange,
  optionalIntRange,
  optionalPositiveInteger,
  parseOptionalDecimalString,
  parseOptionalInt,
  parsePositiveInt,
  requiredPositiveInteger,
} from '../../shared/form-validators';
import { AdmissionApiService } from '../../admissions/services/admission-api.service';
import { PatientApiService } from '../../patients/services/patient-api.service';
import { EntityPickerOption } from '../../shared/entity-picker.models';
import { buildAdmissionOptions, patientsToMap } from '../../shared/entity-picker.utils';
import { EntityAutocompleteComponent } from '../../shared/entity-autocomplete.component';

export interface TriageFormDialogData {
  mode: 'create' | 'edit';
  triageId?: number;
}

@Component({
  selector: 'app-triage-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    EntityAutocompleteComponent,
  ],
  templateUrl: './triage-form-dialog.component.html',
  styleUrl: './triage-form-dialog.component.scss',
})
export class TriageFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TriageApiService);
  private readonly admissionApi = inject(AdmissionApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly dialogRef = inject(MatDialogRef<TriageFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  readonly dialogData = inject<TriageFormDialogData>(MAT_DIALOG_DATA);

  readonly priorityOptions = TRIAGE_PRIORITY_OPTIONS;
  readonly triagePriorityLabelFn = triagePriorityLabel;
  admissionOptions: EntityPickerOption[] = [];
  catalogError: string | null = null;
  loading = false;
  saving = false;

  readonly form = this.fb.group({
    admissionId: ['', [requiredPositiveInteger()]],
    heartRate: ['', [optionalIntRange(0, 300)]],
    respiratoryRate: ['', [optionalIntRange(0, 120)]],
    systolicPressure: ['', [optionalIntRange(0, 300)]],
    diastolicPressure: ['', [optionalIntRange(0, 200)]],
    oxygenSaturation: ['', [optionalDecimalRange(0, 100)]],
    temperature: ['', [optionalDecimalRange(20, 45)]],
    pain: ['', [optionalIntRange(0, 10)]],
    symptoms: [''],
    priority: ['III_PRIORITARIO', [Validators.required]],
    targetMinutes: ['', [optionalIntRange(0, 999_999)]],
    responsibleStaffId: ['', [optionalPositiveInteger()]],
  });

  ngOnInit(): void {
    this.form.controls.priority.disable({ emitEvent: false });
    this.setupAutoPriorityFromVitals();
    this.loading = true;
    forkJoin({ patients: this.patientApi.list(), admissions: this.admissionApi.list() }).subscribe({
      next: ({ patients, admissions }) => {
        this.admissionOptions = buildAdmissionOptions(admissions, patientsToMap(patients), {
          excludeClosed: true,
        });
        this.catalogError = null;
        if (this.dialogData.mode === 'edit' && this.dialogData.triageId != null) {
          this.loadTriage(this.dialogData.triageId);
        } else {
          this.loading = false;
        }
      },
      error: (err: unknown) => {
        this.loading = false;
        this.catalogError = 'No se pudieron cargar admisiones.';
        this.snackBar.open(getHttpErrorMessage(err, this.catalogError), 'Cerrar', { duration: 7000 });
        this.dialogRef.close(false);
      },
    });
  }

  private loadTriage(id: number): void {
    this.api.getById(id).subscribe({
      next: (t) => {
        this.loading = false;
        this.form.patchValue({
            admissionId: t.admissionId != null ? String(t.admissionId) : '',
            heartRate: t.heartRate != null ? String(t.heartRate) : '',
            respiratoryRate: t.respiratoryRate != null ? String(t.respiratoryRate) : '',
            systolicPressure: t.systolicPressure != null ? String(t.systolicPressure) : '',
            diastolicPressure: t.diastolicPressure != null ? String(t.diastolicPressure) : '',
            oxygenSaturation: t.oxygenSaturation != null ? String(t.oxygenSaturation) : '',
            temperature: t.temperature != null ? String(t.temperature) : '',
            pain: t.pain != null ? String(t.pain) : '',
            symptoms: t.symptoms ?? '',
            priority: t.priority,
            targetMinutes: t.targetMinutes != null ? String(t.targetMinutes) : '',
            responsibleStaffId: t.responsibleStaffId != null ? String(t.responsibleStaffId) : '',
          });
          this.syncPriorityFromVitals();
        },
      error: (err: unknown) => {
        this.loading = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el triage.'), 'Cerrar', { duration: 6000 });
        this.dialogRef.close(false);
      },
    });
  }

  private setupAutoPriorityFromVitals(): void {
    const vitalControls = [
      this.form.controls.heartRate,
      this.form.controls.respiratoryRate,
      this.form.controls.systolicPressure,
      this.form.controls.diastolicPressure,
      this.form.controls.oxygenSaturation,
      this.form.controls.temperature,
      this.form.controls.pain,
    ];
    merge(...vitalControls.map((c) => c.valueChanges))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncPriorityFromVitals());
  }

  private syncPriorityFromVitals(): void {
    const v = this.form.getRawValue();
    const result = computeTriagePriorityFromVitals({
      heartRate: parseOptionalInt(v.heartRate),
      respiratoryRate: parseOptionalInt(v.respiratoryRate),
      systolicPressure: parseOptionalInt(v.systolicPressure),
      diastolicPressure: parseOptionalInt(v.diastolicPressure),
      oxygenSaturation: this.parseOptionalDecimalNumber(v.oxygenSaturation),
      temperature: this.parseOptionalDecimalNumber(v.temperature),
      pain: parseOptionalInt(v.pain),
    });
    if (result == null) {
      this.form.patchValue(
        { priority: 'III_PRIORITARIO', targetMinutes: '60' },
        { emitEvent: false },
      );
      return;
    }
    this.form.patchValue(
      {
        priority: result.priority,
        targetMinutes: String(result.targetMinutes),
      },
      { emitEvent: false },
    );
  }

  private parseOptionalDecimalNumber(raw: unknown): number | null {
    const s = parseOptionalDecimalString(raw);
    if (s == null) {
      return null;
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Revise los campos marcados: hay datos inválidos o incompletos.', 'Cerrar', { duration: 6000 });
      return;
    }
    const v = this.form.getRawValue();
    const admissionId = parsePositiveInt(v.admissionId);
    if (admissionId == null) {
      this.snackBar.open('ID de admisión no válido.', 'Cerrar', { duration: 5000 });
      return;
    }
    this.syncPriorityFromVitals();
    const vAfter = this.form.getRawValue();
    const payload = {
      admissionId,
      heartRate: parseOptionalInt(vAfter.heartRate),
      respiratoryRate: parseOptionalInt(vAfter.respiratoryRate),
      systolicPressure: parseOptionalInt(vAfter.systolicPressure),
      diastolicPressure: parseOptionalInt(vAfter.diastolicPressure),
      oxygenSaturation: parseOptionalDecimalString(vAfter.oxygenSaturation),
      temperature: parseOptionalDecimalString(vAfter.temperature),
      pain: parseOptionalInt(vAfter.pain),
      symptoms: vAfter.symptoms?.trim() ? vAfter.symptoms.trim() : null,
      priority: vAfter.priority,
      targetMinutes: parseOptionalInt(vAfter.targetMinutes),
      responsibleStaffId: parsePositiveInt(vAfter.responsibleStaffId),
    };
    this.saving = true;
    if (this.dialogData.mode === 'create') {
      this.api.create(payload as TriageCreatePayload).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.triageId != null) {
      this.api.update(this.dialogData.triageId, payload as TriageUpdatePayload).subscribe({
        next: () => this.ok(),
        error: (e) => this.err(e),
      });
    } else {
      this.saving = false;
      this.snackBar.open('No se pudo guardar: falta el identificador del triage.', 'Cerrar', { duration: 6000 });
    }
  }

  private ok(): void {
    this.saving = false;
    this.snackBar.open('Triage guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el triage.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
