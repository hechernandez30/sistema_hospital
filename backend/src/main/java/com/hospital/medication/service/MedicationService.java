package com.hospital.medication.service;

import com.hospital.exception.ResourceNotFoundException;
import com.hospital.medication.dto.MedicationRequest;
import com.hospital.medication.dto.MedicationResponse;
import com.hospital.medication.entity.Medication;
import com.hospital.medication.repository.MedicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MedicationService {

    private final MedicationRepository medicationRepository;

    public MedicationService(MedicationRepository medicationRepository) {
        this.medicationRepository = medicationRepository;
    }

    @Transactional(readOnly = true)
    public List<MedicationResponse> findAll() {
        return medicationRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public MedicationResponse findById(Long id) {
        return toResponse(medicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medication not found: " + id)));
    }

    @Transactional
    public MedicationResponse create(MedicationRequest request) {
        Medication m = new Medication();
        map(m, request);
        return toResponse(medicationRepository.save(m));
    }

    @Transactional
    public MedicationResponse update(Long id, MedicationRequest request) {
        Medication m = medicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medication not found: " + id));
        map(m, request);
        return toResponse(medicationRepository.save(m));
    }

    @Transactional
    public void delete(Long id) {
        if (!medicationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Medication not found: " + id);
        }
        medicationRepository.deleteById(id);
    }

    private void map(Medication m, MedicationRequest request) {
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
