package com.hospital.report.dto;

import java.time.LocalDateTime;

public record DoctorImagingReportRow(
        Long imagingId,
        Long medicalOrderId,
        Long medicalCareId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String studyType,
        String status,
        LocalDateTime scheduledAt,
        LocalDateTime performedAt) {}
