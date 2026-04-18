package com.hospital.patient.service;

import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.patient.dto.PatientCreateRequest;
import com.hospital.patient.dto.PatientResponse;
import com.hospital.patient.dto.PatientUpdateRequest;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> findAll() {
        return patientRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PatientResponse findById(Long id) {
        return toResponse(patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + id)));
    }

    @Transactional
    public PatientResponse create(PatientCreateRequest request) {
        String code = request.patientCode().trim();
        String dpi = request.dpiNit().trim();
        if (patientRepository.existsByPatientCode(code)) {
            throw new BusinessRuleException("Patient code already exists");
        }
        if (patientRepository.existsByDpiNit(dpi)) {
            throw new BusinessRuleException("DPI/NIT already exists");
        }
        Patient p = mapNew(request, code, dpi);
        return toResponse(patientRepository.save(p));
    }

    @Transactional
    public PatientResponse update(Long id, PatientUpdateRequest request) {
        Patient p = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + id));
        String code = request.patientCode().trim();
        String dpi = request.dpiNit().trim();
        if (!code.equals(p.getPatientCode()) && patientRepository.existsByPatientCode(code)) {
            throw new BusinessRuleException("Patient code already exists");
        }
        if (!dpi.equalsIgnoreCase(p.getDpiNit()) && patientRepository.existsByDpiNit(dpi)) {
            throw new BusinessRuleException("DPI/NIT already exists");
        }
        mapUpdate(p, request, code, dpi);
        return toResponse(patientRepository.save(p));
    }

    @Transactional
    public void delete(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found: " + id);
        }
        patientRepository.deleteById(id);
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
}
