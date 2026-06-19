import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { forkJoin, of, switchMap } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LaboratoryApiService } from '../services/laboratory-api.service';
import {
  EXTERNAL_REQUESTER_DESCRIPTION_TEMPLATE,
  LAB_REQUESTER_LABELS,
  LAB_REQUEST_TYPE_LABELS,
  LABORATORY_STATUSES,
  LaboratoryAttachmentMetadata,
  laboratoryStatusLabel,
  LaboratoryCreatePayload,
  LaboratoryResponse,
  LaboratoryUpdatePayload,
} from '../models/laboratory.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import {
  LabRecordRequestType,
  nextLabRecordNumberFromExisting,
} from '../../../core/utils/next-sequential-code';
import { optionalPositiveInteger, parsePositiveInt, requiredPositiveInteger } from '../../shared/form-validators';
import { apiToDatetimeLocal, datetimeLocalToApi } from '../../shared/datetime-local';
import { MedicalOrderApiService } from '../../medical-orders/services/medical-order-api.service';
import { MedicalCareApiService } from '../../medical-cares/services/medical-care-api.service';
import { PatientApiService } from '../../patients/services/patient-api.service';
import { EntityPickerOption } from '../../shared/entity-picker.models';
import { buildMedicalOrderOptions, patientsToMap } from '../../shared/entity-picker.utils';
import { EntityAutocompleteComponent } from '../../shared/entity-autocomplete.component';
import { MedicalCareResponse } from '../../medical-cares/models/medical-care.models';
import {
  formatAttachmentSize,
  LAB_ATTACHMENT_ACCEPT,
  validateLaboratoryAttachmentFile,
} from '../utils/laboratory-attachment.utils';

export interface LaboratoryFormDialogData {
  mode: 'create' | 'edit';
  laboratoryId?: number;
}

