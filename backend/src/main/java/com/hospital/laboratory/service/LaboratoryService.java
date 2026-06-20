package com.hospital.laboratory.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.laboratory.attachment.LaboratoryAttachmentCodec;
import com.hospital.laboratory.dto.LaboratoryAttachmentMetadataResponse;
import com.hospital.laboratory.dto.LaboratoryCreateRequest;
import com.hospital.laboratory.dto.LaboratoryResponse;
import com.hospital.laboratory.dto.LaboratoryUpdateRequest;
import com.hospital.laboratory.entity.Laboratory;
import com.hospital.laboratory.repository.LaboratoryRepository;
import com.hospital.laboratory.support.LaboratoryRecordNumberGenerator;
import com.hospital.medicalorder.entity.MedicalOrder;
import com.hospital.medicalorder.repository.MedicalOrderRepository;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.time.LocalDate;

@Service
public class LaboratoryService {

    private static final String ORDER_TYPE_LAB = "LABORATORIO";
    private static final Set<String> ALLOWED_LAB_STATUS =
            Set.of("PENDIENTE", "EN_PROCESO", "COMPLETADO", "RECHAZADO", "ANULADO");

    private final LaboratoryRepository laboratoryRepository;
    private final MedicalOrderRepository medicalOrderRepository;
    private final StaffRepository staffRepository;
    private final BusinessAuditRecorder businessAuditRecorder;
    private final LaboratoryAttachmentCodec attachmentCodec;

    public LaboratoryService(
            LaboratoryRepository laboratoryRepository,
            MedicalOrderRepository medicalOrderRepository,
            StaffRepository staffRepository,
            BusinessAuditRecorder businessAuditRecorder,
            LaboratoryAttachmentCodec attachmentCodec) {
        this.laboratoryRepository = laboratoryRepository;
        this.medicalOrderRepository = medicalOrderRepository;
        this.staffRepository = staffRepository;
        this.businessAuditRecorder = businessAuditRecorder;
        this.attachmentCodec = attachmentCodec;
    }

