package com.hospital.imaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ImagingStudyCreateRequest(
        @NotNull(message = "La orden médica es obligatoria")
        Long medicalOrderId,
        @NotBlank(message = "El tipo de estudio es obligatorio")
        @Size(max = 100, message = "El tipo de estudio no debe superar 100 caracteres")
        String studyType,
        LocalDateTime scheduledAt,
        LocalDateTime performedAt,
        String reportResult,
        String resultFile,
        @Pattern(
                regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO",
                message = "El estado debe ser PENDIENTE, EN_PROCESO, COMPLETADO o RECHAZADO")
        String status,
        Long responsibleStaffId
) {}
