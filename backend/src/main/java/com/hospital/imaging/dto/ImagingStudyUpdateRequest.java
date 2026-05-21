package com.hospital.imaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ImagingStudyUpdateRequest(
        @NotBlank(message = "El tipo de estudio es obligatorio")
        @Size(max = 100, message = "El tipo de estudio no debe superar 100 caracteres")
        String studyType,
        LocalDateTime scheduledAt,
        LocalDateTime performedAt,
        String reportResult,
        String resultFile,
        @NotBlank(message = "El estado es obligatorio")
        @Pattern(
                regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO|ANULADO",
                message = "El estado debe ser PENDIENTE, EN_PROCESO, COMPLETADO, RECHAZADO o ANULADO")
        String status,
        Long responsibleStaffId
) {}