    @Transactional(readOnly = true)
    public List<LaboratoryResponse> findAll() {
        return laboratoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public LaboratoryResponse findById(Long id) {
        return toResponse(laboratoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el registro de laboratorio: " + id)));
    }

    @Transactional(readOnly = true)
    public LaboratoryResponse findByMedicalOrderId(Long medicalOrderId) {
        return toResponse(laboratoryRepository.findByMedicalOrder_Id(medicalOrderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No hay registro de laboratorio para la orden médica " + medicalOrderId + ".")));
    }

    @Transactional
    public LaboratoryResponse create(LaboratoryCreateRequest request) {
        MedicalOrder order = medicalOrderRepository.findById(request.medicalOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No se encontró la orden médica con ID "
                                + request.medicalOrderId()
                                + ". Registre primero la orden desde Atención médica (tipo LABORATORIO)."));
        if (!ORDER_TYPE_LAB.equals(order.getOrderType())) {
            throw new BusinessRuleException(
                    "Solo se vincula laboratorio a órdenes de tipo LABORATORIO. La orden indicada es de tipo "
                            + order.getOrderType()
                            + ".");
        }
        if (laboratoryRepository.existsByMedicalOrder_Id(order.getId())) {
            throw new BusinessRuleException(
                    "Ya existe un registro de laboratorio para esta orden médica; edite el registro existente.");
        }
        Laboratory lab = new Laboratory();
        lab.setMedicalOrder(order);
        applyCreate(lab, request);
        return saveNewLaboratory(lab);
    }

    /**
     * Crea registro de laboratorio pendiente al generar una orden médica tipo LABORATORIO (p. ej. desde atención).
     * Idempotente: no duplica si ya existe registro para la orden.
     */
    @Transactional
    public void ensurePendingRecordForMedicalOrder(MedicalOrder order) {
        if (!ORDER_TYPE_LAB.equals(order.getOrderType())) {
            return;
        }
        if (laboratoryRepository.existsByMedicalOrder_Id(order.getId())) {
            return;
        }
        Laboratory lab = new Laboratory();
        lab.setMedicalOrder(order);
        lab.setRequesterType("INTERNO");
        lab.setRequestType(null);
        lab.setRecordNumber(LaboratoryRecordNumberGenerator.nextFromExisting(
                laboratoryRepository.findAllRecordNumbers(), null, LocalDate.now()));
        lab.setSampleDescription(PENDING_TEXT);
        lab.setSampleReceived(false);
        lab.setSampleValid(null);
        lab.setIncident(PENDING_TEXT);
        lab.setResult(PENDING_TEXT);
        lab.setStatus("PENDIENTE");
        saveNewLaboratory(lab);
    }

    private LaboratoryResponse saveNewLaboratory(Laboratory lab) {
        Laboratory saved = laboratoryRepository.save(lab);
        businessAuditRecorder.safeRecord(
                "laboratory",
                "Laboratory",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotLaboratoryMinimal(saved));
        return toResponse(saved);
    }

    private static final String PENDING_TEXT = "Pendiente";

    @Transactional
    public LaboratoryResponse update(Long id, LaboratoryUpdateRequest request) {
        Laboratory lab = laboratoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el registro de laboratorio: " + id));
        Map<String, Object> prior = snapshotLaboratoryMinimal(lab);
        applyUpdate(lab, request);
        Laboratory saved = laboratoryRepository.save(lab);
        businessAuditRecorder.safeRecord(
                "laboratory",
                "Laboratory",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotLaboratoryMinimal(saved));
        return toResponse(saved);
    }

    /** Anulación lógica (Fase 8.2): {@code estado = ANULADO}. */
    @Transactional
    public void delete(Long id) {
        Laboratory lab = laboratoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el registro de laboratorio: " + id));
        if ("ANULADO".equalsIgnoreCase(lab.getStatus())) {
            return;
        }
        Map<String, Object> prior = snapshotLaboratoryMinimal(lab);
        lab.setStatus("ANULADO");
        Laboratory saved = laboratoryRepository.save(lab);
        businessAuditRecorder.safeRecord(
                "laboratory",
                "Laboratory",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotLaboratoryMinimal(saved));
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
        String createStatus = request.status() != null && !request.status().isBlank() ? request.status() : "PENDIENTE";
        ensureLaboratoryStatus(createStatus);
        if ("COMPLETADO".equals(createStatus)) {
            ensureCompletedHasAttachment(lab);
        }
        lab.setStatus(createStatus);
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
        ensureLaboratoryStatus(request.status());
        if ("COMPLETADO".equals(request.status())) {
            ensureCompletedHasAttachment(lab);
        }
        lab.setStatus(request.status());
        lab.setReceptionAt(request.receptionAt());
        lab.setResultAt(request.resultAt());
        lab.setResponsibleStaff(resolveStaff(request.responsibleStaffId()));
    }

    private static void ensureLaboratoryStatus(String status) {
        if (!ALLOWED_LAB_STATUS.contains(status)) {
            throw new BusinessRuleException(
                    "Estado de laboratorio no válido: use PENDIENTE, EN_PROCESO, COMPLETADO, RECHAZADO o ANULADO.");
        }
    }

    private void ensureCompletedHasAttachment(Laboratory lab) {
        if (!attachmentCodec.hasValidAttachment(lab.getAttachment())) {
            throw new BusinessRuleException(
                    "Para marcar como COMPLETADO debe adjuntar un archivo de resultado (PDF o imagen) mediante POST /api/laboratory/{id}/attachment.");
        }
    }

    private Map<String, Object> snapshotLaboratoryMinimal(Laboratory lab) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (lab.getId() != null) {
            m.put("laboratoryId", lab.getId());
        }
        m.put("medicalOrderId", lab.getMedicalOrder().getId());
        m.put("status", lab.getStatus());
        if (lab.getRequestType() != null) {
            m.put("requestType", lab.getRequestType());
        }
        return m;
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
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el personal: " + staffId));
    }

    private LaboratoryResponse toResponse(Laboratory lab) {
        LaboratoryAttachmentMetadataResponse attachment =
                attachmentCodec.toResponse(attachmentCodec.parse(lab.getAttachment()));
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
                attachment,
                lab.getStatus(),
                lab.getReceptionAt(),
                lab.getResultAt(),
                lab.getResponsibleStaff() != null ? lab.getResponsibleStaff().getId() : null);
    }
}
