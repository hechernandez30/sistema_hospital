package com.hospital.imaging.service;

import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.imaging.dto.ImagingStudyCreateRequest;
import com.hospital.imaging.dto.ImagingStudyResponse;
import com.hospital.imaging.dto.ImagingStudyUpdateRequest;
import com.hospital.imaging.entity.ImagingStudy;
import com.hospital.imaging.repository.ImagingStudyRepository;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.medicalorder.repository.MedicalOrderRepository;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ImagingStudyService {

    private static final String ORDER_TYPE_IMAGE = "IMAGEN";

    private final ImagingStudyRepository imagingStudyRepository;
    private final MedicalOrderRepository medicalOrderRepository;
    private final StaffRepository staffRepository;

    public ImagingStudyService(
            ImagingStudyRepository imagingStudyRepository,
            MedicalOrderRepository medicalOrderRepository,
            StaffRepository staffRepository) {
        this.imagingStudyRepository = imagingStudyRepository;
        this.medicalOrderRepository = medicalOrderRepository;
        this.staffRepository = staffRepository;
    }

    @Transactional(readOnly = true)
    public List<ImagingStudyResponse> findAll() {
        return imagingStudyRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ImagingStudyResponse findById(Long id) {
        return toResponse(imagingStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imaging study not found: " + id)));
    }

    @Transactional(readOnly = true)
    public ImagingStudyResponse findByMedicalOrderId(Long medicalOrderId) {
        return toResponse(imagingStudyRepository.findByMedicalOrder_Id(medicalOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Imaging study not found for order: " + medicalOrderId)));
    }

    @Transactional
    public ImagingStudyResponse create(ImagingStudyCreateRequest request) {
        MedicalOrder order = medicalOrderRepository.findById(request.medicalOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Medical order not found: " + request.medicalOrderId()));
        if (!ORDER_TYPE_IMAGE.equals(order.getOrderType())) {
            throw new BusinessRuleException("Medical order must be of type IMAGEN");
        }
        if (imagingStudyRepository.existsByMedicalOrder_Id(order.getId())) {
            throw new BusinessRuleException("An imaging study already exists for this order");
        }
        ImagingStudy study = new ImagingStudy();
        study.setMedicalOrder(order);
        study.setStudyType(request.studyType().trim());
        study.setScheduledAt(request.scheduledAt());
        study.setPerformedAt(request.performedAt());
        study.setReportResult(request.reportResult());
        study.setResultFile(request.resultFile());
        study.setStatus(request.status() != null && !request.status().isBlank() ? request.status() : "PENDIENTE");
        study.setResponsibleStaff(resolveStaff(request.responsibleStaffId()));
        return toResponse(imagingStudyRepository.save(study));
    }

    @Transactional
    public ImagingStudyResponse update(Long id, ImagingStudyUpdateRequest request) {
        ImagingStudy study = imagingStudyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imaging study not found: " + id));
        study.setStudyType(request.studyType().trim());
        study.setScheduledAt(request.scheduledAt());
        study.setPerformedAt(request.performedAt());
        study.setReportResult(request.reportResult());
        study.setResultFile(request.resultFile());
        study.setStatus(request.status());
        study.setResponsibleStaff(resolveStaff(request.responsibleStaffId()));
        return toResponse(imagingStudyRepository.save(study));
    }

    @Transactional
    public void delete(Long id) {
        if (!imagingStudyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Imaging study not found: " + id);
        }
        imagingStudyRepository.deleteById(id);
    }

    private Staff resolveStaff(Long staffId) {
        if (staffId == null) {
            return null;
        }
        return staffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + staffId));
    }

    private ImagingStudyResponse toResponse(ImagingStudy study) {
        return new ImagingStudyResponse(
                study.getId(),
                study.getMedicalOrder().getId(),
                study.getStudyType(),
                study.getScheduledAt(),
                study.getPerformedAt(),
                study.getReportResult(),
                study.getResultFile(),
                study.getStatus(),
                study.getResponsibleStaff() != null ? study.getResponsibleStaff().getId() : null);
    }
}
