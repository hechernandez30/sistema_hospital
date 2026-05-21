package com.hospital.insurance.controller;

import com.hospital.insurance.dto.InsuranceRequest;
import com.hospital.insurance.dto.InsuranceResponse;
import com.hospital.insurance.service.InsuranceService;
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
@RequestMapping("/api/patients/{patientId}/insurances")
public class InsuranceController {

    private final InsuranceService insuranceService;

    public InsuranceController(InsuranceService insuranceService) {
        this.insuranceService = insuranceService;
    }

    @GetMapping
    public List<InsuranceResponse> list(
            @PathVariable Long patientId,
            @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive) {
        return insuranceService.findByPatient(patientId, includeInactive);
    }

    @GetMapping("/{insuranceId}")
    public InsuranceResponse get(@PathVariable Long patientId, @PathVariable Long insuranceId) {
        return insuranceService.findByPatientAndId(patientId, insuranceId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InsuranceResponse create(
            @PathVariable Long patientId,
            @Valid @RequestBody InsuranceRequest request) {
        return insuranceService.create(patientId, request);
    }

    @PutMapping("/{insuranceId}")
    public InsuranceResponse update(
            @PathVariable Long patientId,
            @PathVariable Long insuranceId,
            @Valid @RequestBody InsuranceRequest request) {
        return insuranceService.update(patientId, insuranceId, request);
    }

    @DeleteMapping("/{insuranceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long patientId, @PathVariable Long insuranceId) {
        insuranceService.delete(patientId, insuranceId);
    }
}
