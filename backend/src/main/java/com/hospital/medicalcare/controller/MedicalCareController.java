package com.hospital.medicalcare.controller;

import com.hospital.medicalcare.dto.MedicalCareCreateRequest;
import com.hospital.medicalcare.dto.MedicalCareResponse;
import com.hospital.medicalcare.dto.MedicalCareUpdateRequest;
import com.hospital.medicalcare.service.MedicalCareService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medical-cares")
public class MedicalCareController {

    private final MedicalCareService medicalCareService;

    public MedicalCareController(MedicalCareService medicalCareService) {
        this.medicalCareService = medicalCareService;
    }

    @GetMapping
    public List<MedicalCareResponse> list(@RequestParam(required = false) Long patientId) {
        return medicalCareService.listForCurrentUser(patientId);
    }

    @GetMapping("/{id}")
    public MedicalCareResponse get(@PathVariable Long id) {
        return medicalCareService.findByIdForCurrentUser(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalCareResponse create(@Valid @RequestBody MedicalCareCreateRequest request) {
        return medicalCareService.create(request);
    }

    @PutMapping("/{id}")
    public MedicalCareResponse update(@PathVariable Long id, @Valid @RequestBody MedicalCareUpdateRequest request) {
        return medicalCareService.updateForCurrentUser(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        medicalCareService.deleteForCurrentUser(id);
    }
}
