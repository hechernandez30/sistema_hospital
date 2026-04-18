package com.hospital.medication.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MedicationRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 100) String presentation,
        @Size(max = 30) String unit,
        @NotNull @Min(0) Integer currentStock,
        @NotNull @Min(0) Integer minimumStock,
        Boolean active
) {}
