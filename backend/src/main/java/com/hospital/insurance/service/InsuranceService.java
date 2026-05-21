package com.hospital.insurance.service;

import com.hospital.auditlog.AuditPayloadMask;
import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.insurance.dto.InsuranceRequest;
import com.hospital.insurance.dto.InsuranceResponse;
import com.hospital.insurance.entity.Insurance;
import com.hospital.insurance.repository.InsuranceRepository;
import com.hospital.patient.entity.Patient;
import com.hospital.patient.repository.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class InsuranceService {

    private final InsuranceRepository insuranceRepository;
    private final PatientRepository patientRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public InsuranceService(
            InsuranceRepository insuranceRepository,
            PatientRepository patientRepository,
            BusinessAuditRecorder businessAuditRecorder) {
        this.insuranceRepository = insuranceRepository;
        this.patientRepository = patientRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<InsuranceResponse> findByPatient(Long patientId, boolean includeInactive) {
        ensurePatient(patientId);
        var rows = includeInactive
                ? insuranceRepository.findByPatient_Id(patientId)
                : insuranceRepository.findByPatient_IdAndActiveTrue(patientId);
        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public InsuranceResponse findByPatientAndId(Long patientId, Long insuranceId) {
        return toResponse(insuranceRepository
                .findByIdAndPatient_Id(insuranceId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el seguro: " + insuranceId)));
    }

    @Transactional
    public InsuranceResponse create(Long patientId, InsuranceRequest request) {
        Patient patient = ensurePatient(patientId);
        Insurance i = new Insurance();
        i.setPatient(patient);
        map(i, request);
        Insurance saved = insuranceRepository.save(i);
        businessAuditRecorder.safeRecord(
                "insurances",
                "Insurance",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotInsuranceMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public InsuranceResponse update(Long patientId, Long insuranceId, InsuranceRequest request) {
        Insurance i = insuranceRepository
                .findByIdAndPatient_Id(insuranceId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el seguro: " + insuranceId));
        Map<String, Object> prior = snapshotInsuranceMinimal(i);
        map(i, request);
        Insurance saved = insuranceRepository.save(i);
        businessAuditRecorder.safeRecord(
                "insurances",
                "Insurance",
                String.valueOf(insuranceId),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotInsuranceMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long patientId, Long insuranceId) {
        Insurance i = insuranceRepository
                .findByIdAndPatient_Id(insuranceId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el seguro: " + insuranceId));
        if (!i.isActive()) {
            return;
        }
        Map<String, Object> prior = snapshotInsuranceMinimal(i);
        i.setActive(false);
        Insurance saved = insuranceRepository.save(i);
        businessAuditRecorder.safeRecord(
                "insurances",
                "Insurance",
                String.valueOf(insuranceId),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotInsuranceMinimal(saved));
    }

    private Patient ensurePatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el paciente: " + patientId));
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

    private static Map<String, Object> snapshotInsuranceMinimal(Insurance i) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("patientId", i.getPatient().getId());
        if (i.getId() != null) {
            m.put("insuranceId", i.getId());
        }
        m.put("insurerName", i.getInsurerName());
        m.put("policyNumberMasked", AuditPayloadMask.tailMask(i.getPolicyNumber()));
        if (i.getCoveragePercent() != null) {
            m.put("coveragePercent", i.getCoveragePercent().toPlainString());
        }
        m.put("active", i.isActive());
        return m;
    }
}
