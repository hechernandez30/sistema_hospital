package com.hospital.medicalorder.dto;

public record PharmacyOrderLineResponse(
        Long id,
        Long medicalOrderId,
        Long medicationId,
        String medicationName,
        Integer quantity) {}
