package com.hospital.admission.service;

import com.hospital.admission.dto.AdmissionCreateRequest;
import com.hospital.admission.dto.AdmissionResponse;
import com.hospital.admission.dto.AdmissionUpdateRequest;
import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
import com.hospital.appointment.entity.Appointment;
import com.hospital.appointment.repository.AppointmentRepository;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.insurance.entity.Insurance;
import com.hospital.insurance.repository.InsuranceRepository;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import com.hospital.user.entity.User;
import com.hospital.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class AdmissionService {

    private static final Set<String> STATUS_VALUES = Set.of("PENDIENTE", "ADMITIDO", "ALTA", "TRANSFERIDO", "RECHAZADO");

    private final AdmissionRepository admissionRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final InsuranceRepository insuranceRepository;
    private final UserRepository userRepository;

    public AdmissionService(
            AdmissionRepository admissionRepository,
            PatientRepository patientRepository,
            AppointmentRepository appointmentRepository,
            InsuranceRepository insuranceRepository,
            UserRepository userRepository) {
        this.admissionRepository = admissionRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.insuranceRepository = insuranceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AdmissionResponse> findAll() {
        return admissionRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdmissionResponse findById(Long id) {
        return toResponse(admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found: " + id)));
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
        return toResponse(admissionRepository.save(admission));
    }

    @Transactional
    public AdmissionResponse update(Long id, AdmissionUpdateRequest request) {
        Admission admission = admissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found: " + id));
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
        return toResponse(admissionRepository.save(admission));
    }

    @Transactional
    public void delete(Long id) {
        if (!admissionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Admission not found: " + id);
        }
        admissionRepository.deleteById(id);
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
            throw new BusinessRuleException("Invalid admission status");
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        Appointment appointment = resolveAppointment(appointmentId);
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

    private void ensureFinancialValidation(Long patientId, boolean financialValidationOk, String validationSource, String status) {
        if ("RECHAZADO".equals(status)) {
            return;
        }
        if (!financialValidationOk) {
            throw new BusinessRuleException("Financial validation is required for admission");
        }
        if (validationSource == null || validationSource.isBlank()) {
            throw new BusinessRuleException("Validation source is required when financial validation is OK");
        }
        if ("SEGURO".equals(validationSource) && !hasValidInsurance(patientId)) {
            throw new BusinessRuleException("Patient does not have an active insurance policy");
        }
        if (!"SEGURO".equals(validationSource) && !"PAGO_SITIO".equals(validationSource)) {
            throw new BusinessRuleException("Validation source must be SEGURO or PAGO_SITIO");
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
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
    }

    private User resolveUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
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
}
