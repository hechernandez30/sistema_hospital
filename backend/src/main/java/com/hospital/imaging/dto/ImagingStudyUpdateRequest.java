package com.hospital.imaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ImagingStudyUpdateRequest(
        @NotBlank @Size(max = 100) String studyType,
        LocalDateTime scheduledAt,
        LocalDateTime performedAt,
        String reportResult,
        String resultFile,
        @NotBlank
        @Pattern(regexp = "PENDIENTE|EN_PROCESO|COMPLETADO|RECHAZADO", message = "Invalid status")
        String status,
        Long responsibleStaffId
) {}
