package com.hospital.laboratory.controller;

import com.hospital.laboratory.dto.LaboratoryCreateRequest;
import com.hospital.laboratory.dto.LaboratoryResponse;
import com.hospital.laboratory.dto.LaboratoryUpdateRequest;
import com.hospital.laboratory.service.LaboratoryService;
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
@RequestMapping("/api/laboratory")
public class LaboratoryController {

    private final LaboratoryService laboratoryService;

    public LaboratoryController(LaboratoryService laboratoryService) {
        this.laboratoryService = laboratoryService;
    }

    @GetMapping
    public List<LaboratoryResponse> list(@RequestParam(required = false) Long medicalOrderId) {
        if (medicalOrderId != null) {
            return List.of(laboratoryService.findByMedicalOrderId(medicalOrderId));
        }
        return laboratoryService.findAll();
    }

    @GetMapping("/{id}")
    public LaboratoryResponse get(@PathVariable Long id) {
        return laboratoryService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LaboratoryResponse create(@Valid @RequestBody LaboratoryCreateRequest request) {
        return laboratoryService.create(request);
    }

    @PutMapping("/{id}")
    public LaboratoryResponse update(@PathVariable Long id, @Valid @RequestBody LaboratoryUpdateRequest request) {
        return laboratoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        laboratoryService.delete(id);
    }
}
