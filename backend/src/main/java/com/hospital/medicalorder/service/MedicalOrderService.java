package com.hospital.medicalorder.service;

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

import java.util.List;
import java.util.Set;

@Service
public class MedicalOrderService {

    private static final Set<String> ALLOWED_TYPE = Set.of("LABORATORIO", "IMAGEN", "FARMACIA", "HOSPITALIZACION");
    private static final Set<String> ALLOWED_STATUS = Set.of("PENDIENTE", "EN_PROCESO", "COMPLETADO", "RECHAZADO", "PARCIAL", "ANULADO");

    private final MedicalOrderRepository medicalOrderRepository;
    private final MedicalCareRepository medicalCareRepository;

    public MedicalOrderService(MedicalOrderRepository medicalOrderRepository, MedicalCareRepository medicalCareRepository) {
        this.medicalOrderRepository = medicalOrderRepository;
        this.medicalCareRepository = medicalCareRepository;
    }

    @Transactional(readOnly = true)
    public List<MedicalOrderResponse> findAll() {
        return medicalOrderRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MedicalOrderResponse findById(Long id) {
        return toResponse(medicalOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical order not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<MedicalOrderResponse> findByMedicalCare(Long medicalCareId) {
        return medicalOrderRepository.findByMedicalCare_Id(medicalCareId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public MedicalOrderResponse create(MedicalOrderCreateRequest request) {
        MedicalOrder medicalOrder = new MedicalOrder();
        String priority = request.priority() == null || request.priority().isBlank() ? "NORMAL" : request.priority();
        mapCommon(medicalOrder, request.medicalCareId(), request.orderType(), request.description(),
                priority, request.status(), request.observations());
        return toResponse(medicalOrderRepository.save(medicalOrder));
    }

    @Transactional
    public MedicalOrderResponse update(Long id, MedicalOrderUpdateRequest request) {
        MedicalOrder medicalOrder = medicalOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical order not found: " + id));
        mapCommon(medicalOrder, request.medicalCareId(), request.orderType(), request.description(),
                request.priority(), request.status(), request.observations());
        return toResponse(medicalOrderRepository.save(medicalOrder));
    }

    @Transactional
    public void delete(Long id) {
        if (!medicalOrderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Medical order not found: " + id);
        }
        medicalOrderRepository.deleteById(id);
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
            throw new BusinessRuleException("Invalid medical order type");
        }
        if (!ALLOWED_STATUS.contains(status)) {
            throw new BusinessRuleException("Invalid medical order status");
        }
        MedicalCare medicalCare = medicalCareRepository.findById(medicalCareId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical care not found: " + medicalCareId));

        medicalOrder.setMedicalCare(medicalCare);
        medicalOrder.setOrderType(orderType);
        medicalOrder.setDescription(description);
        medicalOrder.setPriority(priority);
        medicalOrder.setStatus(status);
        medicalOrder.setObservations(observations);
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
