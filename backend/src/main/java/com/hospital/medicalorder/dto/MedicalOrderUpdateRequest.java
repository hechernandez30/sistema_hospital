package com.hospital.medicalorder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record MedicalOrderUpdateRequest(
        @NotNull(message = "La atención médica es obligatoria")
        Long medicalCareId,
        @NotBlank(message = "El tipo de orden es obligatorio")
        @Pattern(
                regexp = "LABORATORIO|IMAGEN|FARMACIA|HOSPITALIZACION",
                message = "El tipo de orden debe ser LABORATORIO, IMAGEN, FARMACIA u HOSPITALIZACION")
        String orderType,
        @NotBlank(message = "La descripción es obligatoria")
        String description,
        @NotBlank(message = "La prioridad es obligatoria")
        String priority,
        @NotBlank(message = "El estado de la orden es obligatorio")
        @Pattern(
                regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO|PARCIAL|ANULADO",
                message =
                        "El estado debe ser PENDIENTE, EN_PROCESO, COMPLETADO, RECHAZADO, PARCIAL o ANULADO")
        String status,
        String observations
) {}
