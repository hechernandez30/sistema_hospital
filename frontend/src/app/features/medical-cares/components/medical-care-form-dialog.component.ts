import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map } from 'rxjs/operators';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgClass } from '@angular/common';
import { MedicalCareApiService } from '../services/medical-care-api.service';
import {
  MedicalCareCreatePayload,
  MedicalCareResponse,
  MedicalCareUpdatePayload,
} from '../models/medical-care.models';
import { getHttpErrorMessage } from '../../../core/utils/http-error-message';
import {
  optionalPositiveInteger,
  parsePositiveInt,
  requiredPositiveInteger,
} from '../../shared/form-validators';
import { PatientApiService } from '../../patients/services/patient-api.service';
import { StaffApiService } from '../../staff/services/staff-api.service';
import { AdmissionApiService } from '../../admissions/services/admission-api.service';
import { AppointmentApiService } from '../../appointments/services/appointment-api.service';
import { SpecialtyApiService } from '../../specialties/services/specialty-api.service';
import { EntityPickerOption } from '../../shared/entity-picker.models';
import {
  buildAdmissionOptions,
  buildAppointmentOptions,
  buildDoctorOptions,
  buildPatientOptionsForMedicalCare,
  isAdmissionOpenForMedicalCare,
  patientsToMap,
  staffToMap,
} from '../../shared/entity-picker.utils';
import { EntityAutocompleteComponent } from '../../shared/entity-autocomplete.component';
import { MedicalOrderApiService } from '../../medical-orders/services/medical-order-api.service';
import { MedicalOrderResponse, MedicalOrderType, medicalOrderPriorityLabel, medicalOrderStatusLabel, medicalOrderTypeLabel } from '../../medical-orders/models/medical-order.models';
import { LaboratoryApiService } from '../../laboratory/services/laboratory-api.service';
import { ImagingApiService } from '../../imaging/services/imaging-api.service';
import {
  buildExamsForOrders,
  examListKey,
  fulfillmentStatusTone,
  fulfillmentToneClass,
  MedicalCareExamListItem,
} from '../utils/medical-care-linked-orders.util';
import {
  MEDICAL_CARE_ORDER_REQUESTS,
  activeOrderTypesFromList,
  buildMedicalOrderCreatePayload,
  checkboxPatchFromCareAndOrders,
  orderTypesToCreate,
  selectedOrderTypesFromForm,
} from '../utils/medical-care-order-request.util';

/** CU12: al menos admisión o cita; si hay cita, el backend exige admisión del mismo paciente. */
function medicalCareEpisodeContextValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const admissionId = parsePositiveInt(group.get('admissionId')?.value);
    const appointmentId = parsePositiveInt(group.get('appointmentId')?.value);
    if (appointmentId != null && admissionId == null) {
      return { appointmentRequiresAdmission: true };
    }
    if (admissionId == null && appointmentId == null) {
      return { admissionOrAppointmentRequired: true };
    }
    return null;
  };
}

export interface MedicalCareFormDialogData {
  mode: 'create' | 'edit';
  medicalCareId?: number;
}

