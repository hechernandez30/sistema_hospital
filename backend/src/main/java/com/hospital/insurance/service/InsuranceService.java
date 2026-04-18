package com.hospital.insurance.service;

import com.hospital.exception.ResourceNotFoundException;
import com.hospital.insurance.dto.InsuranceRequest;
import com.hospital.insurance.dto.InsuranceResponse;
import com.hospital.insurance.entity.Insurance;
import com.hospital.insurance.repository.InsuranceRepository;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InsuranceService {

    private final InsuranceRepository insuranceRepository;
    private final PatientRepository patientRepository;

    public InsuranceService(InsuranceRepository insuranceRepository, PatientRepository patientRepository) {
        this.insuranceRepository = insuranceRepository;
        this.patientRepository = patientRepository;
    }

    @Transactional(readOnly = true)
    public List<InsuranceResponse> findByPatient(Long patientId) {
        ensurePatient(patientId);
        return insuranceRepository.findByPatient_Id(patientId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InsuranceResponse findByPatientAndId(Long patientId, Long insuranceId) {
        return toResponse(insuranceRepository
                .findByIdAndPatient_Id(insuranceId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance not found: " + insuranceId)));
    }

    @Transactional
    public InsuranceResponse create(Long patientId, InsuranceRequest request) {
        Patient patient = ensurePatient(patientId);
        Insurance i = new Insurance();
        i.setPatient(patient);
        map(i, request);
        return toResponse(insuranceRepository.save(i));
    }

    @Transactional
    public InsuranceResponse update(Long patientId, Long insuranceId, InsuranceRequest request) {
        Insurance i = insuranceRepository
                .findByIdAndPatient_Id(insuranceId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance not found: " + insuranceId));
        map(i, request);
        return toResponse(insuranceRepository.save(i));
    }

    @Transactional
    public void delete(Long patientId, Long insuranceId) {
        Insurance i = insuranceRepository
                .findByIdAndPatient_Id(insuranceId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Insurance not found: " + insuranceId));
        insuranceRepository.delete(i);
    }

    private Patient ensurePatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
    }

    private void map(Insurance i, InsuranceRequest request) {
        i.setInsurerName(request.insurerName().trim());
        i.setPolicyNumber(request.policyNumber().trim());
        i.setCoveragePercent(request.coveragePercent());
        i.setStartDate(request.startDate());
        i.setEndDate(request.endDate());
        i.setActive(request.active() == null || request.active());
    }

    private InsuranceResponse toResponse(Insurance i) {
        return new InsuranceResponse(
                i.getId(),
                i.getPatient().getId(),
                i.getInsurerName(),
                i.getPolicyNumber(),
                i.getCoveragePercent(),
                i.getStartDate(),
                i.getEndDate(),
                i.isActive());
    }
}
