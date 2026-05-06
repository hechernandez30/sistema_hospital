package com.hospital.report.dto;

import java.time.LocalDateTime;

public record LaboratoryReportRow(
        Long laboratoryId,
        Long medicalOrderId,
        String status,
        boolean sampleReceived,
        LocalDateTime receptionAt,
        LocalDateTime resultAt
) {}
