package com.hospital.laboratory.service;

import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.laboratory.dto.LaboratoryCreateRequest;
import com.hospital.laboratory.dto.LaboratoryResponse;
import com.hospital.laboratory.dto.LaboratoryUpdateRequest;
import com.hospital.laboratory.entity.Laboratory;
import com.hospital.laboratory.repository.LaboratoryRepository;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.medicalorder.repository.MedicalOrderRepository;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LaboratoryService {

    private static final String ORDER_TYPE_LAB = "LABORATORIO";

    private final LaboratoryRepository laboratoryRepository;
    private final MedicalOrderRepository medicalOrderRepository;
    private final StaffRepository staffRepository;

    public LaboratoryService(
            LaboratoryRepository laboratoryRepository,
            MedicalOrderRepository medicalOrderRepository,
            StaffRepository staffRepository) {
        this.laboratoryRepository = laboratoryRepository;
        this.medicalOrderRepository = medicalOrderRepository;
        this.staffRepository = staffRepository;
    }

    @Transactional(readOnly = true)
    public List<LaboratoryResponse> findAll() {
        return laboratoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public LaboratoryResponse findById(Long id) {
        return toResponse(laboratoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory record not found: " + id)));
    }

    @Transactional(readOnly = true)
    public LaboratoryResponse findByMedicalOrderId(Long medicalOrderId) {
        return toResponse(laboratoryRepository.findByMedicalOrder_Id(medicalOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory record not found for order: " + medicalOrderId)));
    }

    @Transactional
    public LaboratoryResponse create(LaboratoryCreateRequest request) {
        MedicalOrder order = medicalOrderRepository.findById(request.medicalOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Medical order not found: " + request.medicalOrderId()));
        if (!ORDER_TYPE_LAB.equals(order.getOrderType())) {
            throw new BusinessRuleException("Medical order must be of type LABORATORIO");
        }
        if (laboratoryRepository.existsByMedicalOrder_Id(order.getId())) {
            throw new BusinessRuleException("A laboratory record already exists for this order");
        }
        Laboratory lab = new Laboratory();
        lab.setMedicalOrder(order);
        applyCreate(lab, request);
        return toResponse(laboratoryRepository.save(lab));
    }

    @Transactional
    public LaboratoryResponse update(Long id, LaboratoryUpdateRequest request) {
        Laboratory lab = laboratoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory record not found: " + id));
        applyUpdate(lab, request);
        return toResponse(laboratoryRepository.save(lab));
    }

    @Transactional
    public void delete(Long id) {
        if (!laboratoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Laboratory record not found: " + id);
        }
        laboratoryRepository.deleteById(id);
    }

    private void applyCreate(Laboratory lab, LaboratoryCreateRequest request) {
        lab.setRequesterType(blankToNull(request.requesterType()));
        lab.setRequestType(blankToNull(request.requestType()));
        lab.setRecordNumber(request.recordNumber());
        lab.setSampleDescription(request.sampleDescription());
        lab.setSampleReceived(request.sampleReceived() != null && request.sampleReceived());
        lab.setSampleValid(request.sampleValid());
        lab.setIncident(request.incident());
        lab.setResult(request.result());
        lab.setAttachment(request.attachment());
        lab.setStatus(request.status() != null && !request.status().isBlank() ? request.status() : "PENDIENTE");
        lab.setResponsibleStaff(resolveStaff(request.responsibleStaffId()));
    }

    private void applyUpdate(Laboratory lab, LaboratoryUpdateRequest request) {
        lab.setRequesterType(blankToNull(request.requesterType()));
        lab.setRequestType(blankToNull(request.requestType()));
        lab.setRecordNumber(request.recordNumber());
        lab.setSampleDescription(request.sampleDescription());
        lab.setSampleReceived(request.sampleReceived());
        lab.setSampleValid(request.sampleValid());
        lab.setIncident(request.incident());
        lab.setResult(request.result());
        lab.setAttachment(request.attachment());
        lab.setStatus(request.status());
        lab.setReceptionAt(request.receptionAt());
        lab.setResultAt(request.resultAt());
        lab.setResponsibleStaff(resolveStaff(request.responsibleStaffId()));
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s;
    }

    private Staff resolveStaff(Long staffId) {
        if (staffId == null) {
            return null;
        }
        return staffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + staffId));
    }

    private LaboratoryResponse toResponse(Laboratory lab) {
        return new LaboratoryResponse(
                lab.getId(),
                lab.getMedicalOrder().getId(),
                lab.getRequesterType(),
                lab.getRequestType(),
                lab.getRecordNumber(),
                lab.getSampleDescription(),
                lab.isSampleReceived(),
                lab.getSampleValid(),
                lab.getIncident(),
                lab.getResult(),
                lab.getAttachment(),
                lab.getStatus(),
                lab.getReceptionAt(),
                lab.getResultAt(),
                lab.getResponsibleStaff() != null ? lab.getResponsibleStaff().getId() : null);
    }
}
