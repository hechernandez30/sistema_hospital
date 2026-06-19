package com.hospital.medicalorder.controller;

import com.hospital.medicalorder.dto.MedicalOrderCreateRequest;
import com.hospital.medicalorder.dto.MedicalOrderResponse;
import com.hospital.medicalorder.dto.MedicalOrderUpdateRequest;
import com.hospital.medicalorder.dto.PharmacyOrderLineResponse;
import com.hospital.medicalorder.dto.PharmacyOrderLinesReplaceRequest;
import com.hospital.medicalorder.service.MedicalOrderService;
import com.hospital.medicalorder.service.PharmacyOrderLineService;
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
@RequestMapping("/api/medical-orders")
public class MedicalOrderController {

    private final MedicalOrderService medicalOrderService;
    private final PharmacyOrderLineService pharmacyOrderLineService;

    public MedicalOrderController(
            MedicalOrderService medicalOrderService, PharmacyOrderLineService pharmacyOrderLineService) {
        this.medicalOrderService = medicalOrderService;
        this.pharmacyOrderLineService = pharmacyOrderLineService;
    }

    @GetMapping
    public List<MedicalOrderResponse> list(@RequestParam(required = false) Long medicalCareId) {
        if (medicalCareId != null) {
            return medicalOrderService.findByMedicalCare(medicalCareId);
        }
        return medicalOrderService.findAll();
    }

    @GetMapping("/{id}")
    public MedicalOrderResponse get(@PathVariable Long id) {
        return medicalOrderService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalOrderResponse create(@Valid @RequestBody MedicalOrderCreateRequest request) {
        return medicalOrderService.create(request);
    }

    @PutMapping("/{id}")
    public MedicalOrderResponse update(@PathVariable Long id, @Valid @RequestBody MedicalOrderUpdateRequest request) {
        return medicalOrderService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        medicalOrderService.delete(id);
    }

    @GetMapping("/{id}/pharmacy-lines")
    public List<PharmacyOrderLineResponse> listPharmacyLines(@PathVariable Long id) {
        return pharmacyOrderLineService.findByMedicalOrderId(id);
    }

    @PutMapping("/{id}/pharmacy-lines")
    public List<PharmacyOrderLineResponse> replacePharmacyLines(
            @PathVariable Long id, @Valid @RequestBody PharmacyOrderLinesReplaceRequest request) {
        return pharmacyOrderLineService.replaceLines(id, request);
    }
}
