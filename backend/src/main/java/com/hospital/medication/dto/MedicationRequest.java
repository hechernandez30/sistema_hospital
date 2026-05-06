package com.hospital.medication.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MedicationRequest(
        @NotBlank(message = "El nombre del medicamento es obligatorio")
        @Size(max = 150, message = "El nombre no debe superar 150 caracteres")
        String name,
        @Size(max = 100, message = "La presentación no debe superar 100 caracteres")
        String presentation,
        @Size(max = 30, message = "La unidad no debe superar 30 caracteres")
        String unit,
        @NotNull(message = "El stock actual es obligatorio")
        @Min(value = 0, message = "El stock actual no puede ser negativo")
        Integer currentStock,
        @NotNull(message = "El stock mínimo es obligatorio")
        @Min(value = 0, message = "El stock mínimo no puede ser negativo")
        Integer minimumStock,
        Boolean active
) {}
