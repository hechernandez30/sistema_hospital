package com.hospital.report.dto;

import java.time.LocalDateTime;

public record DoctorLaboratoryReportRow(
        Long laboratoryId,
        Long medicalOrderId,
        Long medicalCareId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String recordNumber,
        String status,
        boolean sampleReceived,
        boolean hasAttachment,
        LocalDateTime orderDate,
        LocalDateTime receptionAt,
        LocalDateTime resultAt) {}
