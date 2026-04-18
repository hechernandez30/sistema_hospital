package com.hospital.admission.controller;

import com.hospital.admission.dto.AdmissionCreateRequest;
import com.hospital.admission.dto.AdmissionResponse;
import com.hospital.admission.dto.AdmissionUpdateRequest;
import com.hospital.admission.service.AdmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admissions")
public class AdmissionController {

    private final AdmissionService admissionService;

    public AdmissionController(AdmissionService admissionService) {
        this.admissionService = admissionService;
    }

    @GetMapping
    public List<AdmissionResponse> list() {
        return admissionService.findAll();
    }

    @GetMapping("/{id}")
    public AdmissionResponse get(@PathVariable Long id) {
        return admissionService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdmissionResponse create(@Valid @RequestBody AdmissionCreateRequest request) {
        return admissionService.create(request);
    }

    @PutMapping("/{id}")
    public AdmissionResponse update(@PathVariable Long id, @Valid @RequestBody AdmissionUpdateRequest request) {
        return admissionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        admissionService.delete(id);
    }
}
