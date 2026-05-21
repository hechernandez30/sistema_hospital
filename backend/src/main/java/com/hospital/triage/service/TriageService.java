package com.hospital.triage.service;

import com.hospital.admission.AdmissionStatusRules;
import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.BusinessRuleException;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.staff.entity.Staff;
import com.hospital.staff.repository.StaffRepository;
import com.hospital.triage.dto.TriageCreateRequest;
import com.hospital.triage.dto.TriageResponse;
import com.hospital.triage.dto.TriageUpdateRequest;
import com.hospital.triage.entity.Triage;
import com.hospital.triage.repository.TriageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TriageService {

    private final TriageRepository triageRepository;
    private final AdmissionRepository admissionRepository;
    private final StaffRepository staffRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public TriageService(
            TriageRepository triageRepository,
            AdmissionRepository admissionRepository,
            StaffRepository staffRepository,
            BusinessAuditRecorder businessAuditRecorder) {
        this.triageRepository = triageRepository;
        this.admissionRepository = admissionRepository;
        this.staffRepository = staffRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<TriageResponse> findAll() {
        return triageRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TriageResponse findById(Long id) {
        return toResponse(triageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el triage: " + id)));
    }

    @Transactional(readOnly = true)
    public List<TriageResponse> findByAdmission(Long admissionId) {
        return triageRepository.findByAdmission_Id(admissionId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public TriageResponse create(TriageCreateRequest request) {
        Triage triage = new Triage();
        mapCommon(triage, request.admissionId(), request.heartRate(), request.respiratoryRate(), request.systolicPressure(),
                request.diastolicPressure(), request.oxygenSaturation(), request.temperature(), request.pain(),
                request.symptoms(), request.priority(), request.targetMinutes(), request.responsibleStaffId());
        Triage saved = triageRepository.save(triage);
        businessAuditRecorder.safeRecord(
                "triage",
                "Triage",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotTriageMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public TriageResponse update(Long id, TriageUpdateRequest request) {
        Triage triage = triageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el triage: " + id));
        Map<String, Object> prior = snapshotTriageMinimal(triage);
        mapCommon(triage, request.admissionId(), request.heartRate(), request.respiratoryRate(), request.systolicPressure(),
                request.diastolicPressure(), request.oxygenSaturation(), request.temperature(), request.pain(),
                request.symptoms(), request.priority(), request.targetMinutes(), request.responsibleStaffId());
        Triage saved = triageRepository.save(triage);
        businessAuditRecorder.safeRecord(
                "triage",
                "Triage",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotTriageMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Triage triage = triageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el triage: " + id));
        Map<String, Object> prior = snapshotTriageMinimal(triage);
        triageRepository.deleteById(id);
        businessAuditRecorder.safeRecord(
                "triage",
                "Triage",
                String.valueOf(id),
                BusinessAuditActions.DELETE,
                prior,
                null);
    }

    private void mapCommon(
            Triage triage,
            Long admissionId,
            Integer heartRate,
            Integer respiratoryRate,
            Integer systolicPressure,
            Integer diastolicPressure,
            java.math.BigDecimal oxygenSaturation,
            java.math.BigDecimal temperature,
            Integer pain,
            String symptoms,
            String priority,
            Integer targetMinutes,
            Long responsibleStaffId) {

        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la admisión: " + admissionId));
        if (AdmissionStatusRules.isClosedForNewAssistance(admission.getStatus())) {
            throw new BusinessRuleException(
                    "No se puede registrar ni modificar triage para una admisión en estado "
                            + admission.getStatus().trim().toUpperCase()
                            + ".");
        }
        Staff responsible = resolveStaff(responsibleStaffId);

        triage.setAdmission(admission);
        triage.setHeartRate(toShort(heartRate));
        triage.setRespiratoryRate(toShort(respiratoryRate));
        triage.setSystolicPressure(toShort(systolicPressure));
        triage.setDiastolicPressure(toShort(diastolicPressure));
        triage.setOxygenSaturation(oxygenSaturation);
        triage.setTemperature(temperature);
        triage.setPain(toShort(pain));
        triage.setSymptoms(symptoms);
        triage.setPriority(priority);
        triage.setTargetMinutes(targetMinutes);
        triage.setResponsibleStaff(responsible);
    }

    private Staff resolveStaff(Long staffId) {
        if (staffId == null) {
            return null;
        }
        return staffRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el personal: " + staffId));
    }

    private Short toShort(Integer value) {
        return value == null ? null : value.shortValue();
    }

    private Map<String, Object> snapshotTriageMinimal(Triage t) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (t.getId() != null) {
            m.put("triageId", t.getId());
        }
        if (t.getAdmission() != null && t.getAdmission().getId() != null) {
            m.put("admissionId", t.getAdmission().getId());
        }
        m.put("priority", t.getPriority());
        if (t.getTargetMinutes() != null) {
            m.put("targetMinutes", t.getTargetMinutes());
        }
        if (t.getRegisteredAt() != null) {
            m.put("registeredAt", t.getRegisteredAt().toString());
        }
        return m;
    }

    private TriageResponse toResponse(Triage t) {
        return new TriageResponse(
                t.getId(),
                t.getAdmission().getId(),
                t.getHeartRate(),
                t.getRespiratoryRate(),
                t.getSystolicPressure(),
                t.getDiastolicPressure(),
                t.getOxygenSaturation(),
                t.getTemperature(),
                t.getPain(),
                t.getSymptoms(),
                t.getPriority(),
                t.getTargetMinutes(),
                t.getResponsibleStaff() != null ? t.getResponsibleStaff().getId() : null,
                t.getRegisteredAt());
    }
}
