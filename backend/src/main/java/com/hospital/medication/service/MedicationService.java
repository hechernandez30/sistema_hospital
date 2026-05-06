package com.hospital.medication.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.medication.dto.MedicationRequest;
import com.hospital.medication.dto.MedicationResponse;
import com.hospital.medication.entity.Medication;
import com.hospital.medication.repository.MedicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MedicationService {

    private final MedicationRepository medicationRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public MedicationService(MedicationRepository medicationRepository, BusinessAuditRecorder businessAuditRecorder) {
        this.medicationRepository = medicationRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<MedicationResponse> findAll() {
        return medicationRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MedicationResponse findById(Long id) {
        return toResponse(medicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el medicamento: " + id)));
    }

    @Transactional
    public MedicationResponse create(MedicationRequest request) {
        Medication m = new Medication();
        map(m, request);
        MedicationResponse created = toResponse(medicationRepository.save(m));
        businessAuditRecorder.safeRecord(
                "medications",
                "Medication",
                String.valueOf(created.id()),
                BusinessAuditActions.CREATE,
                null,
                summaryMedicationAudit(created));
        return created;
    }

    @Transactional
    public MedicationResponse update(Long id, MedicationRequest request) {
        Medication m = medicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el medicamento: " + id));
        MedicationResponse prior = toResponse(m);
        map(m, request);
        MedicationResponse updated = toResponse(medicationRepository.save(m));
        businessAuditRecorder.safeRecord(
                "medications",
                "Medication",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                summaryMedicationAudit(prior),
                summaryMedicationAudit(updated));
        return updated;
    }

    @Transactional
    public void delete(Long id) {
        Medication m = medicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el medicamento: " + id));
        MedicationResponse prior = toResponse(m);
        medicationRepository.delete(m);
        businessAuditRecorder.safeRecord(
                "medications",
                "Medication",
                String.valueOf(id),
                BusinessAuditActions.DELETE,
                summaryMedicationAudit(prior),
                null);
    }

    private static Map<String, Object> summaryMedicationAudit(MedicationResponse r) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("name", r.name());
        if (r.presentation() != null && !r.presentation().isBlank()) {
            row.put("presentation", r.presentation());
        }
        if (r.unit() != null && !r.unit().isBlank()) {
            row.put("unit", r.unit());
        }
        row.put("currentStock", r.currentStock());
        row.put("minimumStock", r.minimumStock());
        row.put("active", r.active());
        row.put("lowStock", r.currentStock() <= r.minimumStock());
        return row;
    }

    private void map(Medication m, MedicationRequest request) {
        if (request.currentStock() < 0 || request.minimumStock() < 0) {
            throw new BusinessRuleException(
                    "Los valores de inventario no pueden ser negativos (stock actual y stock mínimo).");
        }
        m.setName(request.name().trim());
        m.setPresentation(request.presentation());
        m.setUnit(request.unit());
        m.setCurrentStock(request.currentStock());
        m.setMinimumStock(request.minimumStock());
        m.setActive(request.active() == null || request.active());
    }

    private MedicationResponse toResponse(Medication m) {
        return new MedicationResponse(
                m.getId(),
                m.getName(),
                m.getPresentation(),
                m.getUnit(),
                m.getCurrentStock(),
                m.getMinimumStock(),
                m.isActive());
    }
}
