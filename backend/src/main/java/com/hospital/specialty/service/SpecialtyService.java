package com.hospital.specialty.service;

import com.hospital.exception.ResourceNotFoundException;
import com.hospital.specialty.dto.SpecialtyRequest;
import com.hospital.specialty.dto.SpecialtyResponse;
import com.hospital.specialty.entity.Specialty;
import com.hospital.specialty.repository.SpecialtyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SpecialtyService {

    private final SpecialtyRepository specialtyRepository;

    public SpecialtyService(SpecialtyRepository specialtyRepository) {
        this.specialtyRepository = specialtyRepository;
    }

    @Transactional(readOnly = true)
    public List<SpecialtyResponse> findAll() {
        return specialtyRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SpecialtyResponse findById(Long id) {
        return toResponse(specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found: " + id)));
    }

    @Transactional
    public SpecialtyResponse create(SpecialtyRequest request) {
        Specialty s = new Specialty();
        s.setName(request.name().trim());
        s.setDurationMinutes(request.durationMinutes());
        return toResponse(specialtyRepository.save(s));
    }

    @Transactional
    public SpecialtyResponse update(Long id, SpecialtyRequest request) {
        Specialty s = specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Specialty not found: " + id));
        s.setName(request.name().trim());
        s.setDurationMinutes(request.durationMinutes());
        return toResponse(specialtyRepository.save(s));
    }

    @Transactional
    public void delete(Long id) {
        if (!specialtyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Specialty not found: " + id);
        }
        specialtyRepository.deleteById(id);
    }

    private SpecialtyResponse toResponse(Specialty s) {
        return new SpecialtyResponse(s.getId(), s.getName(), s.getDurationMinutes());
    }
}
