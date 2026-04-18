package com.hospital.imaging.dto;

import java.time.LocalDateTime;

public record ImagingStudyResponse(
        Long id,
        Long medicalOrderId,
        String studyType,
        LocalDateTime scheduledAt,
        LocalDateTime performedAt,
        String reportResult,
        String resultFile,
        String status,
        Long responsibleStaffId
) {}
