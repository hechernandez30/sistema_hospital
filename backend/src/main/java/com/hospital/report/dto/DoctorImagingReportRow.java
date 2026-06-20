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
        boolean hasReport,
        LocalDateTime orderDate,
        LocalDateTime scheduledAt,
        LocalDateTime performedAt) {}
