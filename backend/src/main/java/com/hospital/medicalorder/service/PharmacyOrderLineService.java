package com.hospital.medicalorder.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.medicalorder.dto.PharmacyOrderLineItemRequest;
import com.hospital.medicalorder.dto.PharmacyOrderLineResponse;
import com.hospital.medicalorder.dto.PharmacyOrderLinesReplaceRequest;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.medicalorder.entity.PharmacyOrderLine;
import com.hospital.medicalorder.repository.MedicalOrderRepository;
import com.hospital.medicalorder.repository.PharmacyOrderLineRepository;
import com.hospital.medication.entity.Medication;
import com.hospital.medication.repository.MedicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PharmacyOrderLineService {

    private static final Set<String> LOCKED_STATUSES = Set.of("COMPLETADO", "ANULADO");

    private final MedicalOrderRepository medicalOrderRepository;
    private final PharmacyOrderLineRepository pharmacyOrderLineRepository;
    private final MedicationRepository medicationRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public PharmacyOrderLineService(
            MedicalOrderRepository medicalOrderRepository,
            PharmacyOrderLineRepository pharmacyOrderLineRepository,
            MedicationRepository medicationRepository,
            BusinessAuditRecorder businessAuditRecorder) {
        this.medicalOrderRepository = medicalOrderRepository;
        this.pharmacyOrderLineRepository = pharmacyOrderLineRepository;
        this.medicationRepository = medicationRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<PharmacyOrderLineResponse> findByMedicalOrderId(Long medicalOrderId) {
        MedicalOrder medicalOrder = requireMedicalOrder(medicalOrderId);
        assertPharmacyOrder(medicalOrder);
        return pharmacyOrderLineRepository.findByMedicalOrder_IdOrderByIdAsc(medicalOrderId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<PharmacyOrderLineResponse> replaceLines(Long medicalOrderId, PharmacyOrderLinesReplaceRequest request) {
        MedicalOrder medicalOrder = requireMedicalOrder(medicalOrderId);
        assertPharmacyOrder(medicalOrder);
        assertLinesEditable(medicalOrder);

        List<PharmacyOrderLineItemRequest> items = request.lines() == null ? List.of() : request.lines();
        validateNoDuplicateMedications(items);

        List<PharmacyOrderLine> existing = pharmacyOrderLineRepository.findByMedicalOrder_IdOrderByIdAsc(medicalOrderId);
        Map<String, Object> prior = snapshotLines(existing);

        restoreStock(existing);
        pharmacyOrderLineRepository.deleteByMedicalOrder_Id(medicalOrderId);
        pharmacyOrderLineRepository.flush();

        List<PharmacyOrderLine> saved = new ArrayList<>();
        for (PharmacyOrderLineItemRequest item : items) {
            Medication medication = medicationRepository.findById(item.medicationId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No se encontró el medicamento con ID " + item.medicationId()));
            assertMedicationDispatchable(medication, item.quantity());

            medication.setCurrentStock(medication.getCurrentStock() - item.quantity());
            medicationRepository.save(medication);

            PharmacyOrderLine line = new PharmacyOrderLine();
            line.setMedicalOrder(medicalOrder);
            line.setMedication(medication);
            line.setQuantity(item.quantity());
            saved.add(pharmacyOrderLineRepository.save(line));
        }

        businessAuditRecorder.safeRecord(
                "medical-order-pharmacy",
                "PharmacyOrderLine",
                String.valueOf(medicalOrderId),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotLines(saved));

        return saved.stream().map(this::toResponse).toList();
    }

    @Transactional
    public void restoreStockForOrder(Long medicalOrderId) {
        MedicalOrder medicalOrder = requireMedicalOrder(medicalOrderId);
        if (!"FARMACIA".equalsIgnoreCase(medicalOrder.getOrderType())) {
            return;
        }
        List<PharmacyOrderLine> existing = pharmacyOrderLineRepository.findByMedicalOrder_IdOrderByIdAsc(medicalOrderId);
        if (existing.isEmpty()) {
            return;
        }
        Map<String, Object> prior = snapshotLines(existing);
        restoreStock(existing);
        businessAuditRecorder.safeRecord(
                "medical-order-pharmacy",
                "PharmacyOrderLine",
                String.valueOf(medicalOrderId),
                BusinessAuditActions.UPDATE,
                prior,
                Map.of("action", "RESTORE_STOCK_ON_ANNUL"));
    }

    @Transactional
    public void clearPharmacyLinesWithStockRestore(Long medicalOrderId) {
        List<PharmacyOrderLine> existing = pharmacyOrderLineRepository.findByMedicalOrder_IdOrderByIdAsc(medicalOrderId);
        if (existing.isEmpty()) {
            return;
        }
        Map<String, Object> prior = snapshotLines(existing);
        restoreStock(existing);
        pharmacyOrderLineRepository.deleteByMedicalOrder_Id(medicalOrderId);
        businessAuditRecorder.safeRecord(
                "medical-order-pharmacy",
                "PharmacyOrderLine",
                String.valueOf(medicalOrderId),
                BusinessAuditActions.DELETE,
                prior,
                null);
    }

    private MedicalOrder requireMedicalOrder(Long medicalOrderId) {
        return medicalOrderRepository.findById(medicalOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la orden médica: " + medicalOrderId));
    }

    private void assertPharmacyOrder(MedicalOrder medicalOrder) {
        if (!"FARMACIA".equalsIgnoreCase(medicalOrder.getOrderType())) {
            throw new BusinessRuleException("Las líneas de despacho solo aplican a órdenes tipo FARMACIA.");
        }
    }

    private void assertLinesEditable(MedicalOrder medicalOrder) {
        if (LOCKED_STATUSES.contains(medicalOrder.getStatus().toUpperCase())) {
            throw new BusinessRuleException(
                    "No se pueden modificar líneas de farmacia cuando la orden está "
                            + medicalOrder.getStatus()
                            + ".");
        }
    }

    private void validateNoDuplicateMedications(List<PharmacyOrderLineItemRequest> items) {
        Set<Long> seen = new HashSet<>();
        for (PharmacyOrderLineItemRequest item : items) {
            if (!seen.add(item.medicationId())) {
                throw new BusinessRuleException("No repita el mismo medicamento en la orden de farmacia.");
            }
        }
    }

    private void assertMedicationDispatchable(Medication medication, int quantity) {
        if (!medication.isActive()) {
            throw new BusinessRuleException("El medicamento \"" + medication.getName() + "\" está inactivo.");
        }
        if (medication.getCurrentStock() < quantity) {
            throw new BusinessRuleException(
                    "Stock insuficiente para \""
                            + medication.getName()
                            + "\". Disponible: "
                            + medication.getCurrentStock()
                            + ", solicitado: "
                            + quantity
                            + ".");
        }
    }

    private void restoreStock(List<PharmacyOrderLine> lines) {
        for (PharmacyOrderLine line : lines) {
            Medication medication = line.getMedication();
            medication.setCurrentStock(medication.getCurrentStock() + line.getQuantity());
            medicationRepository.save(medication);
        }
    }

    private Map<String, Object> snapshotLines(List<PharmacyOrderLine> lines) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        List<Map<String, Object>> items = new ArrayList<>();
        for (PharmacyOrderLine line : lines) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("medicationId", line.getMedication().getId());
            item.put("medicationName", line.getMedication().getName());
            item.put("quantity", line.getQuantity());
            items.add(item);
        }
        snapshot.put("lines", items);
        return snapshot;
    }

    private PharmacyOrderLineResponse toResponse(PharmacyOrderLine line) {
        return new PharmacyOrderLineResponse(
                line.getId(),
                line.getMedicalOrder().getId(),
                line.getMedication().getId(),
                line.getMedication().getName(),
                line.getQuantity());
    }
}
