package com.hospital.specialty.service;

import com.hospital.auditlog.BusinessAuditActions;
import com.hospital.auditlog.BusinessAuditRecorder;
import com.hospital.exception.ResourceNotFoundException;
import com.hospital.specialty.dto.SpecialtyRequest;
import com.hospital.specialty.dto.SpecialtyResponse;
import com.hospital.specialty.entity.Specialty;
import com.hospital.specialty.repository.SpecialtyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SpecialtyService {

    private final SpecialtyRepository specialtyRepository;
    private final BusinessAuditRecorder businessAuditRecorder;

    public SpecialtyService(SpecialtyRepository specialtyRepository, BusinessAuditRecorder businessAuditRecorder) {
        this.specialtyRepository = specialtyRepository;
        this.businessAuditRecorder = businessAuditRecorder;
    }

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> findAll() {
        return specialtyRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SpecialtyResponse findById(Long id) {
        return toResponse(specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la especialidad: " + id)));
    }

    @Transactional
    public SpecialtyResponse create(SpecialtyRequest request) {
        Specialty s = new Specialty();
        s.setName(request.name().trim());
        s.setDurationMinutes(request.durationMinutes());
        Specialty saved = specialtyRepository.save(s);
        businessAuditRecorder.safeRecord(
                "specialties",
                "Specialty",
                String.valueOf(saved.getId()),
                BusinessAuditActions.CREATE,
                null,
                snapshotSpecialtyMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public SpecialtyResponse update(Long id, SpecialtyRequest request) {
        Specialty s = specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la especialidad: " + id));
        Map<String, Object> prior = snapshotSpecialtyMinimal(s);
        s.setName(request.name().trim());
        s.setDurationMinutes(request.durationMinutes());
        Specialty saved = specialtyRepository.save(s);
        businessAuditRecorder.safeRecord(
                "specialties",
                "Specialty",
                String.valueOf(id),
                BusinessAuditActions.UPDATE,
                prior,
                snapshotSpecialtyMinimal(saved));
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Specialty s = specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró la especialidad: " + id));
        Map<String, Object> prior = snapshotSpecialtyMinimal(s);
        specialtyRepository.deleteById(id);
        businessAuditRecorder.safeRecord(
                "specialties", "Specialty", String.valueOf(id), BusinessAuditActions.DELETE, prior, null);
    }

    private SpecialtyResponse toResponse(Specialty s) {
        return new SpecialtyResponse(s.getId(), s.getName(), s.getDurationMinutes());
    }

    private static Map<String, Object> snapshotSpecialtyMinimal(Specialty s) {
        Map<String, Object> m = new LinkedHashMap<>();
        if (s.getId() != null) {
            m.put("specialtyId", s.getId());
        }
        m.put("name", s.getName());
        if (s.getDurationMinutes() != null) {
            m.put("durationMinutes", s.getDurationMinutes());
        }
        return m;
    }
}