@Component({
  selector: 'app-medical-care-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    EntityAutocompleteComponent,
    NgClass,
  ],
  templateUrl: './medical-care-form-dialog.component.html',
  styleUrl: './medical-care-form-dialog.component.scss',
})
export class MedicalCareFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MedicalCareApiService);
  private readonly orderApi = inject(MedicalOrderApiService);
  private readonly laboratoryApi = inject(LaboratoryApiService);
  private readonly imagingApi = inject(ImagingApiService);
  private readonly patientApi = inject(PatientApiService);
  private readonly staffApi = inject(StaffApiService);
  private readonly admissionApi = inject(AdmissionApiService);
  private readonly appointmentApi = inject(AppointmentApiService);
  private readonly specialtyApi = inject(SpecialtyApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<MedicalCareFormDialogComponent, boolean>);
  private readonly snackBar = inject(MatSnackBar);
  readonly dialogData = inject<MedicalCareFormDialogData>(MAT_DIALOG_DATA);

  readonly orderRequestOptions = MEDICAL_CARE_ORDER_REQUESTS;

  patientOptions: EntityPickerOption[] = [];
  doctorOptions: EntityPickerOption[] = [];
  admissionOptions: EntityPickerOption[] = [];
  appointmentOptions: EntityPickerOption[] = [];
  catalogError: string | null = null;
  private patientMap = new Map<number, import('../../patients/models/patient.models').PatientResponse>();
  private staffMap = new Map<number, import('../../staff/models/staff.models').StaffResponse>();
  private allAdmissions: import('../../admissions/models/admission.models').AdmissionResponse[] = [];
  private allAppointments: import('../../appointments/models/appointment.models').AppointmentResponse[] = [];
  private allStaff: import('../../staff/models/staff.models').StaffResponse[] = [];
  private allSpecialties: import('../../specialties/models/specialty.models').SpecialtyResponse[] = [];
  private existingActiveOrderTypes = new Set<MedicalOrderType>();
  /** Episodio cargado en edición; respaldo si el picker pierde el ID al interactuar con otros campos. */
  private loadedEpisode: { patientId: number; admissionId: number | null; appointmentId: number | null } | null =
    null;

  loading = false;
  saving = false;
  linkedDataLoading = false;
  careOrders: MedicalOrderResponse[] = [];
  careExams: MedicalCareExamListItem[] = [];
  selectedOrderId: number | null = null;
  selectedExamKey: string | null = null;

  readonly fulfillmentToneClass = fulfillmentToneClass;
  readonly medicalOrderTypeLabel = medicalOrderTypeLabel;
  readonly medicalOrderStatusLabel = medicalOrderStatusLabel;
  readonly medicalOrderPriorityLabel = medicalOrderPriorityLabel;
  readonly examListKey = examListKey;
  readonly orderTone = (status: string) => fulfillmentToneClass(fulfillmentStatusTone(status));

  readonly form = this.fb.group(
    {
      patientId: ['', [requiredPositiveInteger()]],
      admissionId: ['', [optionalPositiveInteger()]],
      appointmentId: ['', [optionalPositiveInteger()]],
      doctorId: ['', [requiredPositiveInteger()]],
      consultationReason: ['', [Validators.required, Validators.maxLength(4000)]],
      clinicalEvaluation: ['', [Validators.required, Validators.maxLength(8000)]],
      diagnosis: ['', [Validators.required, Validators.maxLength(4000)]],
      treatmentPlan: ['', [Validators.maxLength(8000)]],
      orderLaboratorio: [false],
      orderImagen: [false],
      orderFarmacia: [false],
      orderHospitalizacion: [false],
    },
    { validators: [medicalCareEpisodeContextValidator()] },
  );

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      patients: this.patientApi.list(),
      staff: this.staffApi.list(),
      admissions: this.admissionApi.list(),
      appointments: this.appointmentApi.list(),
      specialties: this.specialtyApi.list(),
    }).subscribe({
      next: ({ patients, staff, admissions, appointments, specialties }) => {
        this.patientMap = patientsToMap(patients);
        this.staffMap = staffToMap(staff);
        this.allAdmissions = admissions;
        this.allAppointments = appointments;
        this.allStaff = staff;
        this.allSpecialties = specialties;
        this.rebuildPatientOptions();
        this.rebuildDoctorOptions();
        this.refreshContextOptions();
        this.catalogError = null;
        if (this.dialogData.mode === 'edit' && this.dialogData.medicalCareId != null) {
          this.loadForEdit(this.dialogData.medicalCareId);
        } else {
          this.loading = false;
        }
      },
      error: (err: unknown) => this.failLoad(err),
    });

    this.form.controls.patientId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((rawPatientId) => {
        const patientId = parsePositiveInt(rawPatientId);
        const previousPatientId = this.loadedEpisode?.patientId ?? null;
        this.refreshContextOptions();
        if (patientId != null && previousPatientId != null && patientId === previousPatientId) {
          return;
        }
        this.form.controls.admissionId.setValue('');
        this.form.controls.appointmentId.setValue('');
      });
    this.form.controls.admissionId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshAppointmentOptions();
        const admissionId = parsePositiveInt(this.form.controls.admissionId.value);
        if (admissionId == null) {
          this.form.controls.appointmentId.setValue('');
        }
      });
  }

  private loadForEdit(medicalCareId: number): void {
    this.linkedDataLoading = true;
    forkJoin({
      care: this.api.getById(medicalCareId),
      orders: this.orderApi.list(medicalCareId),
      labs: this.laboratoryApi.list(),
      imaging: this.imagingApi.list(),
    }).subscribe({
      next: ({ care, orders, labs, imaging }) => {
        this.careOrders = [...orders].sort((a, b) => b.id - a.id);
        this.careExams = buildExamsForOrders(orders, labs, imaging);
        this.existingActiveOrderTypes = activeOrderTypesFromList(orders);
        this.linkedDataLoading = false;
        this.patchFrom(care);
      },
      error: (err: unknown) => this.failLoad(err),
    });
  }

  toggleOrder(order: MedicalOrderResponse): void {
    this.selectedOrderId = this.selectedOrderId === order.id ? null : order.id;
  }

  toggleExam(exam: MedicalCareExamListItem): void {
    const key = examListKey(exam);
    this.selectedExamKey = this.selectedExamKey === key ? null : key;
  }

  get selectedOrder(): MedicalOrderResponse | null {
    return this.careOrders.find((o) => o.id === this.selectedOrderId) ?? null;
  }

  get selectedExam(): MedicalCareExamListItem | null {
    return this.careExams.find((e) => examListKey(e) === this.selectedExamKey) ?? null;
  }

  private failLoad(err: unknown): void {
    this.loading = false;
    this.linkedDataLoading = false;
    this.catalogError = 'No se pudieron cargar catálogos.';
    this.snackBar.open(getHttpErrorMessage(err, this.catalogError), 'Cerrar', { duration: 7000 });
    this.dialogRef.close(false);
  }

  private rebuildPatientOptions(includePatientId?: number): void {
    this.patientOptions = buildPatientOptionsForMedicalCare(
      [...this.patientMap.values()],
      this.allAdmissions,
      includePatientId,
    );
  }

  private rebuildDoctorOptions(includeStaffId?: number): void {
    this.doctorOptions = buildDoctorOptions(this.allStaff, this.allSpecialties, true, includeStaffId);
  }

  private refreshContextOptions(): void {
    const patientId = parsePositiveInt(this.form.controls.patientId.value);
    const currentAdmissionId = parsePositiveInt(this.form.controls.admissionId.value);
    if (patientId == null) {
      this.admissionOptions = [];
      this.appointmentOptions = [];
      return;
    }
    this.admissionOptions = buildAdmissionOptions(
      this.allAdmissions.filter((a) => {
        if (a.patientId !== patientId) {
          return false;
        }
        if (currentAdmissionId != null && a.id === currentAdmissionId) {
          return true;
        }
        return isAdmissionOpenForMedicalCare(a.status);
      }),
      this.patientMap,
    );
    this.refreshAppointmentOptions();
  }

  private refreshAppointmentOptions(): void {
    const patientId = parsePositiveInt(this.form.controls.patientId.value);
    const admissionId = parsePositiveInt(this.form.controls.admissionId.value);
    let aptPatientId = patientId;
    if (admissionId != null) {
      const adm = this.allAdmissions.find((a) => a.id === admissionId);
      if (adm) {
        aptPatientId = adm.patientId;
      }
    }
    this.appointmentOptions = buildAppointmentOptions(this.allAppointments, this.patientMap, this.staffMap, {
      patientId: aptPatientId ?? undefined,
      activeOnly: true,
    });
  }

  private patchFrom(c: MedicalCareResponse): void {
    this.loading = false;
    this.loadedEpisode = {
      patientId: c.patientId,
      admissionId: c.admissionId,
      appointmentId: c.appointmentId,
    };
    this.rebuildPatientOptions(c.patientId);
    this.rebuildDoctorOptions(c.doctorId);
    this.form.patchValue({ patientId: String(c.patientId) }, { emitEvent: false });
    this.refreshContextOptions();
    const orderChecks = checkboxPatchFromCareAndOrders(c.requiresHospitalization, this.existingActiveOrderTypes);
    this.form.patchValue(
      {
        admissionId: c.admissionId != null ? String(c.admissionId) : '',
        appointmentId: c.appointmentId != null ? String(c.appointmentId) : '',
        doctorId: String(c.doctorId),
        consultationReason: c.consultationReason,
        clinicalEvaluation: c.clinicalEvaluation,
        diagnosis: c.diagnosis,
        treatmentPlan: c.treatmentPlan ?? '',
        ...orderChecks,
      },
      { emitEvent: false },
    );
    this.refreshContextOptions();
    this.refreshAppointmentOptions();
  }

  /** Restaura IDs de episodio si el autocomplete los perdió al editar otros campos. */
  private reconcileEpisodeFields(): void {
    if (this.loadedEpisode == null) {
      return;
    }
    let patientId = parsePositiveInt(this.form.controls.patientId.value);
    if (patientId == null) {
      this.form.controls.patientId.setValue(String(this.loadedEpisode.patientId), { emitEvent: false });
      patientId = this.loadedEpisode.patientId;
    }
    if (patientId !== this.loadedEpisode.patientId) {
      return;
    }
    if (
      parsePositiveInt(this.form.controls.admissionId.value) == null &&
      this.loadedEpisode.admissionId != null
    ) {
      this.form.controls.admissionId.setValue(String(this.loadedEpisode.admissionId), { emitEvent: false });
    }
    if (
      parsePositiveInt(this.form.controls.appointmentId.value) == null &&
      this.loadedEpisode.appointmentId != null
    ) {
      this.form.controls.appointmentId.setValue(String(this.loadedEpisode.appointmentId), { emitEvent: false });
    }
    this.refreshContextOptions();
    this.refreshAppointmentOptions();
  }

  submit(): void {
    if (this.isEdit) {
      this.reconcileEpisodeFields();
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      let msg = 'Revise los campos marcados: hay datos obligatorios incompletos o inválidos.';
      if (this.form.hasError('admissionOrAppointmentRequired')) {
        msg =
          'Indique al menos el ID de admisión (episodio). Si además vincula una cita, esa cita debe estar PROGRAMADA o REPROGRAMADA.';
      } else if (this.form.hasError('appointmentRequiresAdmission')) {
        msg = 'Si indica ID de cita, también debe indicar el ID de admisión del mismo paciente para ese episodio.';
      }
      this.snackBar.open(msg, 'Cerrar', { duration: 8000 });
      return;
    }
    const v = this.form.getRawValue();
    const patientId = parsePositiveInt(v.patientId);
    const doctorId = parsePositiveInt(v.doctorId);
    if (patientId == null || doctorId == null) {
      this.snackBar.open('Paciente y médico son obligatorios (IDs válidos).', 'Cerrar', { duration: 5000 });
      return;
    }
    const admissionId = parsePositiveInt(v.admissionId);
    const appointmentId = parsePositiveInt(v.appointmentId);
    const treatmentPlan = v.treatmentPlan?.trim() ? v.treatmentPlan.trim() : null;
    const diagnosis = (v.diagnosis ?? '').trim();
    const requiresHospitalization = !!v.orderHospitalizacion;
    const typesToCreate = orderTypesToCreate(
      selectedOrderTypesFromForm({
        orderLaboratorio: !!v.orderLaboratorio,
        orderImagen: !!v.orderImagen,
        orderFarmacia: !!v.orderFarmacia,
        orderHospitalizacion: !!v.orderHospitalizacion,
      }),
      this.existingActiveOrderTypes,
    );

    this.saving = true;
    if (this.dialogData.mode === 'create') {
      const body: MedicalCareCreatePayload = {
        patientId,
        admissionId,
        appointmentId,
        doctorId,
        consultationReason: (v.consultationReason ?? '').trim(),
        clinicalEvaluation: (v.clinicalEvaluation ?? '').trim(),
        diagnosis,
        treatmentPlan,
        requiresHospitalization,
      };
      this.api.create(body).subscribe({
        next: (care) => this.afterCareSaved(care.id, diagnosis, typesToCreate),
        error: (e) => this.err(e),
      });
    } else if (this.dialogData.medicalCareId != null) {
      const body: MedicalCareUpdatePayload = {
        patientId,
        admissionId,
        appointmentId,
        doctorId,
        consultationReason: (v.consultationReason ?? '').trim(),
        clinicalEvaluation: (v.clinicalEvaluation ?? '').trim(),
        diagnosis,
        treatmentPlan,
        requiresHospitalization,
      };
      this.api.update(this.dialogData.medicalCareId, body).subscribe({
        next: () => this.afterCareSaved(this.dialogData.medicalCareId!, diagnosis, typesToCreate),
        error: (e) => this.err(e),
      });
    } else {
      this.saving = false;
      this.snackBar.open('No se pudo guardar: falta el identificador.', 'Cerrar', { duration: 6000 });
    }
  }

  private afterCareSaved(medicalCareId: number, diagnosis: string, typesToCreate: MedicalOrderType[]): void {
    this.createOrders(medicalCareId, diagnosis, typesToCreate).subscribe({
      next: ({ created, failed }) => this.ok(created, failed),
      error: (err: unknown) => {
        this.saving = false;
        this.snackBar.open(
          getHttpErrorMessage(err, 'Atención guardada, pero falló la generación de órdenes médicas.'),
          'Cerrar',
          { duration: 9000 },
        );
        this.dialogRef.close(true);
      },
    });
  }

  private createOrders(
    medicalCareId: number,
    diagnosis: string,
    types: MedicalOrderType[],
  ): Observable<{ created: number; failed: MedicalOrderType[] }> {
    if (types.length === 0) {
      return of({ created: 0, failed: [] });
    }
    return forkJoin(
      types.map((orderType) =>
        this.orderApi.create(buildMedicalOrderCreatePayload(medicalCareId, orderType, diagnosis)).pipe(
          map(() => ({ orderType, ok: true as const })),
          catchError(() => of({ orderType, ok: false as const })),
        ),
      ),
    ).pipe(
      map((results) => ({
        created: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).map((r) => r.orderType),
      })),
    );
  }

  private ok(ordersCreated: number, failedTypes: MedicalOrderType[]): void {
    this.saving = false;
    if (failedTypes.length === 0) {
      const msg =
        ordersCreated > 0
          ? `Atención guardada. Se generaron ${ordersCreated} orden(es) médica(s).`
          : 'Atención guardada correctamente.';
      this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
    } else {
      const labels = failedTypes.map((t) => medicalOrderTypeLabel(t)).join(', ');
      this.snackBar.open(
        `Atención guardada. ${ordersCreated} orden(es) creada(s); no se pudo crear: ${labels}.`,
        'Cerrar',
        { duration: 9000 },
      );
    }
    this.dialogRef.close(true);
  }

  private err(err: unknown): void {
    this.saving = false;
    this.snackBar.open(getHttpErrorMessage(err, 'No se pudo guardar la atención.'), 'Cerrar', { duration: 7000 });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  readonly isEdit = this.dialogData.mode === 'edit';
}
