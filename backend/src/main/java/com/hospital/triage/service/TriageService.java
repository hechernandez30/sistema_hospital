package com.hospital.triage.service;

import com.hospital.admission.entity.Admission;
import com.hospital.admission.repository.AdmissionRepository;
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

import java.util.List;

@Service
public class TriageService {

    private final TriageRepository triageRepository;
    private final AdmissionRepository admissionRepository;
    private final StaffRepository staffRepository;

    public TriageService(
            TriageRepository triageRepository,
            AdmissionRepository admissionRepository,
            StaffRepository staffRepository) {
        this.triageRepository = triageRepository;
        this.admissionRepository = admissionRepository;
        this.staffRepository = staffRepository;
    }

    @Transactional(readOnly = true)
    public List<TriageResponse> findAll() {
        return triageRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TriageResponse findById(Long id) {
        return toResponse(triageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Triage not found: " + id)));
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
        return toResponse(triageRepository.save(triage));
    }

    @Transactional
    public TriageResponse update(Long id, TriageUpdateRequest request) {
        Triage triage = triageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Triage not found: " + id));
        mapCommon(triage, request.admissionId(), request.heartRate(), request.respiratoryRate(), request.systolicPressure(),
                request.diastolicPressure(), request.oxygenSaturation(), request.temperature(), request.pain(),
                request.symptoms(), request.priority(), request.targetMinutes(), request.responsibleStaffId());
        return toResponse(triageRepository.save(triage));
    }

    @Transactional
    public void delete(Long id) {
        if (!triageRepository.existsById(id)) {
            throw new ResourceNotFoundException("Triage not found: " + id);
        }
        triageRepository.deleteById(id);
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
                .orElseThrow(() -> new ResourceNotFoundException("Admission not found: " + admissionId));
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
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + staffId));
    }

    private Short toShort(Integer value) {
        return value == null ? null : value.shortValue();
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
