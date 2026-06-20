package com.hospital.admission.service;

import com.hospital.admission.AdmissionStatusRules;
import com.hospital.admission.dto.AdmissionCreateRequest;
import com.hospital.admission.dto.AdmissionResponse;
import com.hospital.admission.dto.AdmissionUpdateRequest;
import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.insurance.entity.Insurance;
import com.hospital.insurance.repository.InsuranceRepository;
import com.hospital.medicalcare.service.MedicalCareService;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AdmissionService {

    private static final Set<String> STATUS_VALUES = AdmissionStatusRules.ALL_STATUSES;

    private final AdmissionRepository admissionRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final InsuranceRepository insuranceRepository;
    private final UserRepository userRepository;
    private final BusinessAuditRecorder businessAuditRecorder;
    private final MedicalCareService medicalCareService;

    public AdmissionService(
            AdmissionRepository admissionRepository,
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository,
            InsuranceRepository insuranceRepository,
            UserRepository userRepository,
            BusinessAuditRecorder businessAuditRecorder,
            MedicalCareService medicalCareService) {
        this.admissionRepository = admissionRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.insuranceRepository = insuranceRepository;
        this.userRepository = userRepository;
        this.businessAuditRecorder = businessAuditRecorder;
        this.medicalCareService = medicalCareService;
    }

    @Transactional(readOnly = true)
    public List<AdmissionResponse> findAll() {
        return admissionRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdmissionResponse findById(Long id) {
        return toResponse(admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la admisión: " + id)));
    }

    @Transactional
    public AdmissionResponse create(AdmissionCreateRequest request) {
        Admission admission = new Admission();
        String status = request.status() == null || request.status().isBlank() ? "ADMITIDO" : request.status();
        mapCommon(
                admission,
                request.patientId(),
                request.appointmentId(),
                request.admissionType(),
                status,
                request.currentArea(),
                request.room(),
                request.financialValidationOk() != null && request.financialValidationOk(),
                request.validationSource(),
                request.observations(),
                request.dischargeDate(),
                request.transferredArea(),
                request.admittedByUserId());
        Admission saved = admissionRepository.save(admission);
        medicalCareService.createPendingFromAdmission(saved);
        AdmissionResponse created = toResponse(saved);
        businessAuditRecorder.safeRecord(
                "admissions",
                "Admission",
                String.valueOf(created.id()),
                BusinessAuditActions.CREATE,
                null,
                snapshotAdmissionMinimal(created));
        return created;
    }

    @Transactional
    public AdmissionResponse update(Long id, AdmissionUpdateRequest request) {
        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la admisión: " + id));
        AdmissionResponse priorResponse = toResponse(admission);
        mapCommon(
                admission,
                request.patientId(),
                request.appointmentId(),
                request.admissionType(),
                request.status(),
                request.currentArea(),
                request.room(),
                request.financialValidationOk(),
                request.validationSource(),
                request.observations(),
                request.dischargeDate(),
                request.transferredArea(),
                request.admittedByUserId());
        Admission saved = admissionRepository.save(admission);
        AdmissionResponse updated = toResponse(saved);
        businessAuditRecorder.safeRecord(
                "admissions",
                "Admission",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                snapshotAdmissionMinimal(priorResponse),
                snapshotAdmissionMinimal(updated));
        return updated;
    }

    /** Anulación lógica (Fase 8.2): {@code estado = ANULADO}. */
    @Transactional
    public void delete(Long id) {
        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la admisión: " + id));
        if ("ANULADO".equalsIgnoreCase(admission.getStatus())) {
            return;
        }
        AdmissionResponse prior = toResponse(admission);
        admission.setStatus("ANULADO");
        Admission saved = admissionRepository.save(admission);
        AdmissionResponse after = toResponse(saved);
        businessAuditRecorder.safeRecord(
                "admissions",
                "Admission",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                snapshotAdmissionMinimal(prior),
                snapshotAdmissionMinimal(after));
    }

    private void mapCommon(
            Admission admission,
            Long patientId,
            Long appointmentId,
            String admissionType,
            String status,
            String currentArea,
            String room,
            boolean financialValidationOk,
            String validationSource,
            String observations,
            java.time.LocalDateTime dischargeDate,
            String transferredArea,
            Long admittedByUserId) {

        if (!STATUS_VALUES.contains(status)) {
            throw new BusinessRuleException("Estado de admisión no válido");
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el paciente: " + patientId));
        ensurePatientIdentifiedForAdmission(patient);
        Appointment appointment = resolveAppointment(appointmentId);
        validateAppointmentBelongsToPatient(appointment, patient.getId());
        User admittedBy = resolveUser(admittedByUserId);

        ensureFinancialValidation(patient.getId(), financialValidationOk, validationSource, status);

        admission.setPatient(patient);
        admission.setAppointment(appointment);
        admission.setAdmissionType(admissionType);
        admission.setStatus(status);
        admission.setCurrentArea(currentArea);
        admission.setRoom(room);
        admission.setFinancialValidationOk(financialValidationOk);
        admission.setValidationSource(validationSource == null || validationSource.isBlank() ? null : validationSource);
        admission.setObservations(observations);
        admission.setDischargeDate(dischargeDate);
        admission.setTransferredArea(transferredArea);
        admission.setAdmittedBy(admittedBy);
    }

    private static void ensurePatientIdentifiedForAdmission(Patient patient) {
        if (!patient.isActive()) {
            throw new BusinessRuleException(
                    "No se puede admitir: el paciente está inactivo en el sistema. Reactive el expediente o use uno activo.");
        }
        if (patient.getDpiNit() == null || patient.getDpiNit().isBlank()) {
            throw new BusinessRuleException(
                    "No se puede admitir sin identificación DPI/NIT en el expediente del paciente.");
        }
        if (patient.getPatientCode() == null || patient.getPatientCode().isBlank()) {
            throw new BusinessRuleException(
                    "No se puede admitir sin código de paciente registrado en el expediente.");
        }
    }

    private static void validateAppointmentBelongsToPatient(Appointment appointment, Long patientId) {
        if (appointment == null) {
            return;
        }
        if (!appointment.getPatient().getId().equals(patientId)) {
            throw new BusinessRuleException(
                    "La cita indicada no corresponde al paciente seleccionado. Quite el ID de cita o corríjalo.");
        }
    }

    private void ensureFinancialValidation(Long patientId, boolean financialValidationOk, String validationSource, String status) {
        if ("RECHAZADO".equals(status) || "ANULADO".equals(status)) {
            return;
        }
        if (!financialValidationOk) {
            throw new BusinessRuleException(
                    "Cuando el estado no es RECHAZADO, debe marcarse «validación financiera OK» para documentar cobertura o pago en sitio.");
        }
        if (validationSource == null || validationSource.isBlank()) {
            throw new BusinessRuleException(
                    "Indique el origen: SEGURO (póliza vigente verificada) o PAGO_SITIO (pago en sitio / garantía administrativa registrada).");
        }
        if ("SEGURO".equals(validationSource) && !hasValidInsurance(patientId)) {
            throw new BusinessRuleException(
                    "Con origen SEGURO el paciente debe tener al menos un seguro activo y dentro de vigencia en el sistema.");
        }
        if (!"SEGURO".equals(validationSource) && !"PAGO_SITIO".equals(validationSource)) {
            throw new BusinessRuleException("La fuente de validación debe ser SEGURO o PAGO_SITIO.");
        }
    }

    private boolean hasValidInsurance(Long patientId) {
        LocalDate today = LocalDate.now();
        return insuranceRepository.findByPatient_Id(patientId).stream().anyMatch(insurance ->
                insurance.isActive() &&
                        (insurance.getStartDate() == null || !insurance.getStartDate().isAfter(today)) &&
                        (insurance.getEndDate() == null || !insurance.getEndDate().isBefore(today)));
    }

    private Appointment resolveAppointment(Long appointmentId) {
        if (appointmentId == null) {
            return null;
        }
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la cita: " + appointmentId));
    }

    private User resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el usuario: " + userId));
    }

    private AdmissionResponse toResponse(Admission a) {
        return new AdmissionResponse(
                a.getId(),
                a.getPatient().getId(),
                a.getAppointment() != null ? a.getAppointment().getId() : null,
                a.getAdmissionType(),
                a.getStatus(),
                a.getCurrentArea(),
                a.getRoom(),
                a.isFinancialValidationOk(),
                a.getValidationSource(),
                a.getObservations(),
                a.getAdmissionDate(),
                a.getDischargeDate(),
                a.getTransferredArea(),
                a.getAdmittedBy() != null ? a.getAdmittedBy().getId() : null);
    }

    /**
     * Bitácora de negocio: sin observaciones ni datos clínicos; incluye vínculos mínimos para CU11.
     */
    private static Map<String, Object> snapshotAdmissionMinimal(AdmissionResponse r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("admissionId", r.id());
        m.put("patientId", r.patientId());
        if (r.appointmentId() != null) {
            m.put("appointmentId", r.appointmentId());
        }
        m.put("admissionType", r.admissionType());
        m.put("status", r.status());
        m.put("financialValidationOk", r.financialValidationOk());
        if (r.validationSource() != null) {
            m.put("validationSource", r.validationSource());
        }
        return m;
    }
}