@Component({
  selector: 'app-laboratory-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    EntityAutocompleteComponent,
  ],
  templateUrl: './laboratory-form-dialog.component.html',
  styleUrl: './laboratory-form-dialog.component.scss',
})
export class LaboratoryFormDialogComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LaboratoryApiService);
  private readonly medicalOrderApi = inject(MedicalOrderApiService);
  private readonly medicalCareApi = inject(MedicalCareApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly dialogRef = inject(MatDialogRef<LaboratoryFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<LaboratoryFormDialogData>(MAT_DIALOG_DATA);

  readonly statuses = [...LABORATORY_STATUSES];
  readonly requesterLabels = LAB_REQUESTER_LABELS;
  readonly requestTypeLabels = LAB_REQUEST_TYPE_LABELS;
  readonly attachmentAccept = LAB_ATTACHMENT_ACCEPT;
  readonly sampleValidOptions = [
    { value: '', label: 'Sin indicar' },
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' },
  ];

  medicalOrderOptions: EntityPickerOption[] = [];
  catalogError: string | null = null;
  private careById = new Map<number, MedicalCareResponse>();
  private existingRecordNumbers: string[] = [];
  private requestTypeSub: Subscription | null = null;
  private requesterTypeSub: Subscription | null = null;

  /** Visible solo con solicitante EXTERNO. */
  showExternalRequesterGuidance = false;

  loading = false;
  saving = false;
  removingAttachment = false;

  existingAttachment: LaboratoryAttachmentMetadata | null = null;
  selectedFile: File | null = null;
  selectedFileLabel = '';

  readonly form = this.fb.group({
    medicalOrderId: ['', [requiredPositiveInteger()]],
    requesterType: ['' as string],
    requestType: ['' as string],
    recordNumber: ['', [Validators.maxLength(40)]],
    sampleDescription: [''],
    sampleReceived: [false],
    sampleValidChoice: ['' as string],
    incident: [''],
    result: [''],
    status: ['PENDIENTE', [Validators.required]],
    receptionAt: [''],
    resultAt: [''],
    responsibleStaffId: ['', [optionalPositiveInteger()]],
  });

  ngOnInit(): void {
    this.form.controls.sampleDescription.addValidators([Validators.maxLength(8000)]);
    if (this.dialogData.mode === 'create') {
      this.form.controls.sampleDescription.addValidators([Validators.required]);
    }
    this.form.controls.sampleDescription.updateValueAndValidity({ emitEvent: false });

    if (this.dialogData.mode === 'edit') {
      this.form.controls.medicalOrderId.clearValidators();
      this.form.controls.medicalOrderId.updateValueAndValidity({ emitEvent: false });
      if (this.dialogData.laboratoryId != null) {
        this.loading = true;
        this.api.getById(this.dialogData.laboratoryId).subscribe({
          next: (r) => this.patchFrom(r),
          error: (err: unknown) => {
            this.loading = false;
            this.snackBar.open(getHttpErrorMessage(err, 'No se pudo cargar el registro.'), 'Cerrar', { duration: 6000 });
            this.dialogRef.close(false);
          },
        });
      }
      return;
    }

    this.loading = true;
    forkJoin({
      orders: this.medicalOrderApi.list(),
      cares: this.medicalCareApi.list(),
      patients: this.patientApi.list(),
      labs: this.api.list(),
    }).subscribe({
      next: ({ orders, cares, patients, labs }) => {
        this.careById = new Map(cares.map((c) => [c.id, c] as const));
        this.medicalOrderOptions = buildMedicalOrderOptions(orders, patientsToMap(patients), this.careById, {
          orderType: 'LABORATORIO',
          excludeAnulled: true,
        });
        this.existingRecordNumbers = labs.map((l) => l.recordNumber).filter((n): n is string => !!n?.trim());
        this.applySuggestedRecordNumber();
        this.requestTypeSub = this.form.controls.requestType.valueChanges.subscribe(() => {
          this.applySuggestedRecordNumber();
        });
        this.wireRequesterTypeHandler();
        this.catalogError = null;
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.catalogError = 'No se pudieron cargar órdenes de laboratorio.';
        this.snackBar.open(getHttpErrorMessage(err, this.catalogError), 'Cerrar', { duration: 7000 });
        this.dialogRef.close(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.requestTypeSub?.unsubscribe();
    this.requesterTypeSub?.unsubscribe();
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      this.clearSelectedFile();
      return;
    }
    const validationError = validateLaboratoryAttachmentFile(file);
    if (validationError) {
      this.snackBar.open(validationError, 'Cerrar', { duration: 7000 });
      input.value = '';
      this.clearSelectedFile();
      return;
    }
    this.selectedFile = file;
    this.selectedFileLabel = `${file.name} (${formatAttachmentSize(file.size)})`;
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.selectedFileLabel = '';
  }

  removeExistingAttachment(): void {
    if (!this.isEdit || this.dialogData.laboratoryId == null || !this.existingAttachment) {
      return;
    }
    if (this.form.controls.status.value === 'COMPLETADO') {
      this.snackBar.open('No se puede quitar el adjunto de un registro completado.', 'Cerrar', { duration: 7000 });
      return;
    }
    this.removingAttachment = true;
    this.api.deleteAttachment(this.dialogData.laboratoryId).subscribe({
      next: () => {
        this.removingAttachment = false;
        this.existingAttachment = null;
        this.snackBar.open('Adjunto eliminado.', 'Cerrar', { duration: 4000 });
      },
      error: (err: unknown) => {
        this.removingAttachment = false;
        this.snackBar.open(getHttpErrorMessage(err, 'No se pudo eliminar el adjunto.'), 'Cerrar', { duration: 7000 });
      },
    });
  }

  private wireRequesterTypeHandler(): void {
    this.requesterTypeSub?.unsubscribe();
    this.syncExternalRequesterUi(this.form.controls.requesterType.value);
    this.requesterTypeSub = this.form.controls.requesterType.valueChanges.subscribe((rt) => {
      this.syncExternalRequesterUi(rt);
    });
  }

  private syncExternalRequesterUi(requesterType: string | null): void {
    const isExternal = requesterType === 'EXTERNO';
    this.showExternalRequesterGuidance = isExternal;

    const descControl = this.form.controls.sampleDescription;
    const current = (descControl.value ?? '').trim();
    const template = EXTERNAL_REQUESTER_DESCRIPTION_TEMPLATE.trim();

    if (isExternal) {
      if (!current || current === template) {
        descControl.setValue(EXTERNAL_REQUESTER_DESCRIPTION_TEMPLATE);
      }
      return;
    }

    if (current === template) {
      descControl.setValue('');
    }
  }

  private applySuggestedRecordNumber(): void {
    const requestType = this.form.controls.requestType.value as LabRecordRequestType;
    this.form.patchValue({
      recordNumber: nextLabRecordNumberFromExisting(this.existingRecordNumbers, { requestType }),
    });
  }

  private patchFrom(r: LaboratoryResponse): void {
    this.loading = false;
    let svc = '';
    if (r.sampleValid === true) {
      svc = 'true';
    }
    if (r.sampleValid === false) {
      svc = 'false';
    }
    this.existingAttachment = r.attachment;
    this.clearSelectedFile();
    this.form.patchValue({
      medicalOrderId: '',
      requesterType: (r.requesterType ?? '') as '' | 'INTERNO' | 'EXTERNO',
      requestType: (r.requestType ?? '') as '' | 'MUESTRA_MEDICA' | 'LABORATORIO',
      recordNumber: r.recordNumber ?? '',
      sampleDescription: r.sampleDescription ?? '',
      sampleReceived: r.sampleReceived,
      sampleValidChoice: svc,
      incident: r.incident ?? '',
      result: r.result ?? '',
      status: r.status as (typeof LABORATORY_STATUSES)[number],
      receptionAt: apiToDatetimeLocal(r.receptionAt),
      resultAt: apiToDatetimeLocal(r.resultAt),
      responsibleStaffId: r.responsibleStaffId != null ? String(r.responsibleStaffId) : '',
    });
    this.wireRequesterTypeHandler();
  }

  private parseSampleValid(choice: string): boolean | null {
    if (choice === 'true') {
      return true;
    }
    if (choice === 'false') {
      return false;
    }
    return null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.controls.sampleDescription.invalid) {
        this.snackBar.open('La descripción de la muestra es obligatoria al crear el registro', 'Cerrar', {
          duration: 8000,
        });
      } else {
        this.snackBar.open('Revise los campos marcados.', 'Cerrar', { duration: 6000 });
      }
      return;
    }

    const v = this.form.getRawValue();
    const targetStatus = v.status as string;
    const hasAttachment = !!this.existingAttachment || !!this.selectedFile;

    if (targetStatus === 'COMPLETADO' && !hasAttachment) {
      this.snackBar.open(
        'Para marcar como Completado debe adjuntar un archivo de resultado (PDF o imagen, máx. 10 MB).',
        'Cerrar',
        { duration: 8000 },
      );
      return;
    }

    if (this.dialogData.mode === 'create') {
      const medicalOrderId = parsePositiveInt(v.medicalOrderId);
      if (medicalOrderId == null) {
        this.snackBar.open('Indique un ID de orden médica válido (entero positivo).', 'Cerrar', { duration: 6000 });
        return;
      }
      this.saving = true;
      const createBody = this.buildCreatePayload(v, medicalOrderId, this.interimStatus(targetStatus));
      this.api
        .create(createBody)
        .pipe(
          switchMap((created) => this.uploadIfNeeded(created.id)),
          switchMap((id) => this.finalizeCompletedStatus(id, targetStatus, v)),
        )
        .subscribe({
          next: () => this.ok(),
          error: (e) => this.err(e),
        });
      return;
    }

    if (this.dialogData.laboratoryId != null) {
      this.saving = true;
      const id = this.dialogData.laboratoryId;
      const updateBody = this.buildUpdatePayload(v, this.interimStatus(targetStatus));
      this.api
        .update(id, updateBody)
        .pipe(
          switchMap(() => this.uploadIfNeeded(id)),
          switchMap(() => this.finalizeCompletedStatus(id, targetStatus, v)),
        )
        .subscribe({
          next: () => this.ok(),
          error: (e) => this.err(e),
        });
      return;
    }

    this.snackBar.open('No se pudo guardar: falta el identificador.', 'Cerrar', { duration: 6000 });
  }

  /** Si hay archivo nuevo y el destino es COMPLETADO, guardar primero en EN_PROCESO. */
  private interimStatus(targetStatus: string): string {
    if (targetStatus === 'COMPLETADO' && this.selectedFile) {
      return 'EN_PROCESO';
    }
    if (targetStatus === 'COMPLETADO' && !this.existingAttachment) {
      return 'EN_PROCESO';
    }
    return targetStatus;
  }

  private uploadIfNeeded(laboratoryId: number) {
    if (!this.selectedFile) {
      return of(laboratoryId);
    }
    return this.api.uploadAttachment(laboratoryId, this.selectedFile).pipe(switchMap(() => of(laboratoryId)));
  }

  private finalizeCompletedStatus(laboratoryId: number, targetStatus: string, formValue: ReturnType<typeof this.form.getRawValue>) {
    if (targetStatus !== 'COMPLETADO') {
      return of(null);
    }
    const body = this.buildUpdatePayload(formValue, 'COMPLETADO');
    return this.api.update(laboratoryId, body);
  }

  private buildCreatePayload(
    v: ReturnType<typeof this.form.getRawValue>,
    medicalOrderId: number,
    status: string,
  ): LaboratoryCreatePayload {
    return {
      medicalOrderId,
      requesterType: this.emptyToNull(v.requesterType),
      requestType: this.emptyToNull(v.requestType),
      recordNumber: this.emptyToNull(v.recordNumber),
      sampleDescription: this.emptyToNull(v.sampleDescription),
      sampleReceived: v.sampleReceived ? true : false,
      sampleValid: this.parseSampleValid(String(v.sampleValidChoice ?? '')),
      incident: this.emptyToNull(v.incident),
      result: this.emptyToNull(v.result),
      status,
      responsibleStaffId: parsePositiveInt(v.responsibleStaffId),
    };
  }

  private buildUpdatePayload(v: ReturnType<typeof this.form.getRawValue>, status: string): LaboratoryUpdatePayload {
    const recRaw = v.receptionAt?.trim() ? datetimeLocalToApi(v.receptionAt.trim()) : '';
    const resRaw = v.resultAt?.trim() ? datetimeLocalToApi(v.resultAt.trim()) : '';
    return {
      requesterType: this.emptyToNull(v.requesterType),
      requestType: this.emptyToNull(v.requestType),
      recordNumber: this.emptyToNull(v.recordNumber),
      sampleDescription: this.emptyToNull(v.sampleDescription),
      sampleReceived: !!v.sampleReceived,
      sampleValid: this.parseSampleValid(String(v.sampleValidChoice ?? '')),
      incident: this.emptyToNull(v.incident),
      result: this.emptyToNull(v.result),
      status,
      receptionAt: recRaw || null,
      resultAt: resRaw || null,
      responsibleStaffId: parsePositiveInt(v.responsibleStaffId),
    };
  }

  private ok(): void {
    this.saving = false;
    this.snackBar.open('Laboratorio guardado correctamente.', 'Cerrar', { duration: 4000 });
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar el registro de laboratorio.'), 'Cerrar', {
      duration: 7000,
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';

  labStatusCaption(s: string): string {
    return laboratoryStatusLabel(s);
  }

  formatSize(bytes: number): string {
    return formatAttachmentSize(bytes);
  }

  private emptyToNull(s: string | null | undefined): string | null {
    const t = s?.trim();
    return t ? t : null;
  }
}
