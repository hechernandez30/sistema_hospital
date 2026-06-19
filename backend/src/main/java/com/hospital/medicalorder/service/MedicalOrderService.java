package com.hospital.medicalorder.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.medicalcare.entity.MedicalCare;
import com.hospital.medicalcare.repository.MedicalCareRepository;
import com.hospital.medicalorder.dto.MedicalOrderCreateRequest;
import com.hospital.medicalorder.dto.MedicalOrderResponse;
import com.hospital.medicalorder.dto.MedicalOrderUpdateRequest;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.medicalorder.repository.MedicalOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MedicalOrderService {

    private static final Set<String> ALLOWED_TYPE = Set.of("LABORATORIO", "IMAGEN", "FARMACIA", "HOSPITALIZACION");
    private static final Set<String> ALLOWED_STATUS = Set.of("PENDIENTE", "EN_PROCESO", "COMPLETADO", "RECHAZADO", "PARCIAL", "ANULADO");

    private final MedicalOrderRepository medicalOrderRepository;
    private final MedicalCareRepository medicalCareRepository;
    private final BusinessAuditRecorder businessAuditRecorder;
    private final PharmacyOrderLineService pharmacyOrderLineService;

    public MedicalOrderService(
            MedicalOrderRepository medicalOrderRepository,
            MedicalCareRepository medicalCareRepository,
            BusinessAuditRecorder businessAuditRecorder,
            PharmacyOrderLineService pharmacyOrderLineService) {
        this.medicalOrderRepository = medicalOrderRepository;
        this.medicalCareRepository = medicalCareRepository;
        this.businessAuditRecorder = businessAuditRecorder;
        this.pharmacyOrderLineService = pharmacyOrderLineService;
    }

    @Transactional(readOnly = true)
    public List<MedicalOrderResponse> findAll() {
        return medicalOrderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MedicalOrderResponse findById(Long id) {
        return toResponse(medicalOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la orden médica: " + id)));
    }

    @Transactional(readOnly = true)
    public List<MedicalOrderResponse> findByMedicalCare(Long medicalCareId) {
        return medicalOrderRepository.findByMedicalCare_Id(medicalCareId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public MedicalOrderResponse create(MedicalOrderCreateRequest request) {
        MedicalOrder medicalOrder = new MedicalOrder();
        String priority = request.priority() == null || request.priority().isBlank() ? "NORMAL" : request.priority().trim();
        mapCommon(medicalOrder, request.medicalCareId(), request.orderType(), request.description(),
                priority, request.status(), request.observations());
        MedicalOrder saved = medicalOrderRepository.save(medicalOrder);
        businessAuditRecorder.safeRecord(
                "medical-order",
                "MedicalOrder",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotMedicalOrderMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public MedicalOrderResponse update(Long id, MedicalOrderUpdateRequest request) {
        MedicalOrder medicalOrder = medicalOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la orden médica: " + id));
        String priorStatus = medicalOrder.getStatus();
        String priorType = medicalOrder.getOrderType();
        if ("FARMACIA".equalsIgnoreCase(priorType) && !"FARMACIA".equalsIgnoreCase(request.orderType())) {
            pharmacyOrderLineService.clearPharmacyLinesWithStockRestore(id);
        }
        Map<String, Object> prior = snapshotMedicalOrderMinimal(medicalOrder);
        mapCommon(medicalOrder, request.medicalCareId(), request.orderType(), request.description(),
                request.priority().trim(), request.status(), request.observations());
        if ("FARMACIA".equalsIgnoreCase(medicalOrder.getOrderType())
                && "ANULADO".equalsIgnoreCase(request.status())
                && !"ANULADO".equalsIgnoreCase(priorStatus)) {
            pharmacyOrderLineService.restoreStockForOrder(id);
        }
        MedicalOrder saved = medicalOrderRepository.save(medicalOrder);
        businessAuditRecorder.safeRecord(
                "medical-order",
                "MedicalOrder",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotMedicalOrderMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        MedicalOrder medicalOrder = medicalOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la orden médica: " + id));
        if ("ANULADO".equalsIgnoreCase(medicalOrder.getStatus())) {
            return;
        }
        if ("FARMACIA".equalsIgnoreCase(medicalOrder.getOrderType())) {
            pharmacyOrderLineService.restoreStockForOrder(id);
        }
        Map<String, Object> prior = snapshotMedicalOrderMinimal(medicalOrder);
        medicalOrder.setStatus("ANULADO");
        MedicalOrder saved = medicalOrderRepository.save(medicalOrder);
        businessAuditRecorder.safeRecord(
                "medical-order",
                "MedicalOrder",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotMedicalOrderMinimal(saved));
    }

    private void mapCommon(
            MedicalOrder medicalOrder,
            Long medicalCareId,
            String orderType,
            String description,
            String priority,
            String status,
            String observations) {
        if (!ALLOWED_TYPE.contains(orderType)) {
            throw new BusinessRuleException(
                    "Tipo de orden no válido. Use LABORATORIO (estudios clínicos), IMAGEN, FARMACIA u HOSPITALIZACION.");
        }
        if (!ALLOWED_STATUS.contains(status)) {
            throw new BusinessRuleException(
                    "Estado de orden no válido: PENDIENTE, EN_PROCESO, COMPLETADO, RECHAZADO, PARCIAL o ANULADO.");
        }
        MedicalCare medicalCare = medicalCareRepository.findById(medicalCareId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la atención médica con ID "
                                + medicalCareId
                                + ". Cree o verifique el episodio en Atención médica antes de registrar la orden."));

        medicalOrder.setMedicalCare(medicalCare);
        medicalOrder.setOrderType(orderType);
        medicalOrder.setDescription(description);
        medicalOrder.setPriority(priority);
        medicalOrder.setStatus(status);
        medicalOrder.setObservations(observations);
    }

    private Map<String, Object> snapshotMedicalOrderMinimal(MedicalOrder o) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (o.getId() != null) {
            m.put("medicalOrderId", o.getId());
        }
        m.put("medicalCareId", o.getMedicalCare().getId());
        m.put("orderType", o.getOrderType());
        m.put("status", o.getStatus());
        if (o.getPriority() != null && !o.getPriority().isBlank()) {
            m.put("priority", o.getPriority());
        }
        if (o.getOrderDate() != null) {
            m.put("orderDate", o.getOrderDate().toString());
        }
        return m;
    }

    private MedicalOrderResponse toResponse(MedicalOrder medicalOrder) {
        return new MedicalOrderResponse(
                medicalOrder.getId(),
                medicalOrder.getMedicalCare().getId(),
                medicalOrder.getOrderType(),
                medicalOrder.getDescription(),
                medicalOrder.getPriority(),
                medicalOrder.getStatus(),
                medicalOrder.getObservations(),
                medicalOrder.getOrderDate());
    }
}
