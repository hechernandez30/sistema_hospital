package com.hospital.medication.dto;

public record MedicationResponse(
        Long id,
        String name,
        String presentation,
        String unit,
        Integer currentStock,
        Integer minimumStock,
        boolean active
) {}
