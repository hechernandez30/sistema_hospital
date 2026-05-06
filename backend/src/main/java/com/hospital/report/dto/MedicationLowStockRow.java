package com.hospital.report.dto;

public record MedicationLowStockRow(
        Long medicationId,
        String name,
        Integer currentStock,
        Integer minimumStock,
        boolean active
) {}
