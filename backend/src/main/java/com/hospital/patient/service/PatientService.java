package com.hospital.patient.service;

import com.hospital.auditlog.AuditPayloadMask;
import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.patient.dto.PatientCreateRequest;
import com.hospital.patient.dto.PatientResponse;
import com.hospital.patient.dto.PatientUpdateRequest;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public PatientService(PatientRepository patientRepository, BusinessAuditRecorder businessAuditRecorder) {
        this.patientRepository = patientRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findAll(boolean includeInactive) {
        var rows = includeInactive ? patientRepository.findAll() : patientRepository.findByActiveTrue();
        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse findById(Long id) {
        return toResponse(patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el paciente: " + id)));
    }

    @Transactional
    public PatientResponse create(PatientCreateRequest request) {
        String code = request.patientCode().trim();
        String dpi = request.dpiNit().trim();
        if (patientRepository.existsByPatientCode(code)) {
            throw new BusinessRuleException(
                    "El código de paciente ya está en uso. Elija otro o use la sugerencia del sistema.");
        }
        if (patientRepository.existsByDpiNit(dpi)) {
            throw new BusinessRuleException(
                    "Ya existe un paciente con este DPI/NIT. Revise el número o consulte el expediente ya registrado.");
        }
        Patient p = mapNew(request, code, dpi);
        Patient saved = patientRepository.save(p);
        businessAuditRecorder.safeRecord(
                "patients",
                "Patient",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotPatientMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public PatientResponse update(Long id, PatientUpdateRequest request) {
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el paciente: " + id));
        String code = request.patientCode().trim();
        String dpi = request.dpiNit().trim();
        if (!code.equals(p.getPatientCode()) && patientRepository.existsByPatientCode(code)) {
            throw new BusinessRuleException(
                    "El código de paciente ya está en uso. Elija otro o use la sugerencia del sistema.");
        }
        if (!dpi.equalsIgnoreCase(p.getDpiNit()) && patientRepository.existsByDpiNit(dpi)) {
            throw new BusinessRuleException(
                    "Ya existe un paciente con este DPI/NIT. Revise el número o consulte el expediente ya registrado.");
        }
        Map<String, Object> prior = snapshotPatientMinimal(p);
        mapUpdate(p, request, code, dpi);
        Patient saved = patientRepository.save(p);
        businessAuditRecorder.safeRecord(
                "patients",
                "Patient",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotPatientMinimal(saved));
        return toResponse(saved);
    }

    /**
     * Baja lógica (Fase 8.1): {@code activo = false}. No usa {@code repository.delete} ni {@code deleteById}.
     */
    @Transactional
    public void delete(Long id) {
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el paciente: " + id));
        if (!p.isActive()) {
            return;
        }
        Map<String, Object> prior = snapshotPatientMinimal(p);
        int updated = patientRepository.deactivateById(id);
        if (updated != 1) {
            throw new BusinessRuleException(
                    "No se pudo dar de baja el paciente. Actualice la lista e intente de nuevo.");
        }
        Patient after = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el paciente: " + id));
        businessAuditRecorder.safeRecord(
                "patients",
                "Patient",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotPatientMinimal(after));
    }

    private Patient mapNew(PatientCreateRequest request, String code, String dpi) {
        Patient p = new Patient();
        p.setPatientCode(code);
        p.setFirstName(request.firstName().trim());
        p.setLastName(request.lastName().trim());
        p.setDpiNit(dpi);
        p.setBirthDate(request.birthDate());
        p.setSex(request.sex());
        p.setPhone(request.phone());
        p.setEmail(request.email() != null ? request.email().trim() : null);
        p.setAddress(request.address());
        p.setEmergencyContactName(request.emergencyContactName());
        p.setEmergencyContactPhone(request.emergencyContactPhone());
        p.setPrivacyAccepted(Boolean.TRUE.equals(request.privacyAccepted()));
        p.setAllergies(request.allergies());
        p.setConditions(request.conditions());
        p.setMedicalHistory(request.medicalHistory());
        p.setCurrentMedications(request.currentMedications());
        p.setActive(request.active() == null || request.active());
        return p;
    }

    private void mapUpdate(Patient p, PatientUpdateRequest request, String code, String dpi) {
        p.setPatientCode(code);
        p.setFirstName(request.firstName().trim());
        p.setLastName(request.lastName().trim());
        p.setDpiNit(dpi);
        p.setBirthDate(request.birthDate());
        p.setSex(request.sex());
        p.setPhone(request.phone());
        p.setEmail(request.email() != null ? request.email().trim() : null);
        p.setAddress(request.address());
        p.setEmergencyContactName(request.emergencyContactName());
        p.setEmergencyContactPhone(request.emergencyContactPhone());
        p.setPrivacyAccepted(request.privacyAccepted());
        p.setAllergies(request.allergies());
        p.setConditions(request.conditions());
        p.setMedicalHistory(request.medicalHistory());
        p.setCurrentMedications(request.currentMedications());
        p.setActive(request.active());
    }

    private PatientResponse toResponse(Patient p) {
        return new PatientResponse(
                p.getId(),
                p.getPatientCode(),
                p.getFirstName(),
                p.getLastName(),
                p.getDpiNit(),
                p.getBirthDate(),
                p.getSex(),
                p.getPhone(),
                p.getEmail(),
                p.getAddress(),
                p.getEmergencyContactName(),
                p.getEmergencyContactPhone(),
                p.isPrivacyAccepted(),
                p.getAllergies(),
                p.getConditions(),
                p.getMedicalHistory(),
                p.getCurrentMedications(),
                p.isActive(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }

    private static Map<String, Object> snapshotPatientMinimal(Patient p) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (p.getId() != null) {
            m.put("patientId", p.getId());
        }
        m.put("patientCode", p.getPatientCode());
        m.put("dpiNitMasked", AuditPayloadMask.tailMask(p.getDpiNit()));
        m.put("active", p.isActive());
        return m;
    }
}
