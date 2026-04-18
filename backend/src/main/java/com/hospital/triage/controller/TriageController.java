package com.hospital.triage.controller;

import com.hospital.triage.dto.TriageCreateRequest;
import com.hospital.triage.dto.TriageResponse;
import com.hospital.triage.dto.TriageUpdateRequest;
import com.hospital.triage.service.TriageService;
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
@RequestMapping("/api/triage")
public class TriageController {

    private final TriageService triageService;

    public TriageController(TriageService triageService) {
        this.triageService = triageService;
    }

    @GetMapping
    public List<TriageResponse> list(@RequestParam(required = false) Long admissionId) {
        if (admissionId != null) {
            return triageService.findByAdmission(admissionId);
        }
        return triageService.findAll();
    }

    @GetMapping("/{id}")
    public TriageResponse get(@PathVariable Long id) {
        return triageService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TriageResponse create(@Valid @RequestBody TriageCreateRequest request) {
        return triageService.create(request);
    }

    @PutMapping("/{id}")
    public TriageResponse update(@PathVariable Long id, @Valid @RequestBody TriageUpdateRequest request) {
        return triageService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        triageService.delete(id);
    }
}
