package com.hospital.medicalorder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record MedicalOrderUpdateRequest(
        @NotNull Long medicalCareId,
        @NotBlank
        @Pattern(regexp = "LABORATORIO|IMAGEN|FARMACIA|HOSPITALIZACION", message = "Invalid orderType")
        String orderType,
        @NotBlank String description,
        @NotBlank String priority,
        @NotBlank
        @Pattern(regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO|PARCIAL|ANULADO", message = "Invalid order status")
        String status,
        String observations
) {
}
